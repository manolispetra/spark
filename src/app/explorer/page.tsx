"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useReadContract } from "wagmi";
import { createPublicClient, formatUnits, http } from "viem";
import { Loader2, Search, Coins, ArrowUpRight } from "lucide-react";
import { ADDRESSES } from "@/config/addresses";
import { ERC20_ABI, FACTORY_ABI, PAIR_ABI, ROUTER_ABI, TOKEN_FACTORY_ABI } from "@/abi";
import { pharosMainnet } from "@/config/chain";
import ShareToXButton from "@/components/ui/ShareToXButton";
import { fmtNum, truncate } from "@/lib/utils";

const PAGE = 30;

type TokenRow = {
  address: `0x${string}`;
  creator: `0x${string}`;
  symbol: string;
  name: string;
  totalSupply: bigint;
  createdAt: bigint;
  logoURI: string;
  /** SPARK V2 pair against WPROS, if any. */
  pair?: `0x${string}`;
  /** PROS price = WPROS reserve / token reserve (decimal-aware). */
  prosPrice?: number;
  /** Holder count is expensive to compute in real time; we leave it null until a subgraph is wired. */
  holders?: number;
  liquidityPros?: number;
};

export default function ExplorerPage() {
  const [page, setPage]       = useState(0);
  const [rows, setRows]       = useState<TokenRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [q, setQ]             = useState("");
  const [error, setError]     = useState<string | null>(null);

  const { data: total } = useReadContract({
    abi: TOKEN_FACTORY_ABI,
    address: ADDRESSES.TokenFactory as `0x${string}`,
    functionName: "totalTokens",
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const client = createPublicClient({ chain: pharosMainnet, transport: http() });

        const start = Math.max(0, Number(total ?? 0n) - (page + 1) * PAGE);
        const limit = Math.min(PAGE, Number(total ?? 0n) - start);

        if (limit <= 0) { if (!cancelled) setRows([]); return; }

        const records = await client.readContract({
          abi: TOKEN_FACTORY_ABI,
          address: ADDRESSES.TokenFactory as `0x${string}`,
          functionName: "tokensPaginated",
          args: [BigInt(start), BigInt(limit)],
        }) as readonly {
          token: `0x${string}`;
          creator: `0x${string}`;
          totalSupply: bigint;
          createdAt: bigint;
          name: string;
          symbol: string;
          logoURI: string;
        }[];

        // Reverse so newest first.
        const ordered = [...records].reverse();

        // Look up WPROS pair + reserves for each token.
        const wpros = ADDRESSES.WPROS as `0x${string}`;
        const pairCalls = await client.multicall({
          allowFailure: true,
          contracts: ordered.map((r) => ({
            abi: FACTORY_ABI,
            address: ADDRESSES.SparkV2Factory as `0x${string}`,
            functionName: "getPair" as const,
            args: [r.token, wpros] as const,
          })),
        });

        const pairs = ordered.map((r, i) =>
          pairCalls[i].status === "success" ? (pairCalls[i].result as `0x${string}`) : "0x0000000000000000000000000000000000000000",
        );

        const reserveCalls = await client.multicall({
          allowFailure: true,
          contracts: pairs.flatMap((p) => p === "0x0000000000000000000000000000000000000000" ? [] : [
            { abi: PAIR_ABI, address: p, functionName: "token0" as const },
            { abi: PAIR_ABI, address: p, functionName: "getReserves" as const },
          ]),
        });

        let cursor = 0;
        const out: TokenRow[] = ordered.map((r, i) => {
          const pair = pairs[i];
          if (pair === "0x0000000000000000000000000000000000000000") {
            return {
              address: r.token, creator: r.creator, symbol: r.symbol, name: r.name,
              totalSupply: r.totalSupply, createdAt: r.createdAt, logoURI: r.logoURI,
            };
          }
          const t0 = reserveCalls[cursor++].result as `0x${string}`;
          const reserves = reserveCalls[cursor++].result as readonly [bigint, bigint, number] | undefined;
          let prosPrice: number | undefined;
          let liquidityPros: number | undefined;
          if (reserves) {
            const isToken0 = t0.toLowerCase() === r.token.toLowerCase();
            const reserveToken = isToken0 ? reserves[0] : reserves[1];
            const reserveWPROS = isToken0 ? reserves[1] : reserves[0];
            if (reserveToken > 0n) {
              prosPrice = Number(formatUnits(reserveWPROS, 18)) /
                          Number(formatUnits(reserveToken, 18 /* generated tokens are 18 dec */));
            }
            liquidityPros = Number(formatUnits(reserveWPROS, 18)) * 2; // x2 for both sides
          }
          return {
            address: r.token, creator: r.creator, symbol: r.symbol, name: r.name,
            totalSupply: r.totalSupply, createdAt: r.createdAt, logoURI: r.logoURI,
            pair, prosPrice, liquidityPros,
          };
        });

        if (!cancelled) setRows(out);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load tokens");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [page, total]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    if (!q.trim()) return rows;
    const ql = q.trim().toLowerCase();
    return rows.filter((r) =>
      r.symbol.toLowerCase().includes(ql) ||
      r.name.toLowerCase().includes(ql) ||
      r.address.toLowerCase().includes(ql),
    );
  }, [rows, q]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Token Explorer</h1>
          <p className="mt-1 text-sm text-ink-dim">
            Every ERC-20 launched through the Spark Token Generator. Click a token to add liquidity, swap, or share it.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/generator" className="btn-primary">+ Spark a new token</Link>
        </div>
      </div>

      <div className="card mb-4 flex items-center gap-3 p-3">
        <Search className="h-4 w-4 text-ink-mute" />
        <input value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Search by symbol, name, or contract address…"
          className="flex-1 bg-transparent py-1.5 text-sm outline-none placeholder:text-ink-mute" />
        <span className="hidden text-xs text-ink-mute sm:block">{rows?.length ?? 0} tokens</span>
      </div>

      {loading && (
        <div className="card flex items-center justify-center gap-3 p-10 text-sm text-ink-dim">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading registry…
        </div>
      )}
      {error && <div className="card p-6 text-sm text-spark-orange">⚠ {error}</div>}

      {!loading && filtered.length === 0 && (
        <div className="card p-10 text-center text-sm text-ink-dim">
          {q ? "No tokens match your search." : "No tokens yet. Be the first — Spark one!"}
        </div>
      )}

      <div className="card overflow-hidden">
        {filtered.length > 0 && (
          <div className="hidden grid-cols-12 gap-3 border-b border-line/60 px-4 py-3 text-[11px] uppercase tracking-wider text-ink-mute md:grid">
            <div className="col-span-4">Token</div>
            <div className="col-span-2 text-right">PROS price</div>
            <div className="col-span-2 text-right">Liquidity</div>
            <div className="col-span-2 text-right">Supply</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
        )}
        {filtered.map((r) => <Row key={r.address} r={r} />)}
      </div>
    </div>
  );
}

function Row({ r }: { r: TokenRow }) {
  return (
    <div className="grid grid-cols-1 items-center gap-3 border-b border-line/40 px-4 py-3 last:border-b-0 md:grid-cols-12">
      <div className="col-span-4 flex items-center gap-3 min-w-0">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-spark-grad text-xs font-bold">
          {r.symbol.slice(0,2)}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{r.name} <span className="text-ink-dim">({r.symbol})</span></div>
          <div className="flex items-center gap-2 text-xs text-ink-mute">
            <a className="hover:text-ink truncate font-mono"
               href={`https://pharosscan.xyz/address/${r.address}`} target="_blank" rel="noreferrer">
              {truncate(r.address, 4)}
            </a>
            <span>·</span>
            <span>by {truncate(r.creator, 4)}</span>
          </div>
        </div>
      </div>
      <div className="col-span-2 text-right text-sm font-mono">
        {r.prosPrice !== undefined ? `${fmtNum(r.prosPrice, 8)} PROS` : "—"}
      </div>
      <div className="col-span-2 text-right text-sm font-mono">
        {r.liquidityPros !== undefined ? `${fmtNum(r.liquidityPros, 2)} PROS` : <span className="text-ink-mute">No LP</span>}
      </div>
      <div className="col-span-2 text-right text-sm font-mono">
        {fmtNum(Number(formatUnits(r.totalSupply, 18)), 0)}
      </div>
      <div className="col-span-2 flex flex-wrap justify-end gap-1.5">
        <Link href={`/swap`} className="btn-ghost !px-2.5 !py-1.5 text-xs">Swap</Link>
        <Link href={`/liquidity?token=${r.address}`} className="btn-ghost !px-2.5 !py-1.5 text-xs">+ LP</Link>
        <ShareToXButton size="sm" symbol={r.symbol} address={r.address} label="X" />
      </div>
    </div>
  );
}
