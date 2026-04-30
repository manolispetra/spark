"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, zeroAddress } from "viem";
import { ArrowDown, Settings, Loader2 } from "lucide-react";
import AmountInput from "@/components/ui/AmountInput";
import TokenSelectModal from "@/components/modals/TokenSelectModal";
import { ERC20_ABI, ROUTER_ABI } from "@/abi";
import { ADDRESSES } from "@/config/addresses";
import { NATIVE_PROS, type TokenInfo } from "@/config/tokens";
import { useSwapQuote } from "@/hooks/useSwapQuote";
import { useAllowance, withSlippage, deadlineFromNow } from "@/hooks/useAllowance";
import { fmtNum } from "@/lib/utils";

export default function SwapPage() {
  const { address } = useAccount();
  const [tokenIn, setTokenIn]   = useState<TokenInfo | undefined>(NATIVE_PROS);
  const [tokenOut, setTokenOut] = useState<TokenInfo | undefined>();
  const [amountIn, setAmountIn] = useState("");
  const [slippageBps, setSlippageBps] = useState(50); // 0.5%
  const [showSettings, setShowSettings] = useState(false);
  const [pickFor, setPickFor] = useState<"in" | "out" | null>(null);

  const { amountInRaw, amountOutRaw, amountOut, noRoute, loading } =
    useSwapQuote({ tokenIn, tokenOut, amountIn });

  // Allowance only matters for ERC-20 → anything path.
  const needsApproval = !!tokenIn && !tokenIn.isNative && amountInRaw > 0n;
  const { data: allowance } = useAllowance({
    token: tokenIn?.address,
    owner: address,
    spender: ADDRESSES.SparkV2Router as `0x${string}`,
    enabled: needsApproval,
  });
  const hasAllowance = !needsApproval || (allowance as bigint | undefined ?? 0n) >= amountInRaw;

  const { writeContractAsync, isPending } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const { isLoading: txMining, isSuccess: txDone } = useWaitForTransactionReceipt({ hash: txHash });

  // Reset amount after a successful tx.
  useEffect(() => { if (txDone) setAmountIn(""); }, [txDone]);

  function flip() {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmountIn("");
  }

  async function approve() {
    if (!tokenIn || tokenIn.isNative || !amountInRaw) return;
    const hash = await writeContractAsync({
      abi: ERC20_ABI,
      address: tokenIn.address,
      functionName: "approve",
      args: [ADDRESSES.SparkV2Router as `0x${string}`, amountInRaw],
    });
    setTxHash(hash);
  }

  async function swap() {
    if (!address || !tokenIn || !tokenOut || !amountInRaw || !amountOutRaw) return;
    const minOut = withSlippage(amountOutRaw, slippageBps);
    const dl = deadlineFromNow();
    const wpros = ADDRESSES.WPROS as `0x${string}`;
    const path: `0x${string}`[] = [
      tokenIn.isNative ? wpros : tokenIn.address,
      tokenOut.isNative ? wpros : tokenOut.address,
    ];
    let hash: `0x${string}`;
    if (tokenIn.isNative) {
      hash = await writeContractAsync({
        abi: ROUTER_ABI,
        address: ADDRESSES.SparkV2Router as `0x${string}`,
        functionName: "swapExactPROSForTokens",
        args: [minOut, path, address, dl],
        value: amountInRaw,
      });
    } else if (tokenOut.isNative) {
      hash = await writeContractAsync({
        abi: ROUTER_ABI,
        address: ADDRESSES.SparkV2Router as `0x${string}`,
        functionName: "swapExactTokensForPROS",
        args: [amountInRaw, minOut, path, address, dl],
      });
    } else {
      hash = await writeContractAsync({
        abi: ROUTER_ABI,
        address: ADDRESSES.SparkV2Router as `0x${string}`,
        functionName: "swapExactTokensForTokens",
        args: [amountInRaw, minOut, path, address, dl],
      });
    }
    setTxHash(hash);
  }

  const ctaLabel = useMemo(() => {
    if (!address) return "Connect wallet";
    if (!tokenIn || !tokenOut) return "Select tokens";
    if (!amountInRaw) return "Enter an amount";
    if (loading) return "Finding route…";
    if (noRoute) return "No liquidity for this pair";
    if (!hasAllowance) return `Approve ${tokenIn.symbol}`;
    if (isPending || txMining) return "Pending…";
    return "Swap";
  }, [address, tokenIn, tokenOut, amountInRaw, loading, noRoute, hasAllowance, isPending, txMining]);

  const ctaDisabled =
    !address || !tokenIn || !tokenOut || !amountInRaw ||
    loading || noRoute || isPending || txMining;

  return (
    <div className="mx-auto max-w-md">
      <div className="card relative overflow-hidden p-5">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="font-display text-xl font-bold">Swap</h1>
          <button onClick={() => setShowSettings((v) => !v)} className="btn-ghost h-9 w-9 p-0">
            <Settings className="h-4 w-4" />
          </button>
        </div>

        {showSettings && (
          <div className="mb-4 rounded-xl border border-line bg-bg-soft/40 p-3 text-sm">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-dim">Slippage tolerance</div>
            <div className="flex items-center gap-2">
              {[10, 50, 100].map((b) => (
                <button key={b}
                  onClick={() => setSlippageBps(b)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                    slippageBps === b ? "border-spark-pink/60 bg-spark-pink/10 text-ink"
                                      : "border-line text-ink-dim hover:text-ink"
                  }`}
                >{(b/100).toFixed(b===10?1:0)}%</button>
              ))}
              <input
                value={(slippageBps/100).toString()}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isFinite(n) && n >= 0 && n <= 50) setSlippageBps(Math.round(n*100));
                }}
                className="ml-auto w-20 rounded-lg border border-line bg-bg-soft px-2 py-1 text-right text-xs"
              /><span className="text-xs text-ink-dim">%</span>
            </div>
          </div>
        )}

        <AmountInput
          label="From (You pay)"
          value={amountIn}
          onChange={setAmountIn}
          token={tokenIn}
          onSelectToken={() => setPickFor("in")}
        />

        <div className="my-2 flex justify-center">
          <button onClick={flip} className="rounded-full border border-line bg-bg p-2 hover:border-spark-pink/40">
            <ArrowDown className="h-4 w-4" />
          </button>
        </div>

        <AmountInput
          label="To (You receive)"
          value={amountOut === "0" ? "" : amountOut}
          onChange={() => {}}
          token={tokenOut}
          onSelectToken={() => setPickFor("out")}
          disabled
          showMax={false}
        />

        {/* Route summary */}
        {tokenIn && tokenOut && amountInRaw > 0n && (
          <div className="mt-3 space-y-1 rounded-xl border border-line bg-bg-soft/40 p-3 text-xs text-ink-dim">
            <div className="flex justify-between">
              <span>Rate</span>
              <span className="font-mono text-ink">
                {amountOutRaw && amountInRaw
                  ? `1 ${tokenIn.symbol} ≈ ${fmtNum(Number(amountOut)/(Number(amountIn) || 1), 6)} ${tokenOut.symbol}`
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Min received ({(slippageBps/100).toFixed(2)}% slippage)</span>
              <span className="font-mono text-ink">
                {amountOutRaw ? fmtNum(Number(amountOut) * (1 - slippageBps/10_000), 6) : "—"} {tokenOut.symbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span>LP fee</span>
              <span className="font-mono text-ink">0.30%</span>
            </div>
          </div>
        )}

        <button
          onClick={async () => { if (!hasAllowance) await approve(); else await swap(); }}
          disabled={ctaDisabled}
          className="btn-primary mt-4 w-full"
        >
          {(isPending || txMining) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {ctaLabel}
        </button>

        {ADDRESSES.SparkV2Router === zeroAddress && (
          <p className="mt-3 text-center text-xs text-spark-orange">
            ⚠ Router address not yet configured. Run the deploy script and update <code>config/addresses.ts</code>.
          </p>
        )}
      </div>

      <p className="mt-3 text-center text-xs text-ink-dim">
        Spark uses a Uniswap-V2-style fork. Multi-DEX aggregation will activate once a second AMM goes live on Pharos.
      </p>

      <TokenSelectModal
        open={pickFor === "in"}
        onClose={() => setPickFor(null)}
        onSelect={(t) => setTokenIn(t)}
        excludeAddress={tokenOut?.address}
      />
      <TokenSelectModal
        open={pickFor === "out"}
        onClose={() => setPickFor(null)}
        onSelect={(t) => setTokenOut(t)}
        excludeAddress={tokenIn?.address}
      />
    </div>
  );
}
