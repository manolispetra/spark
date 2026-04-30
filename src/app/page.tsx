"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useReadContract } from "wagmi";
import { createPublicClient, formatUnits, http } from "viem";
import { Sparkles, ArrowRight, ShieldCheck, Coins, Wallet, ChevronRight } from "lucide-react";
import { ADDRESSES } from "@/config/addresses";
import { FACTORY_ABI, PAIR_ABI, ERC20_ABI } from "@/abi";
import { pharosMainnet } from "@/config/chain";
import { fmtNum, truncate } from "@/lib/utils";

type PairRow = {
  pair: `0x${string}`;
  symbol0: string; symbol1: string;
  reserve0: bigint; reserve1: bigint;
  decimals0: number; decimals1: number;
};

export default function LandingPage() {
  return (
    <div>
      <Hero />
      <Dashboard />
      <Quicklinks />
    </div>
  );
}

/* ------------------------------------------------------------------ HERO */
function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-line/60 bg-bg-soft/40 p-8 sm:p-12">
      <div className="absolute inset-0 -z-10 opacity-60"
           style={{ background: "radial-gradient(60% 40% at 50% 0%, rgba(255,122,0,.18), transparent 60%), radial-gradient(40% 30% at 80% 100%, rgba(124,92,255,.18), transparent 60%)" }} />
      <div className="grid items-center gap-8 lg:grid-cols-2">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-spark-pink/30 bg-spark-pink/10 px-3 py-1 text-xs font-medium text-spark-pink">
            <Sparkles className="h-3 w-3" /> Now live on Pharos Mainnet
          </div>
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight sm:text-5xl">
            Spark Your Token. <br/>
            <span className="text-grad">Ignite the Trade.</span>
          </h1>
          <p className="mt-3 max-w-lg text-sm text-ink-dim sm:text-base">
            The all-in-one DEX on Pharos. Create a token, add liquidity, run a presale, and swap — without leaving the page.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/swap" className="btn-primary">Open Swap <ArrowRight className="ml-2 h-4 w-4"/></Link>
            <Link href="/generator" className="btn-ghost">Spark a Token ⚡</Link>
            <Link href="/presale" className="btn-ghost">$SPARK Presale</Link>
          </div>
        </div>
        <div className="flex justify-center">
          <SparkBadge />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ DASHBOARD */
function Dashboard() {
  const { data: pairCount } = useReadContract({
    abi: FACTORY_ABI,
    address: ADDRESSES.SparkV2Factory as `0x${string}`,
    functionName: "allPairsLength",
  });

  const [topPairs, setTopPairs] = useState<PairRow[]>([]);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    if (pairCount === undefined) return;
    const total = Number(pairCount);
    if (total === 0) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const client = createPublicClient({ chain: pharosMainnet, transport: http() });
        // Pull most recent up to 10 pairs.
        const start = Math.max(0, total - 10);
        const len   = total - start;
        const pairs = await client.multicall({
          allowFailure: false,
          contracts: Array.from({ length: len }, (_, i) => ({
            abi: FACTORY_ABI, address: ADDRESSES.SparkV2Factory as `0x${string}`,
            functionName: "allPairs" as const, args: [BigInt(start + i)] as const,
          })),
        }) as `0x${string}`[];

        const meta = await client.multicall({
          allowFailure: true,
          contracts: pairs.flatMap((p) => [
            { abi: PAIR_ABI, address: p, functionName: "token0" as const },
            { abi: PAIR_ABI, address: p, functionName: "token1" as const },
            { abi: PAIR_ABI, address: p, functionName: "getReserves" as const },
          ]),
        });

        const tokenSet = new Set<`0x${string}`>();
        pairs.forEach((_, i) => {
          if (meta[i*3].status   === "success") tokenSet.add(meta[i*3].result   as `0x${string}`);
          if (meta[i*3+1].status === "success") tokenSet.add(meta[i*3+1].result as `0x${string}`);
        });
        const tokens = Array.from(tokenSet);
        const tokenMeta = await client.multicall({
          allowFailure: true,
          contracts: tokens.flatMap((t) => [
            { abi: ERC20_ABI, address: t, functionName: "symbol" as const },
            { abi: ERC20_ABI, address: t, functionName: "decimals" as const },
          ]),
        });
        const sm = new Map<string, { symbol: string; decimals: number }>();
        tokens.forEach((t, i) => sm.set(t.toLowerCase(), {
          symbol:   tokenMeta[i*2].status   === "success" ? tokenMeta[i*2].result   as string : "?",
          decimals: tokenMeta[i*2+1].status === "success" ? Number(tokenMeta[i*2+1].result)   : 18,
        }));

        const out: PairRow[] = pairs.map((p, i) => {
          const t0 = meta[i*3].result   as `0x${string}` | undefined;
          const t1 = meta[i*3+1].result as `0x${string}` | undefined;
          const r  = meta[i*3+2].result as readonly [bigint, bigint, number] | undefined;
          if (!t0 || !t1 || !r) return null!;
          const m0 = sm.get(t0.toLowerCase())!;
          const m1 = sm.get(t1.toLowerCase())!;
          return {
            pair: p, symbol0: m0.symbol, symbol1: m1.symbol,
            reserve0: r[0], reserve1: r[1], decimals0: m0.decimals, decimals1: m1.decimals,
          };
        }).filter(Boolean).reverse();

        if (!cancelled) setTopPairs(out);
      } catch { /* swallow on landing */ }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [pairCount]);

  return (
    <section className="mt-8 grid gap-4 lg:grid-cols-12">
      {/* LEFT: Stats */}
      <div className="lg:col-span-4 space-y-3">
        <StatBlock title="TVL"        value="—"  hint="Total value locked across pools" />
        <StatBlock title="24h Volume" value="—"  hint="Trade volume in the last 24h" />
        <StatBlock title="Pairs"      value={pairCount !== undefined ? pairCount.toString() : "—"} hint="Pools created on Spark V2" />
      </div>

      {/* CENTER: Swap promo card */}
      <div className="lg:col-span-4">
        <div className="card relative h-full p-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-spark-grad shadow-glow-lg">
            <SparkGlyph />
          </div>
          <div className="font-display text-2xl font-bold tracking-tight">Trade on Spark</div>
          <p className="mx-auto mt-1 max-w-xs text-sm text-ink-dim">
            Native PROS, USDC, and every token that ever sparked here.
          </p>
          <Link href="/swap" className="btn-primary mt-5 w-full">Open Swap</Link>
          <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-ink-mute">
            <ShieldCheck className="h-3 w-3" /> Spark V2 fork · 0.30% LP fee · permissionless
          </div>
        </div>
      </div>

      {/* RIGHT: Pairs */}
      <div className="lg:col-span-4">
        <div className="card h-full p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-display text-base font-bold">Pairs</div>
            <Link href="/explorer" className="text-xs text-ink-dim hover:text-ink">All →</Link>
          </div>
          <div className="mb-2 grid grid-cols-3 gap-2 text-[10px] uppercase tracking-wider text-ink-mute">
            <span>Token</span><span className="text-right">Reserve</span><span className="text-right">Pair</span>
          </div>
          <div className="space-y-1">
            {loading && <div className="py-4 text-center text-xs text-ink-dim">Loading…</div>}
            {!loading && topPairs.length === 0 && (
              <div className="py-4 text-center text-xs text-ink-dim">No pools yet — be the first.</div>
            )}
            {topPairs.map((p) => (
              <div key={p.pair} className="grid grid-cols-3 items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-bg-soft/60">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-spark-grad text-[10px] font-bold">{p.symbol0.slice(0,1)}</div>
                  <span className="truncate font-medium">{p.symbol0}/{p.symbol1}</span>
                </div>
                <span className="text-right font-mono">{fmtNum(Number(formatUnits(p.reserve0, p.decimals0)), 2)}</span>
                <a className="truncate text-right font-mono text-ink-mute hover:text-ink"
                   href={`https://pharosscan.xyz/address/${p.pair}`} target="_blank" rel="noreferrer">
                  {truncate(p.pair, 3)}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StatBlock({ title, value, hint }: { title: string; value: string; hint: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-ink-mute">{title}</span>
        <span className="font-mono text-base font-bold text-ink">{value}</span>
      </div>
      <div className="mt-3 h-12 rounded-lg bg-gradient-to-br from-spark-orange/10 via-spark-pink/10 to-transparent" />
      <p className="mt-2 text-[11px] text-ink-mute">{hint}</p>
    </div>
  );
}

/* --------------------------------------------------------- QUICKLINKS */
function Quicklinks() {
  const items = [
    { href: "/generator", title: "Token Generator", body: "Launch an ERC-20 in under a minute. Optional buy/sell tax.", icon: <Coins className="h-5 w-5"/> },
    { href: "/liquidity", title: "Add Liquidity",   body: "Bootstrap a new pool or add to an existing one.",          icon: <Sparkles className="h-5 w-5"/> },
    { href: "/positions", title: "My Positions",    body: "Track every LP share and remove liquidity in one click.",  icon: <Wallet className="h-5 w-5"/> },
    { href: "/explorer",  title: "Token Explorer",  body: "Browse every Spark-launched token. Share to X.",          icon: <ChevronRight className="h-5 w-5"/> },
  ];
  return (
    <section className="mt-12">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map((it) => (
          <Link key={it.href} href={it.href}
                className="card group relative overflow-hidden p-5 transition hover:border-spark-pink/40">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg-soft text-spark-pink">{it.icon}</div>
            <div className="mt-3 font-display text-base font-bold">{it.title}</div>
            <div className="mt-1 text-xs text-ink-dim">{it.body}</div>
            <div className="mt-3 inline-flex items-center text-xs font-semibold text-spark-pink opacity-0 transition group-hover:opacity-100">
              Open <ArrowRight className="ml-1 h-3 w-3" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- visuals */
function SparkGlyph() {
  return (
    <svg className="h-9 w-9" viewBox="-32 -32 64 64" aria-hidden>
      <path fill="white" d="M0 -28 C 4 -10, 10 -4, 28 0 C 10 4, 4 10, 0 28 C -4 10, -10 4, -28 0 C -10 -4, -4 -10, 0 -28 Z" />
    </svg>
  );
}

function SparkBadge() {
  return (
    <div className="relative">
      <div className="absolute inset-0 -z-10 animate-pulse-slow blur-3xl"
           style={{ background: "radial-gradient(closest-side, rgba(255,122,0,.5), rgba(124,92,255,.4) 60%, transparent)" }} />
      <svg className="h-56 w-56 sm:h-72 sm:w-72" viewBox="-50 -50 100 100" aria-hidden>
        <defs>
          <linearGradient id="bgrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"  stopColor="#FF7A00"/>
            <stop offset="55%" stopColor="#FF2D78"/>
            <stop offset="100%" stopColor="#7C5CFF"/>
          </linearGradient>
        </defs>
        <path fill="url(#bgrad)"
              d="M0 -45 C 7 -16, 16 -7, 45 0 C 16 7, 7 16, 0 45 C -7 16, -16 7, -45 0 C -16 -7, -7 -16, 0 -45 Z" />
        <text x="0" y="6" textAnchor="middle" fontFamily="Space Grotesk, Inter, sans-serif"
              fontSize="14" fontWeight="700" fill="white" opacity="0.9">spark</text>
      </svg>
    </div>
  );
}
