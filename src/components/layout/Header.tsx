"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { ADDRESSES } from "@/config/addresses";
import { PRESALE_ABI } from "@/abi";
import { cn, fmtNum } from "@/lib/utils";

const NAV = [
  { href: "/swap",      label: "Swap" },
  { href: "/generator", label: "Token Generator" },
  { href: "/liquidity", label: "Add Liquidity" },
  { href: "/presale",   label: "Presale" },
  { href: "/positions", label: "My Positions" },
  { href: "/explorer",  label: "Token Explorer" },
];

export default function Header() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { data: bal } = useBalance({ address });
  // Read presale owner to gate the Admin link.
  const { data: presaleOwner } = useReadContract({
    abi: PRESALE_ABI,
    address: ADDRESSES.SparkPresale as `0x${string}`,
    functionName: "owner",
    query: { enabled: !!address },
  });

  const isAdmin = !!address && !!presaleOwner &&
    (presaleOwner as string).toLowerCase() === address.toLowerCase();

  return (
    <header className="sticky top-0 z-50 border-b border-line/60 bg-bg/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <SparkMark />
          <span className="font-display text-xl font-bold tracking-tight">
            spark<span className="text-grad">.</span>
          </span>
          <span className="hidden text-[10px] uppercase tracking-[0.2em] text-ink-dim sm:block">
            DEX · Pharos
          </span>
        </Link>

        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                pathname?.startsWith(n.href)
                  ? "bg-bg-soft text-ink"
                  : "text-ink-dim hover:bg-bg-soft/60 hover:text-ink"
              )}
            >
              {n.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-semibold transition",
                pathname?.startsWith("/admin")
                  ? "bg-spark-grad text-white"
                  : "border border-spark-pink/40 text-spark-pink hover:bg-spark-pink/10"
              )}
            >
              ⚡ Admin
            </Link>
          )}
        </nav>

        <div className="ml-auto flex flex-col items-end gap-0.5">
          <ConnectButton showBalance={false} chainStatus="icon" accountStatus="address" />
          {isConnected && bal && (
            <span className="text-[11px] font-medium text-ink-dim">
              {fmtNum(Number(bal.formatted), 4)} {bal.symbol}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}

function SparkMark() {
  return (
    <svg className="h-7 w-7 animate-pulse-slow" viewBox="-32 -32 64 64" aria-hidden>
      <defs>
        <linearGradient id="hgrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"  stopColor="#FF7A00"/>
          <stop offset="55%" stopColor="#FF2D78"/>
          <stop offset="100%" stopColor="#7C5CFF"/>
        </linearGradient>
      </defs>
      <path
        fill="url(#hgrad)"
        d="M0 -28 C 4 -10, 10 -4, 28 0 C 10 4, 4 10, 0 28 C -4 10, -10 4, -28 0 C -10 -4, -4 -10, 0 -28 Z"
      />
    </svg>
  );
}
