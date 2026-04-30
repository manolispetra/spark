"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt, useChainId } from "wagmi";
import { createPublicClient, http, formatUnits, zeroAddress } from "viem";
import { Loader2, Wallet, Trash2 } from "lucide-react";
import { ADDRESSES } from "@/config/addresses";
import { ERC20_ABI, FACTORY_ABI, PAIR_ABI, ROUTER_ABI } from "@/abi";
import { pharosMainnet } from "@/config/chain";
import { useAllowance, withSlippage, deadlineFromNow } from "@/hooks/useAllowance";
import { fmtNum, truncate } from "@/lib/utils";

type Position = {
  pair: `0x${string}`;
  token0: `0x${string}`;
  token1: `0x${string}`;
  symbol0: string;
  symbol1: string;
  decimals0: number;
  decimals1: number;
  reserves: readonly [bigint, bigint, number];
  totalSupply: bigint;
  lpBalance: bigint;
  /** the user's pro-rated underlying amounts */
  amount0: bigint;
  amount1: bigint;
  sharePct: number;
};

export default function PositionsPage() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [positions, setPositions] = useState<Position[] | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const { data: pairCount } = useReadContract({
    abi: FACTORY_ABI,
    address: ADDRESSES.SparkV2Factory as `0x${string}`,
    functionName: "allPairsLength",
    query: { enabled: ADDRESSES.SparkV2Factory !== zeroAddress },
  });

  // Scan all pairs for non-zero LP balance held by `address`.
  // For 1000+ pairs this should be a subgraph; for MVP we iterate.
  useEffect(() => {
    if (!address || pairCount === undefined) return;
    const total = Number(pairCount);
    if (total === 0) { setPositions([]); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const client = createPublicClient({ chain: pharosMainnet, transport: http() });

        // 1) Fetch every pair address.
        const pairCalls = await client.multicall({
          allowFailure: false,
          contracts: Array.from({ length: total }, (_, i) => ({
            abi: FACTORY_ABI,
            address: ADDRESSES.SparkV2Factory as `0x${string}`,
            functionName: "allPairs" as const,
            args: [BigInt(i)] as const,
          })),
        });
        const pairs = pairCalls as unknown as `0x${string}`[];

        // 2) Read LP balance for each pair.
        const balCalls = await client.multicall({
          allowFailure: true,
          contracts: pairs.map((p) => ({
            abi: PAIR_ABI, address: p, functionName: "balanceOf" as const, args: [address] as const,
          })),
        });
        const owned = pairs.map((p, i) => ({
          pair: p,
          bal: (balCalls[i].status === "success" ? (balCalls[i].result as bigint) : 0n),
        })).filter((x) => x.bal > 0n);

        if (owned.length === 0) { if (!cancelled) setPositions([]); return; }

        // 3) For each owned pair, fetch token0/1, reserves, totalSupply.
        const meta = await client.multicall({
          allowFailure: false,
          contracts: owned.flatMap((x) => [
            { abi: PAIR_ABI, address: x.pair, functionName: "token0" as const },
            { abi: PAIR_ABI, address: x.pair, functionName: "token1" as const },
            { abi: PAIR_ABI, address: x.pair, functionName: "getReserves" as const },
            { abi: PAIR_ABI, address: x.pair, functionName: "totalSupply" as const },
          ]),
        });

        // 4) For each pair, fetch token symbols/decimals.
        const tokenAddrs = new Set<`0x${string}`>();
        owned.forEach((_, i) => {
          tokenAddrs.add(meta[i*4]   as `0x${string}`);
          tokenAddrs.add(meta[i*4+1] as `0x${string}`);
        });
        const tokenList = Array.from(tokenAddrs);
        const tokenMeta = await client.multicall({
          allowFailure: true,
          contracts: tokenList.flatMap((t) => [
            { abi: ERC20_ABI, address: t, functionName: "symbol"   as const },
            { abi: ERC20_ABI, address: t, functionName: "decimals" as const },
          ]),
        });
        const symMap = new Map<string, { symbol: string; decimals: number }>();
        tokenList.forEach((t, i) => {
          symMap.set(t.toLowerCase(), {
            symbol: tokenMeta[i*2].status === "success" ? (tokenMeta[i*2].result as string) : "?",
            decimals: tokenMeta[i*2+1].status === "success" ? Number(tokenMeta[i*2+1].result) : 18,
          });
        });

        const out: Position[] = owned.map((x, i) => {
          const t0 = meta[i*4]   as `0x${string}`;
          const t1 = meta[i*4+1] as `0x${string}`;
          const reserves = meta[i*4+2] as readonly [bigint, bigint, number];
          const supply   = meta[i*4+3] as bigint;
          const m0 = symMap.get(t0.toLowerCase())!;
          const m1 = symMap.get(t1.toLowerCase())!;
          const a0 = supply === 0n ? 0n : (reserves[0] * x.bal) / supply;
          const a1 = supply === 0n ? 0n : (reserves[1] * x.bal) / supply;
          const share = supply === 0n ? 0 : Number((x.bal * 10000n) / supply) / 100;
          return {
            pair: x.pair, token0: t0, token1: t1,
            symbol0: m0.symbol, symbol1: m1.symbol,
            decimals0: m0.decimals, decimals1: m1.decimals,
            reserves, totalSupply: supply, lpBalance: x.bal,
            amount0: a0, amount1: a1, sharePct: share,
          };
        });

        if (!cancelled) setPositions(out);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load positions");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [address, pairCount, chainId]);

  if (!address) {
    return (
      <div className="mx-auto max-w-md">
        <div className="card p-8 text-center">
          <Wallet className="mx-auto mb-3 h-10 w-10 text-ink-dim" />
          <h2 className="font-display text-xl font-bold">My Positions</h2>
          <p className="mt-2 text-sm text-ink-dim">Connect your wallet to see your LP positions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">My Positions</h1>
          <p className="mt-1 text-sm text-ink-dim">All your LP shares on Spark DEX, in one place.</p>
        </div>
        <a href="/liquidity" className="btn-primary">+ Add Liquidity</a>
      </div>

      {loading && (
        <div className="card flex items-center justify-center gap-3 p-10 text-sm text-ink-dim">
          <Loader2 className="h-4 w-4 animate-spin" /> Scanning pools…
        </div>
      )}
      {error && <div className="card p-6 text-sm text-spark-orange">⚠ {error}</div>}

      {positions && positions.length === 0 && !loading && (
        <div className="card p-10 text-center text-sm text-ink-dim">
          You don't have any liquidity positions yet. <a href="/liquidity" className="text-grad font-semibold">Add some →</a>
        </div>
      )}

      <div className="grid gap-4">
        {positions?.map((p) => (
          <PositionCard key={p.pair} p={p} onChanged={() => { /* simplest: full reload */
            setPositions(null);
            setLoading(true);
            setTimeout(() => location.reload(), 1500);
          }} />
        ))}
      </div>
    </div>
  );
}

/* -------- Position card -------- */
function PositionCard({ p, onChanged }: { p: Position; onChanged: () => void }) {
  const { address } = useAccount();
  const [pct, setPct] = useState(50);
  const [open, setOpen] = useState(false);

  const lpToBurn = (p.lpBalance * BigInt(pct)) / 100n;
  const expected0 = (p.reserves[0] * lpToBurn) / p.totalSupply;
  const expected1 = (p.reserves[1] * lpToBurn) / p.totalSupply;

  const allowance = useAllowance({
    token: p.pair,
    owner: address,
    spender: ADDRESSES.SparkV2Router as `0x${string}`,
    enabled: !!address,
  });
  const needsApprove = ((allowance.data as bigint | undefined) ?? 0n) < lpToBurn;

  const { writeContractAsync, isPending } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const { isLoading: txMining, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });
  useEffect(() => { if (isSuccess) onChanged(); }, [isSuccess, onChanged]);

  async function approve() {
    const hash = await writeContractAsync({
      abi: ERC20_ABI, address: p.pair, functionName: "approve",
      args: [ADDRESSES.SparkV2Router as `0x${string}`, lpToBurn],
    });
    setTxHash(hash);
  }
  async function remove() {
    if (!address) return;
    const min0 = withSlippage(expected0);
    const min1 = withSlippage(expected1);
    const dl = deadlineFromNow();
    // Detect native pair (one side WPROS).
    const wpros = (ADDRESSES.WPROS as string).toLowerCase();
    const isNative0 = p.token0.toLowerCase() === wpros;
    const isNative1 = p.token1.toLowerCase() === wpros;
    let hash: `0x${string}`;
    if (isNative0 || isNative1) {
      const erc = isNative0 ? p.token1 : p.token0;
      const ercMin   = isNative0 ? min1 : min0;
      const prosMin  = isNative0 ? min0 : min1;
      hash = await writeContractAsync({
        abi: ROUTER_ABI, address: ADDRESSES.SparkV2Router as `0x${string}`,
        functionName: "removeLiquidityPROS",
        args: [erc, lpToBurn, ercMin, prosMin, address, dl],
      });
    } else {
      hash = await writeContractAsync({
        abi: ROUTER_ABI, address: ADDRESSES.SparkV2Router as `0x${string}`,
        functionName: "removeLiquidity",
        args: [p.token0, p.token1, lpToBurn, min0, min1, address, dl],
      });
    }
    setTxHash(hash);
  }

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex -space-x-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-bg bg-spark-grad text-xs font-bold">{p.symbol0.slice(0,2)}</div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-bg bg-gradient-to-br from-spark-purple to-spark-blue text-xs font-bold">{p.symbol1.slice(0,2)}</div>
        </div>
        <div>
          <div className="font-display text-base font-bold">{p.symbol0} / {p.symbol1}</div>
          <a className="font-mono text-xs text-ink-mute hover:text-ink"
             href={`https://pharosscan.xyz/address/${p.pair}`} target="_blank" rel="noreferrer">
            {truncate(p.pair, 6)}
          </a>
        </div>
        <div className="ml-auto text-right">
          <div className="text-[11px] uppercase tracking-wider text-ink-mute">Your share</div>
          <div className="font-mono text-sm">{p.sharePct.toFixed(4)}%</div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl border border-line bg-bg-soft/40 p-3">
          <div className="text-[11px] uppercase tracking-wider text-ink-mute">{p.symbol0} pooled</div>
          <div className="font-mono">{fmtNum(Number(formatUnits(p.amount0, p.decimals0)), 6)}</div>
        </div>
        <div className="rounded-xl border border-line bg-bg-soft/40 p-3">
          <div className="text-[11px] uppercase tracking-wider text-ink-mute">{p.symbol1} pooled</div>
          <div className="font-mono">{fmtNum(Number(formatUnits(p.amount1, p.decimals1)), 6)}</div>
        </div>
      </div>

      <button onClick={() => setOpen(v => !v)} className="btn-ghost mt-3 w-full">
        <Trash2 className="mr-2 h-4 w-4" /> Remove liquidity
      </button>

      {open && (
        <div className="mt-3 rounded-xl border border-line bg-bg-soft/40 p-4">
          <div className="flex items-center justify-between text-sm">
            <span>Remove</span>
            <span className="font-mono font-semibold">{pct}%</span>
          </div>
          <input type="range" min={1} max={100} value={pct}
            onChange={(e) => setPct(Number(e.target.value))}
            className="mt-2 w-full accent-spark-pink" />
          <div className="mt-2 flex gap-2">
            {[25,50,75,100].map(v => (
              <button key={v} onClick={() => setPct(v)}
                className="flex-1 rounded-lg border border-line bg-bg-soft px-2 py-1 text-xs">
                {v}%
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-ink-dim">
            <div>≈ {fmtNum(Number(formatUnits(expected0, p.decimals0)), 6)} {p.symbol0}</div>
            <div className="text-right">≈ {fmtNum(Number(formatUnits(expected1, p.decimals1)), 6)} {p.symbol1}</div>
          </div>
          <button onClick={async () => { if (needsApprove) await approve(); else await remove(); }}
            disabled={isPending || txMining || lpToBurn === 0n}
            className="btn-primary mt-3 w-full">
            {(isPending || txMining) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {needsApprove ? "Approve LP" : "Remove"}
          </button>
        </div>
      )}
    </div>
  );
}
