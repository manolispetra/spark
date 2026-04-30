"use client";

import { useReadContract } from "wagmi";
import { ERC20_ABI } from "@/abi";

/** Default 0.5% slippage, 20-min deadline. */
export const DEFAULT_SLIPPAGE_BPS = 50; // 0.5%
export const DEFAULT_DEADLINE_SEC = 60 * 20;

export function withSlippage(amount: bigint, bps = DEFAULT_SLIPPAGE_BPS): bigint {
  return (amount * BigInt(10_000 - bps)) / 10_000n;
}

export function deadlineFromNow(sec = DEFAULT_DEADLINE_SEC): bigint {
  return BigInt(Math.floor(Date.now() / 1000) + sec);
}

export function useAllowance(opts: {
  token?: `0x${string}`;
  owner?: `0x${string}`;
  spender?: `0x${string}`;
  enabled?: boolean;
}) {
  const { token, owner, spender, enabled = true } = opts;
  return useReadContract({
    abi: ERC20_ABI,
    address: token,
    functionName: "allowance",
    args: owner && spender ? [owner, spender] : undefined,
    query: { enabled: enabled && !!token && !!owner && !!spender },
  });
}
