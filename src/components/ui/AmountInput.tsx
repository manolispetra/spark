"use client";

import { useAccount, useBalance, useReadContract } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { ERC20_ABI } from "@/abi";
import type { TokenInfo } from "@/config/tokens";
import { cn, fmtNum } from "@/lib/utils";

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  token?: TokenInfo;
  onSelectToken: () => void;
  disabled?: boolean;
  showMax?: boolean;
};

/**
 * Universal amount input row used by Swap, Add Liquidity, Presale.
 * Reads the connected wallet's balance for the chosen token (native PROS
 * or ERC-20). Pasting a numeric string is sanitized to allow only digits + ".".
 */
export default function AmountInput({
  label, value, onChange, token, onSelectToken, disabled, showMax = true,
}: Props) {
  const { address } = useAccount();

  // Native balance (PROS).
  const { data: nativeBal } = useBalance({
    address,
    query: { enabled: !!address && !!token?.isNative },
  });

  // ERC-20 balance.
  const { data: erc20Bal } = useReadContract({
    abi: ERC20_ABI,
    address: token?.address,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!token && !token.isNative },
  });

  const balanceRaw: bigint | undefined = token?.isNative
    ? nativeBal?.value
    : (erc20Bal as bigint | undefined);

  const balanceFormatted = balanceRaw && token
    ? Number(formatUnits(balanceRaw, token.decimals))
    : undefined;

  function setMax() {
    if (!balanceRaw || !token) return;
    // Leave a small dust amount for native gas if PROS.
    if (token.isNative) {
      const reserve = parseUnits("0.01", token.decimals);
      const usable = balanceRaw > reserve ? balanceRaw - reserve : 0n;
      onChange(formatUnits(usable, token.decimals));
    } else {
      onChange(formatUnits(balanceRaw, token.decimals));
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-bg-soft/40 p-4">
      <div className="mb-2 flex items-center justify-between text-xs text-ink-dim">
        <span>{label}</span>
        {balanceFormatted !== undefined && (
          <span>
            Balance:{" "}
            <span className="font-mono text-ink">{fmtNum(balanceFormatted, 6)}</span>
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <input
          inputMode="decimal"
          placeholder="0.0"
          value={value}
          disabled={disabled}
          onChange={(e) => {
            const v = e.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
            onChange(v);
          }}
          className="input-base disabled:opacity-60"
        />
        <div className="flex items-center gap-2">
          {showMax && balanceFormatted !== undefined && balanceFormatted > 0 && (
            <button onClick={setMax} className="rounded-lg border border-line bg-bg-soft px-2 py-1 text-[11px] font-semibold uppercase text-ink-dim hover:text-ink">
              Max
            </button>
          )}
          <button
            type="button"
            onClick={onSelectToken}
            className={cn(
              "flex items-center gap-2 rounded-xl border border-line bg-bg px-3 py-2 text-sm font-semibold transition hover:border-spark-pink/40",
              !token && "bg-spark-grad text-white border-transparent"
            )}
          >
            {token ? (
              <>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-spark-grad text-[10px] font-bold">
                  {token.symbol.slice(0, 2)}
                </span>
                {token.symbol}
                <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor"><path d="M2 4l4 4 4-4z" /></svg>
              </>
            ) : (
              <>Select token <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor"><path d="M2 4l4 4 4-4z" /></svg></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
