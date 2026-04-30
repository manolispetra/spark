"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useReadContract, useReadContracts, useBalance, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits, zeroAddress } from "viem";
import { Loader2, ShieldCheck, AlertTriangle, ArrowDownToLine } from "lucide-react";
import { ADDRESSES } from "@/config/addresses";
import { PRESALE_ABI, FACTORY_ABI, TOKEN_FACTORY_ABI } from "@/abi";
import { fmtNum } from "@/lib/utils";

export default function AdminPage() {
  const { address } = useAccount();
  const presale = ADDRESSES.SparkPresale as `0x${string}`;

  const { data: presaleOwner } = useReadContract({
    abi: PRESALE_ABI, address: presale, functionName: "owner",
    query: { enabled: presale !== zeroAddress },
  });

  const isOwner = !!address && !!presaleOwner &&
    (presaleOwner as string).toLowerCase() === address.toLowerCase();

  // PROS balance held by the presale contract.
  const { data: presaleBal, refetch: refetchBal } = useBalance({
    address: presale,
    query: { enabled: presale !== zeroAddress },
  });

  const reads = useReadContracts({
    allowFailure: true,
    contracts: [
      { abi: PRESALE_ABI, address: presale, functionName: "started" },
      { abi: PRESALE_ABI, address: presale, functionName: "ended" },
      { abi: PRESALE_ABI, address: presale, functionName: "totalRaisedPROS" },
      { abi: PRESALE_ABI, address: presale, functionName: "totalSold" },
      { abi: PRESALE_ABI, address: presale, functionName: "buyerCount" },
    ],
    query: { enabled: presale !== zeroAddress, refetchInterval: 8_000 },
  });

  const started   = reads.data?.[0]?.result as boolean | undefined;
  const ended     = reads.data?.[1]?.result as boolean | undefined;
  const raised    = reads.data?.[2]?.result as bigint | undefined;
  const sold      = reads.data?.[3]?.result as bigint | undefined;
  const buyers    = reads.data?.[4]?.result as bigint | undefined;

  // Withdraw form
  const [withdrawAmt, setWithdrawAmt] = useState("");
  // Start form
  const [rate, setRate]               = useState("50000"); // SPARK per PROS
  const [hardCap, setHardCap]         = useState("500"); // PROS
  const [walletCap, setWalletCap]     = useState("10");  // PROS

  const { writeContractAsync, isPending } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const { isLoading: txMining, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });
  useEffect(() => { if (isSuccess) { setWithdrawAmt(""); refetchBal(); reads.refetch(); } }, [isSuccess]);

  async function withdrawAll() {
    if (!presaleBal) return;
    const hash = await writeContractAsync({
      abi: PRESALE_ABI, address: presale, functionName: "withdrawPROS", args: [presaleBal.value],
    });
    setTxHash(hash);
  }
  async function withdrawSome() {
    if (!withdrawAmt) return;
    const v = parseUnits(withdrawAmt, 18);
    const hash = await writeContractAsync({
      abi: PRESALE_ABI, address: presale, functionName: "withdrawPROS", args: [v],
    });
    setTxHash(hash);
  }
  async function startPresale() {
    // Contract's `rate` = SPARK wei per 1 PROS (1e18 wei). User types human SPARK/PROS,
    // so we scale by 1e18 with parseUnits(.,18).
    const r  = parseUnits(rate, 18);
    const hc = parseUnits(hardCap, 18);
    const wc = parseUnits(walletCap, 18);
    const hash = await writeContractAsync({
      abi: PRESALE_ABI, address: presale, functionName: "start", args: [r, hc, wc],
    });
    setTxHash(hash);
  }
  async function endPresale() {
    const hash = await writeContractAsync({
      abi: PRESALE_ABI, address: presale, functionName: "endPresale",
    });
    setTxHash(hash);
  }
  async function pause() {
    const hash = await writeContractAsync({ abi: PRESALE_ABI, address: presale, functionName: "pause" });
    setTxHash(hash);
  }
  async function unpause() {
    const hash = await writeContractAsync({ abi: PRESALE_ABI, address: presale, functionName: "unpause" });
    setTxHash(hash);
  }

  if (!address) {
    return <Gate icon={<ShieldCheck className="h-8 w-8" />} title="Admin" body="Connect your wallet to continue." />;
  }
  if (presaleOwner === undefined) {
    return <Gate icon={<Loader2 className="h-8 w-8 animate-spin" />} title="Verifying…" body="Reading on-chain ownership." />;
  }
  if (!isOwner) {
    return <Gate icon={<AlertTriangle className="h-8 w-8 text-spark-orange" />} title="Access denied"
      body={`Only the presale owner can access this page. Connected wallet: ${address}`} />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold">⚡ Admin Console</h1>
        <p className="mt-1 text-sm text-ink-dim">Owner-only controls for the SPARK presale and Spark V2 factory.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Status"   value={ended ? "Ended" : started ? "Live" : "Not started"} />
        <Stat label="Buyers"   value={buyers !== undefined ? buyers.toString() : "—"} />
        <Stat label="Raised"   value={raised !== undefined ? `${fmtNum(Number(formatUnits(raised, 18)), 4)} PROS` : "—"} />
        <Stat label="In contract" value={presaleBal ? `${fmtNum(Number(formatUnits(presaleBal.value, 18)), 4)} PROS` : "—"} />
      </div>

      {/* Withdraw */}
      <Section title="Withdraw collected PROS"
               subtitle="The full balance can be sent to the owner wallet at any time. You can also withdraw a custom amount.">
        <div className="flex flex-col gap-3 sm:flex-row">
          <button onClick={withdrawAll}
                  disabled={!presaleBal?.value || isPending || txMining}
                  className="btn-primary flex-1">
            {(isPending || txMining) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <ArrowDownToLine className="mr-2 h-4 w-4" />
            Withdraw all ({presaleBal ? fmtNum(Number(formatUnits(presaleBal.value, 18)), 4) : "0"} PROS)
          </button>
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-line bg-bg-soft/40 px-3">
            <input
              inputMode="decimal" placeholder="Custom amount"
              value={withdrawAmt}
              onChange={(e) => setWithdrawAmt(e.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1"))}
              className="flex-1 bg-transparent py-2.5 text-sm outline-none"
            />
            <span className="text-xs text-ink-dim">PROS</span>
            <button onClick={withdrawSome} disabled={!withdrawAmt || isPending || txMining}
              className="btn-ghost text-sm">Withdraw</button>
          </div>
        </div>
      </Section>

      {/* Start / pause / end presale */}
      <Section title="Presale lifecycle"
               subtitle="Set rate (SPARK per 1 PROS), hard cap, and per-wallet cap. Once started, rate cannot be changed.">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Rate (SPARK/PROS)"><input className="field-input" value={rate}
            onChange={(e) => setRate(e.target.value.replace(/[^\d.]/g,""))} /></Field>
          <Field label="Hard cap (PROS)"><input className="field-input" value={hardCap}
            onChange={(e) => setHardCap(e.target.value.replace(/[^\d.]/g,""))} /></Field>
          <Field label="Per-wallet cap (PROS)"><input className="field-input" value={walletCap}
            onChange={(e) => setWalletCap(e.target.value.replace(/[^\d.]/g,""))} /></Field>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={startPresale} disabled={started || ended || isPending || txMining} className="btn-primary">
            {(isPending || txMining) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Start presale
          </button>
          <button onClick={pause} disabled={!started || ended || isPending || txMining} className="btn-ghost">Pause</button>
          <button onClick={unpause} disabled={!started || ended || isPending || txMining} className="btn-ghost">Unpause</button>
          <button onClick={endPresale} disabled={!started || ended || isPending || txMining}
            className="btn-ghost border-spark-pink/40 text-spark-pink">End presale</button>
        </div>
      </Section>

      <p className="mx-auto mt-8 max-w-xl text-center text-xs text-ink-mute">
        Best practice: transfer the presale ownership to a multisig once the launch is stable (Ownable2Step requires accept).
      </p>
    </div>
  );
}

/* ----- helpers ----- */
function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="card mt-6 p-5">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-ink-dim">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-ink-dim">{label}</span>
      {children}
      <style jsx global>{`
        .field-input {
          width: 100%; border-radius: 0.75rem; border: 1px solid #1F2230;
          background: rgba(16,18,27,.4); padding: 0.5rem 0.75rem; font-size: 0.875rem; outline: none;
        }
        .field-input:focus { border-color: rgba(255,45,120,.4); }
      `}</style>
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-3">
      <div className="text-[11px] uppercase tracking-wider text-ink-mute">{label}</div>
      <div className="mt-1 font-display text-base font-bold">{value}</div>
    </div>
  );
}

function Gate({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="mx-auto mt-12 max-w-md">
      <div className="card p-8 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-line bg-bg-soft/60">
          {icon}
        </div>
        <h2 className="font-display text-xl font-bold">{title}</h2>
        <p className="mt-2 break-all text-sm text-ink-dim">{body}</p>
      </div>
    </div>
  );
}
