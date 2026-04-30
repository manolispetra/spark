"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits, decodeEventLog, isAddress } from "viem";
import { Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { ADDRESSES } from "@/config/addresses";
import { TOKEN_FACTORY_ABI } from "@/abi";
import ShareToXButton from "@/components/ui/ShareToXButton";

export default function GeneratorPage() {
  const { address } = useAccount();

  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [supply, setSupply] = useState("1000000");
  const [enableTax, setEnableTax] = useState(false);
  const [buyTax, setBuyTax] = useState("0");
  const [sellTax, setSellTax] = useState("0");
  const [taxTreasury, setTaxTreasury] = useState("");
  const [logoURI, setLogoURI] = useState("");

  const { data: fee } = useReadContract({
    abi: TOKEN_FACTORY_ABI,
    address: ADDRESSES.TokenFactory as `0x${string}`,
    functionName: "creationFee",
  });

  const { writeContractAsync, isPending } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const { data: receipt, isLoading: txMining, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  // Pull the new token address from the TokenCreated event.
  let createdAddress: `0x${string}` | undefined;
  if (receipt) {
    for (const log of receipt.logs) {
      try {
        const ev = decodeEventLog({ abi: TOKEN_FACTORY_ABI, data: log.data, topics: log.topics });
        if (ev.eventName === "TokenCreated") { createdAddress = (ev.args as any).token; break; }
      } catch { /* unrelated log */ }
    }
  }

  const valid =
    !!name && !!symbol && symbol.length <= 12 &&
    Number(supply) > 0 && Number(supply) <= 1e15 &&
    (!enableTax || (
      Number(buyTax) >= 0 && Number(buyTax) <= 10 &&
      Number(sellTax) >= 0 && Number(sellTax) <= 10 &&
      isAddress(taxTreasury || "")
    ));

  async function create() {
    if (!address || !valid) return;
    const buyBps  = enableTax ? Math.round(Number(buyTax) * 100) : 0;
    const sellBps = enableTax ? Math.round(Number(sellTax) * 100) : 0;
    const treasury = (enableTax ? taxTreasury : "0x0000000000000000000000000000000000000000") as `0x${string}`;
    const totalSupply = parseUnits(supply, 18);
    const hash = await writeContractAsync({
      abi: TOKEN_FACTORY_ABI,
      address: ADDRESSES.TokenFactory as `0x${string}`,
      functionName: "createToken",
      args: [name, symbol.toUpperCase(), totalSupply, buyBps, sellBps, treasury, logoURI],
      value: (fee as bigint | undefined) ?? 0n,
    });
    setTxHash(hash);
  }

  if (isSuccess && createdAddress) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="card p-8 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-spark-pink" />
          <h2 className="font-display text-2xl font-bold">Your token is live ⚡</h2>
          <p className="mt-2 text-sm text-ink-dim">
            <span className="font-semibold text-ink">{name}</span> ({symbol.toUpperCase()}) deployed on Pharos.
          </p>
          <div className="mt-4 break-all rounded-xl border border-line bg-bg-soft/60 p-3 font-mono text-xs">
            {createdAddress}
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href={`/liquidity?token=${createdAddress}`}
              className="btn-primary"
            >
              Add Liquidity Now <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href={`/swap`} className="btn-ghost">Open Swap</Link>
            <ShareToXButton symbol={symbol.toUpperCase()} address={createdAddress} />
          </div>
          <a
            href={`https://pharosscan.xyz/address/${createdAddress}`}
            target="_blank" rel="noreferrer"
            className="mt-4 inline-block text-xs text-ink-dim hover:text-ink underline"
          >
            View on Pharosscan →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold">Token Generator</h1>
        <p className="mt-1 text-sm text-ink-dim">Launch your own ERC-20 on Pharos in under a minute. No code required.</p>
      </div>

      <div className="card p-5">
        <Field label="Name">
          <input className="field-input" placeholder="Pepe Pharos" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Symbol">
          <input className="field-input uppercase" placeholder="PEPHA" maxLength={12}
                 value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} />
        </Field>
        <Field label="Total supply">
          <input className="field-input" inputMode="numeric" placeholder="1000000"
                 value={supply}
                 onChange={(e) => setSupply(e.target.value.replace(/[^\d]/g, ""))} />
          <span className="mt-1 block text-xs text-ink-mute">18 decimals — minted to your wallet at deploy.</span>
        </Field>

        <Field label="Logo URI (optional)">
          <input className="field-input" placeholder="https://… or ipfs://…"
                 value={logoURI} onChange={(e) => setLogoURI(e.target.value)} />
        </Field>

        {/* Optional tax block */}
        <div className="mt-4 rounded-xl border border-line bg-bg-soft/40 p-4">
          <label className="flex cursor-pointer items-center gap-3 select-none">
            <input type="checkbox" checked={enableTax} onChange={(e) => setEnableTax(e.target.checked)}
                   className="h-4 w-4 accent-spark-pink"/>
            <span className="text-sm font-semibold">Enable buy/sell tax (advanced)</span>
          </label>
          {enableTax && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="Buy tax %" compact>
                <input className="field-input" inputMode="decimal" placeholder="0–10" value={buyTax}
                       onChange={(e) => setBuyTax(e.target.value.replace(/[^\d.]/g, ""))} />
              </Field>
              <Field label="Sell tax %" compact>
                <input className="field-input" inputMode="decimal" placeholder="0–10" value={sellTax}
                       onChange={(e) => setSellTax(e.target.value.replace(/[^\d.]/g, ""))} />
              </Field>
              <div className="col-span-2">
                <Field label="Tax treasury address" compact>
                  <input className="field-input" placeholder="0x…" value={taxTreasury}
                         onChange={(e) => setTaxTreasury(e.target.value)} />
                </Field>
              </div>
              <p className="col-span-2 text-xs text-ink-mute">
                Tax is only applied on transfers to/from registered DEX pairs. You can permanently renounce tax later from the contract.
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-line bg-bg-soft/40 p-3 text-sm">
          <span className="text-ink-dim">Creation fee</span>
          <span className="font-mono">{fee !== undefined ? `${formatUnits(fee as bigint, 18)} PROS` : "—"}</span>
        </div>

        <button onClick={create} disabled={!address || !valid || isPending || txMining} className="btn-primary mt-4 w-full">
          {(isPending || txMining) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {!address ? "Connect wallet" : "Spark my token ⚡"}
        </button>
      </div>

      <style jsx>{`
        .field-input {
          width: 100%; border-radius: 0.75rem; border: 1px solid #1F2230;
          background: rgba(16,18,27,.4); padding: 0.625rem 0.75rem; font-size: 0.875rem; outline: none;
        }
        .field-input:focus { border-color: rgba(255,45,120,.4); }
      `}</style>
    </div>
  );
}

function Field({ label, children, compact }: { label: string; children: React.ReactNode; compact?: boolean }) {
  return (
    <label className={`block ${compact ? "" : "mt-3"}`}>
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-dim">{label}</span>
      {children}
    </label>
  );
}
