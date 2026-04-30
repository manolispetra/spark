"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits, isAddress, zeroAddress } from "viem";
import { Loader2, Plus } from "lucide-react";
import AmountInput from "@/components/ui/AmountInput";
import TokenSelectModal from "@/components/modals/TokenSelectModal";
import { ADDRESSES } from "@/config/addresses";
import { ERC20_ABI, FACTORY_ABI, PAIR_ABI, ROUTER_ABI } from "@/abi";
import { NATIVE_PROS, type TokenInfo, DEFAULT_TOKENS } from "@/config/tokens";
import { useAllowance, withSlippage, deadlineFromNow } from "@/hooks/useAllowance";
import { fmtNum } from "@/lib/utils";

export default function AddLiquidityPage() {
  const params = useSearchParams();
  const tokenParam = params.get("token");

  const { address } = useAccount();
  const [tokenA, setTokenA] = useState<TokenInfo | undefined>(NATIVE_PROS);
  const [tokenB, setTokenB] = useState<TokenInfo | undefined>();
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [pickFor, setPickFor] = useState<"a" | "b" | null>(null);

  // If we arrive from /generator?token=0x… preload tokenB from URL.
  useEffect(() => {
    if (tokenParam && isAddress(tokenParam)) {
      // Try default tokens first; otherwise show as pasted address with shortened symbol.
      const found = DEFAULT_TOKENS.find((t) => t.address.toLowerCase() === tokenParam.toLowerCase());
      if (found) setTokenB(found);
      else setTokenB({
        address: tokenParam as `0x${string}`,
        symbol: "TOKEN", name: "Imported token", decimals: 18,
      });
    }
  }, [tokenParam]);

  // Resolve pair address & reserves for ratio guidance.
  const tokenAAddr = tokenA?.isNative ? ADDRESSES.WPROS as `0x${string}` : tokenA?.address;
  const tokenBAddr = tokenB?.isNative ? ADDRESSES.WPROS as `0x${string}` : tokenB?.address;

  const { data: pair } = useReadContract({
    abi: FACTORY_ABI,
    address: ADDRESSES.SparkV2Factory as `0x${string}`,
    functionName: "getPair",
    args: tokenAAddr && tokenBAddr ? [tokenAAddr, tokenBAddr] : undefined,
    query: { enabled: !!tokenAAddr && !!tokenBAddr && tokenAAddr !== tokenBAddr },
  });
  const pairAddr = pair as `0x${string}` | undefined;
  const pairExists = !!pairAddr && pairAddr !== zeroAddress;

  const { data: pairInfo } = useReadContracts({
    allowFailure: true,
    contracts: pairExists ? [
      { abi: PAIR_ABI, address: pairAddr!, functionName: "token0" },
      { abi: PAIR_ABI, address: pairAddr!, functionName: "token1" },
      { abi: PAIR_ABI, address: pairAddr!, functionName: "getReserves" },
    ] : [],
    query: { enabled: pairExists },
  });

  // When user types amountA and pool exists, auto-quote amountB at current ratio.
  useEffect(() => {
    if (!pairInfo || !pairExists || !tokenA || !tokenB || !amountA) return;
    const t0 = pairInfo[0]?.result as `0x${string}` | undefined;
    const reserves = pairInfo[2]?.result as readonly [bigint, bigint, number] | undefined;
    if (!t0 || !reserves) return;
    const aAddrLow = (tokenAAddr as string).toLowerCase();
    const aIs0 = t0.toLowerCase() === aAddrLow;
    const reserveA = aIs0 ? reserves[0] : reserves[1];
    const reserveB = aIs0 ? reserves[1] : reserves[0];
    if (reserveA === 0n || reserveB === 0n) return;
    try {
      const inA = parseUnits(amountA, tokenA.decimals);
      // amountB = inA * reserveB / reserveA, decimal-aware
      const outB = (inA * reserveB) / reserveA;
      setAmountB(formatUnits(outB, tokenB.decimals));
    } catch { /* invalid input */ }
  }, [amountA, pairInfo, pairExists, tokenA, tokenB, tokenAAddr]);

  // Allowance for both tokens (skip for native PROS).
  const aRaw = (() => { try { return tokenA && amountA ? parseUnits(amountA, tokenA.decimals) : 0n; } catch { return 0n; } })();
  const bRaw = (() => { try { return tokenB && amountB ? parseUnits(amountB, tokenB.decimals) : 0n; } catch { return 0n; } })();

  const allowanceA = useAllowance({
    token: tokenA?.isNative ? undefined : tokenA?.address,
    owner: address,
    spender: ADDRESSES.SparkV2Router as `0x${string}`,
    enabled: !!tokenA && !tokenA.isNative,
  });
  const allowanceB = useAllowance({
    token: tokenB?.isNative ? undefined : tokenB?.address,
    owner: address,
    spender: ADDRESSES.SparkV2Router as `0x${string}`,
    enabled: !!tokenB && !tokenB.isNative,
  });

  const needsApproveA = !!tokenA && !tokenA.isNative && aRaw > 0n &&
    ((allowanceA.data as bigint | undefined) ?? 0n) < aRaw;
  const needsApproveB = !!tokenB && !tokenB.isNative && bRaw > 0n &&
    ((allowanceB.data as bigint | undefined) ?? 0n) < bRaw;

  const { writeContractAsync, isPending } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const { isLoading: txMining, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => { if (isSuccess) { setAmountA(""); setAmountB(""); } }, [isSuccess]);

  async function approve(token: TokenInfo, raw: bigint) {
    const hash = await writeContractAsync({
      abi: ERC20_ABI,
      address: token.address,
      functionName: "approve",
      args: [ADDRESSES.SparkV2Router as `0x${string}`, raw],
    });
    setTxHash(hash);
  }

  async function add() {
    if (!address || !tokenA || !tokenB || !aRaw || !bRaw) return;
    const minA = withSlippage(aRaw);
    const minB = withSlippage(bRaw);
    const dl = deadlineFromNow();
    let hash: `0x${string}`;
    if (tokenA.isNative || tokenB.isNative) {
      const erc = tokenA.isNative ? tokenB : tokenA;
      const ercAmt = tokenA.isNative ? bRaw : aRaw;
      const prosAmt = tokenA.isNative ? aRaw : bRaw;
      const ercMin  = tokenA.isNative ? minB : minA;
      const prosMin = tokenA.isNative ? minA : minB;
      hash = await writeContractAsync({
        abi: ROUTER_ABI,
        address: ADDRESSES.SparkV2Router as `0x${string}`,
        functionName: "addLiquidityPROS",
        args: [erc!.address, ercAmt, ercMin, prosMin, address, dl],
        value: prosAmt,
      });
    } else {
      hash = await writeContractAsync({
        abi: ROUTER_ABI,
        address: ADDRESSES.SparkV2Router as `0x${string}`,
        functionName: "addLiquidity",
        args: [tokenA.address, tokenB.address, aRaw, bRaw, minA, minB, address, dl],
      });
    }
    setTxHash(hash);
  }

  const cta = useMemo(() => {
    if (!address) return { label: "Connect wallet", disabled: true, action: () => {} };
    if (!tokenA || !tokenB) return { label: "Select both tokens", disabled: true, action: () => {} };
    if (!aRaw || !bRaw) return { label: "Enter amounts", disabled: true, action: () => {} };
    if (needsApproveA) return { label: `Approve ${tokenA.symbol}`, disabled: false, action: () => approve(tokenA, aRaw) };
    if (needsApproveB) return { label: `Approve ${tokenB.symbol}`, disabled: false, action: () => approve(tokenB, bRaw) };
    if (isPending || txMining) return { label: "Pending…", disabled: true, action: () => {} };
    if (!pairExists) return { label: "Create pool & add liquidity", disabled: false, action: add };
    return { label: "Add liquidity", disabled: false, action: add };
  }, [address, tokenA, tokenB, aRaw, bRaw, needsApproveA, needsApproveB, isPending, txMining, pairExists]);

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold">Add Liquidity</h1>
        <p className="mt-1 text-sm text-ink-dim">
          {pairExists
            ? "Add to an existing pool — token amounts are quoted at the current ratio."
            : "No pool exists yet. The first deposit creates the pool and sets the price."}
        </p>
      </div>

      <div className="card p-5">
        <AmountInput
          label="Token A"
          value={amountA}
          onChange={setAmountA}
          token={tokenA}
          onSelectToken={() => setPickFor("a")}
        />
        <div className="my-2 flex justify-center">
          <div className="rounded-full border border-line bg-bg p-2"><Plus className="h-4 w-4" /></div>
        </div>
        <AmountInput
          label="Token B"
          value={amountB}
          onChange={setAmountB}
          token={tokenB}
          onSelectToken={() => setPickFor("b")}
        />

        {pairExists && (
          <div className="mt-3 rounded-xl border border-line bg-bg-soft/40 p-3 text-xs text-ink-dim">
            <div className="flex justify-between"><span>Pool</span>
              <a className="font-mono text-ink hover:text-spark-pink"
                 href={`https://pharosscan.xyz/address/${pairAddr}`} target="_blank" rel="noreferrer">
                {pairAddr!.slice(0,8)}…{pairAddr!.slice(-6)}
              </a>
            </div>
          </div>
        )}

        <button onClick={cta.action} disabled={cta.disabled} className="btn-primary mt-4 w-full">
          {(isPending || txMining) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {cta.label}
        </button>

        {isSuccess && (
          <div className="mt-3 rounded-xl border border-spark-pink/30 bg-spark-pink/5 p-3 text-center text-sm text-ink">
            Liquidity added. Check your LP position in <a href="/positions" className="font-semibold underline">My Positions</a>.
          </div>
        )}
      </div>

      <TokenSelectModal open={pickFor === "a"} onClose={() => setPickFor(null)}
        onSelect={(t) => { setTokenA(t); setAmountA(""); }} excludeAddress={tokenB?.address}/>
      <TokenSelectModal open={pickFor === "b"} onClose={() => setPickFor(null)}
        onSelect={(t) => { setTokenB(t); setAmountB(""); }} excludeAddress={tokenA?.address}/>
    </div>
  );
}
