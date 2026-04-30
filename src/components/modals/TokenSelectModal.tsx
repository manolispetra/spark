"use client";

import { useEffect, useMemo, useState } from "react";
import { isAddress } from "viem";
import { useReadContracts } from "wagmi";
import { ERC20_ABI } from "@/abi";
import { DEFAULT_TOKENS, type TokenInfo } from "@/config/tokens";
import { cn, truncate } from "@/lib/utils";
import { X, Search, Plus } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (t: TokenInfo) => void;
  excludeAddress?: `0x${string}`;
};

const STORAGE_KEY = "spark.customTokens.v1";

function readCustom(): TokenInfo[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); } catch { return []; }
}
function writeCustom(t: TokenInfo[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(t));
}

export default function TokenSelectModal({ open, onClose, onSelect, excludeAddress }: Props) {
  const [q, setQ] = useState("");
  const [custom, setCustom] = useState<TokenInfo[]>([]);

  useEffect(() => { if (open) setCustom(readCustom()); }, [open]);

  const list = useMemo(() => {
    const all = [...DEFAULT_TOKENS, ...custom];
    const ql = q.trim().toLowerCase();
    return all
      .filter((t) => !excludeAddress || t.address.toLowerCase() !== excludeAddress.toLowerCase())
      .filter((t) =>
        !ql ||
        t.symbol.toLowerCase().includes(ql) ||
        t.name.toLowerCase().includes(ql) ||
        t.address.toLowerCase().includes(ql)
      );
  }, [q, custom, excludeAddress]);

  // Resolve metadata for a contract pasted in the search box.
  const isAddrQuery = isAddress(q.trim());
  const isUnknown =
    isAddrQuery &&
    !list.find((t) => t.address.toLowerCase() === q.trim().toLowerCase());

  const { data: meta } = useReadContracts({
    allowFailure: true,
    contracts: isUnknown
      ? [
          { abi: ERC20_ABI, address: q.trim() as `0x${string}`, functionName: "symbol" },
          { abi: ERC20_ABI, address: q.trim() as `0x${string}`, functionName: "name" },
          { abi: ERC20_ABI, address: q.trim() as `0x${string}`, functionName: "decimals" },
        ]
      : [],
    query: { enabled: isUnknown },
  });

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="card w-full max-w-md p-4" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Select a token</h2>
          <button className="btn-ghost h-8 w-8 p-0" onClick={onClose} aria-label="Close"><X className="h-4 w-4"/></button>
        </div>

        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search symbol or paste contract address (0x…)"
            className="w-full rounded-xl border border-line bg-bg-soft py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-ink-mute focus:border-spark-pink/40"
          />
        </div>

        {/* Custom-token import row */}
        {isUnknown && meta && meta[0]?.status === "success" && (
          <div className="mb-3 flex items-center gap-3 rounded-xl border border-spark-pink/30 bg-spark-pink/5 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-spark-grad text-sm font-bold">
              {(meta[0].result as string).slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{meta[1]?.result as string} ({meta[0].result as string})</div>
              <div className="truncate text-xs text-ink-dim">{truncate(q.trim(), 6)}</div>
            </div>
            <button
              className="btn-primary !px-3 !py-1.5 text-xs"
              onClick={() => {
                const t: TokenInfo = {
                  address: q.trim() as `0x${string}`,
                  symbol: meta[0].result as string,
                  name:   meta[1]?.result as string,
                  decimals: Number(meta[2]?.result ?? 18),
                };
                const next = [...custom.filter((x) => x.address.toLowerCase() !== t.address.toLowerCase()), t];
                writeCustom(next);
                setCustom(next);
                onSelect(t);
                onClose();
              }}
            >
              <Plus className="mr-1 h-3.5 w-3.5"/> Import
            </button>
          </div>
        )}

        <div className="max-h-[60vh] overflow-y-auto pr-1">
          {list.map((t) => (
            <button
              key={`${t.address}-${t.symbol}`}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left transition hover:border-line hover:bg-bg-soft/60"
              )}
              onClick={() => { onSelect(t); onClose(); }}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-spark-grad text-sm font-bold">
                {t.symbol.slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{t.symbol}</div>
                <div className="truncate text-xs text-ink-dim">{t.name}</div>
              </div>
              <div className="text-xs text-ink-mute">{t.isNative ? "native" : truncate(t.address, 4)}</div>
            </button>
          ))}
          {list.length === 0 && (
            <div className="py-8 text-center text-sm text-ink-dim">
              No matches. Paste a contract address to import.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
