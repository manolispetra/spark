"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits, zeroAddress } from "viem";
import { Loader2, Sparkles } from "lucide-react";
import { ADDRESSES } from "@/config/addresses";
import { PRESALE_ABI } from "@/abi";
import ShareToXButton from "@/components/ui/ShareToXButton";
import { fmtNum } from "@/lib/utils";

export default function PresalePage() {
  const { address } = useAccount();
  const [amount, setAmount] = useState("");
  const presale = ADDRESSES.SparkPresale as `0x${string}`;

  const reads = useReadContracts({
    allowFailure: true,
    contracts: [
      { abi: PRESALE_ABI, address: presale, functionName: "rate" },
      { abi: PRESALE_ABI, address: presale, functionName: "hardCapPROS" },
      { abi: PRESALE_ABI, address: presale, functionName: "totalRaisedPROS" },
      { abi: PRESALE_ABI, address: presale, functionName: "totalSold" },
      { abi: PRESALE_ABI, address: presale, functionName: "buyerCount" },
      { abi: PRESALE_ABI, address: presale, functionName: "started" },
      { abi: PRESALE_ABI, address: presale, functionName: "ended" },
      { abi: PRESALE_ABI, address: presale, functionName: "CLAIM_START" },
      { abi: PRESALE_ABI, address: presale, functionName: "claimInfo",
        args: address ? [address] : undefined },
    ],
    query: { enabled: presale !== zeroAddress, refetchInterval: 8_000 },
  });

  const rate            = reads.data?.[0]?.result as bigint | undefined;
  const hardCapPROS     = reads.data?.[1]?.result as bigint | undefined;
  const totalRaisedPROS = reads.data?.[2]?.result as bigint | undefined;
  const totalSold       = reads.data?.[3]?.result as bigint | undefined;
  const buyerCount      = reads.data?.[4]?.result as bigint | undefined;
  const started         = reads.data?.[5]?.result as boolean | undefined;
  const ended           = reads.data?.[6]?.result as boolean | undefined;
  const CLAIM_START     = reads.data?.[7]?.result as bigint | undefined;
  const claimInfo       = reads.data?.[8]?.result as readonly [bigint, boolean, boolean, bigint] | undefined;

  const progress = hardCapPROS && totalRaisedPROS && hardCapPROS > 0n
    ? Number((totalRaisedPROS * 10000n) / hardCapPROS) / 100
    : 0;

  const pros = (() => {
    try { return amount ? parseUnits(amount, 18) : 0n; } catch { return 0n; }
  })();
  const sparkOut = pros && rate ? (pros * rate) / 10n ** 18n : 0n;

  const { writeContractAsync, isPending } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const { isLoading: txMining, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });
  useEffect(() => { if (isSuccess) { setAmount(""); reads.refetch(); } }, [isSuccess]);

  async function buy() {
    if (!pros) return;
    const hash = await writeContractAsync({
      abi: PRESALE_ABI, address: presale, functionName: "buy", value: pros,
    });
    setTxHash(hash);
  }
  async function claim() {
    const hash = await writeContractAsync({
      abi: PRESALE_ABI, address: presale, functionName: "claim",
    });
    setTxHash(hash);
  }

  // Countdown
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => { const t = setInterval(() => setNow(Math.floor(Date.now()/1000)), 1000); return () => clearInterval(t); }, []);
  const claimUnix = CLAIM_START ? Number(CLAIM_START) : 1750809600; // 2026-06-25 00:00:00 UTC
  const secondsLeft = Math.max(0, claimUnix - now);
  const days   = Math.floor(secondsLeft / 86400);
  const hours  = Math.floor((secondsLeft % 86400) / 3600);
  const mins   = Math.floor((secondsLeft % 3600) / 60);
  const secs   = secondsLeft % 60;

  const claimable    = claimInfo?.[0] ?? 0n;
  const isClaimed    = claimInfo?.[1] ?? false;
  const claimOpen    = claimInfo?.[2] ?? false;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 text-center">
        <h1 className="font-display text-4xl font-extrabold">
          $SPARK <span className="text-grad">Presale</span>
        </h1>
        <p className="mt-2 text-sm text-ink-dim">
          Be the spark. 25,000,000 SPARK reserved for early supporters. Claim opens{" "}
          <span className="font-semibold text-ink">June 25, 2026 (UTC)</span>.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Rate"       value={rate ? `${fmtNum(Number(formatUnits(rate, 18)), 0)} / PROS` : "—"} />
        <Stat label="Raised"     value={totalRaisedPROS ? `${fmtNum(Number(formatUnits(totalRaisedPROS, 18)), 2)} PROS` : "—"} />
        <Stat label="Sold"       value={totalSold ? `${fmtNum(Number(formatUnits(totalSold, 18)), 0)} SPARK` : "—"} />
        <Stat label="Buyers"     value={buyerCount !== undefined ? buyerCount.toString() : "—"} />
      </div>

      {/* Progress */}
      <div className="card mt-4 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-dim">Progress</span>
          <span className="font-mono">{progress.toFixed(2)}%</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full border border-line bg-bg">
          <div className="h-full bg-spark-grad transition-[width]" style={{ width: `${Math.min(100, progress)}%` }} />
        </div>
        <div className="mt-1 text-right text-xs text-ink-mute">
          Hard cap: {hardCapPROS ? `${fmtNum(Number(formatUnits(hardCapPROS, 18)), 2)} PROS` : "—"}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Buy box */}
        <div className="card p-5">
          <h2 className="font-display text-lg font-bold">Buy with PROS</h2>
          {!started && (
            <div className="mt-3 rounded-xl border border-spark-orange/40 bg-spark-orange/10 p-3 text-sm text-ink-dim">
              The presale has not been started by the team yet.
            </div>
          )}
          {ended && (
            <div className="mt-3 rounded-xl border border-line bg-bg-soft/40 p-3 text-sm text-ink-dim">
              The presale has ended. Claim opens at the timestamp above.
            </div>
          )}
          <div className="mt-3 rounded-2xl border border-line bg-bg-soft/40 p-4">
            <div className="text-xs text-ink-dim">You pay</div>
            <div className="flex items-center gap-3">
              <input
                inputMode="decimal" placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1"))}
                className="input-base"
              />
              <div className="rounded-xl border border-line bg-bg px-3 py-2 text-sm font-semibold">PROS</div>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-ink-dim">
            <span>You receive</span>
            <span className="font-mono text-ink">
              {sparkOut ? fmtNum(Number(formatUnits(sparkOut, 18)), 2) : "0"} SPARK
            </span>
          </div>
          <button onClick={buy} disabled={!address || !started || ended || !pros || isPending || txMining} className="btn-primary mt-4 w-full">
            {(isPending || txMining) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {!address ? "Connect wallet" : "Buy SPARK ⚡"}
          </button>
        </div>

        {/* Claim box */}
        <div className="card p-5">
          <h2 className="font-display text-lg font-bold">Claim ($SPARK)</h2>
          <div className="mt-3 grid grid-cols-4 gap-2 text-center">
            {[
              { l: "Days",  v: days },
              { l: "Hours", v: hours },
              { l: "Mins",  v: mins },
              { l: "Secs",  v: secs },
            ].map((b) => (
              <div key={b.l} className="rounded-xl border border-line bg-bg-soft/40 p-2">
                <div className="font-display text-2xl font-bold tabular-nums">{String(b.v).padStart(2,"0")}</div>
                <div className="text-[10px] uppercase tracking-wider text-ink-mute">{b.l}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-line bg-bg-soft/40 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-dim">Your allocation</span>
              <span className="font-mono">{fmtNum(Number(formatUnits(claimable, 18)), 2)} SPARK</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-dim">Status</span>
              <span className="text-ink">{isClaimed ? "Claimed ✓" : claimOpen ? "Claim open" : "Locked"}</span>
            </div>
          </div>
          <button onClick={claim} disabled={!address || !claimable || isClaimed || !claimOpen || isPending || txMining} className="btn-primary mt-4 w-full">
            {(isPending || txMining) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isClaimed ? "Already claimed" : claimOpen ? "Claim my SPARK" : "Claim opens June 25, 2026"}
          </button>
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-3">
        <ShareToXButton symbol="SPARK" label="Share the presale" />
        <a href="/swap" className="btn-ghost"><Sparkles className="mr-2 h-4 w-4" /> Trade on Spark</a>
      </div>

      <p className="mx-auto mt-6 max-w-xl text-center text-xs text-ink-mute">
        Presale funds (PROS) are held by an Ownable2Step contract and may be withdrawn by the deployer/owner at any time.
        Unsold SPARK can be reclaimed after the sale ends. Claims activate exactly at the on-chain CLAIM_START timestamp.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="text-[11px] uppercase tracking-wider text-ink-mute">{label}</div>
      <div className="mt-1 font-display text-lg font-bold">{value}</div>
    </div>
  );
}
