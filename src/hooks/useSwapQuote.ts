"use client";

import { useReadContract } from "wagmi";
import { parseUnits, formatUnits, zeroAddress } from "viem";
import { ROUTER_ABI } from "@/abi";
import { ADDRESSES } from "@/config/addresses";
import type { TokenInfo } from "@/config/tokens";

/**
 * Wraps router.getAmountsOut for a 2-hop max path.
 * If either token is native PROS, it's swapped to WPROS in the path.
 * Returns the expected output (formatted), the raw bigint, and a price impact %.
 */
export function useSwapQuote(opts: {
  tokenIn?: TokenInfo;
  tokenOut?: TokenInfo;
  amountIn: string;
}) {
  const { tokenIn, tokenOut, amountIn } = opts;

  const wpros = ADDRESSES.WPROS as `0x${string}`;
  const inAddr  = tokenIn?.isNative  ? wpros : tokenIn?.address;
  const outAddr = tokenOut?.isNative ? wpros : tokenOut?.address;

  const path: `0x${string}`[] = inAddr && outAddr ? [inAddr, outAddr] : [];

  const parsed: bigint = (() => {
    if (!tokenIn || !amountIn) return 0n;
    try { return parseUnits(amountIn, tokenIn.decimals); } catch { return 0n; }
  })();

  const enabled =
    !!ADDRESSES.SparkV2Router &&
    ADDRESSES.SparkV2Router !== zeroAddress &&
    parsed > 0n &&
    path.length === 2 &&
    inAddr !== outAddr;

  const { data, isFetching, error } = useReadContract({
    abi: ROUTER_ABI,
    address: ADDRESSES.SparkV2Router as `0x${string}`,
    functionName: "getAmountsOut",
    args: enabled ? [parsed, path] : undefined,
    query: { enabled },
  });

  const amountsOut = data as bigint[] | undefined;
  const out: bigint = amountsOut?.[amountsOut.length - 1] ?? 0n;
  const formattedOut = tokenOut ? formatUnits(out, tokenOut.decimals) : "0";

  return {
    path,
    amountInRaw: parsed,
    amountOutRaw: out,
    amountOut: formattedOut,
    loading: isFetching,
    error,
    /** True if no pool / liquidity. */
    noRoute: enabled && !isFetching && !error && out === 0n,
  };
}
