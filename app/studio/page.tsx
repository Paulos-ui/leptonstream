"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Address } from "viem";
import { addrUrl } from "@/lib/arc";
import { short } from "@/lib/format";
import {
  hasWallet,
  connectWallet,
  readGatewayAvailable,
  readWithdrawable,
  initiateWithdraw,
  finalizeWithdraw,
} from "@/lib/connect";

export default function StudioPage() {
  const [wallet, setWallet] = useState<Address | null>(null);
  const [origin, setOrigin] = useState("");
  const [available, setAvailable] = useState("0");
  const [withdrawable, setWithdrawable] = useState("0");
  const [busy, setBusy] = useState("");
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => setOrigin(window.location.origin), []);

  const shareLink = wallet ? `${origin}/watch/${wallet}` : "";

  const refresh = useCallback(async () => {
    if (!wallet) return;
    try {
      setAvailable(await readGatewayAvailable(wallet));
      setWithdrawable(await readWithdrawable(wallet));
    } catch {
      /* read errors are non-fatal */
    }
  }, [wallet]);

  useEffect(() => {
    if (!wallet) return;
    void refresh();
    const id = setInterval(() => void refresh(), 6000);
    return () => clearInterval(id);
  }, [wallet, refresh]);

  const onConnect = async () => {
    setErr("");
    setBusy("connect");
    try {
      setWallet(await connectWallet());
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy("");
    }
  };

  const onInitiate = async () => {
    if (!wallet || !(parseFloat(available) > 0)) return;
    setBusy("initiate");
    setErr("");
    try {
      await initiateWithdraw(wallet, available);
      await refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy("");
    }
  };

  const onFinalize = async () => {
    if (!wallet) return;
    setBusy("finalize");
    setErr("");
    try {
      await finalizeWithdraw(wallet);
      await refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy("");
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <main className="min-h-screen px-5 pb-24 pt-24 sm:px-8 lg:px-16">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10">
          <span className="font-mono text-[11px] uppercase tracking-eyebrow text-cream/40">studio</span>
          <h1 className="mt-2 font-serif text-4xl text-cream">Go live</h1>
          <p className="mt-2 max-w-lg text-cream/55">
            Connect your wallet — its address is where viewers stream value, in real time.
          </p>
        </header>

        {!wallet ? (
          <button
            onClick={onConnect}
            disabled={busy === "connect"}
            className="rounded-full bg-amber px-7 py-3 font-mono text-sm text-ink transition-transform hover:scale-[1.02] disabled:opacity-50"
          >
            {busy === "connect" ? "connecting…" : hasWallet() ? "Connect wallet" : "Install a wallet to connect"}
          </button>
        ) : (
          <>
            <section className="rounded-2xl border border-cream/10 bg-ink/40 p-6">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-cream/40">your payee address</div>
              <a href={addrUrl(wallet)} target="_blank" rel="noreferrer" className="mt-1 block font-mono text-sm text-cream/80 hover:text-amber">
                {wallet}
              </a>

              <div className="mt-5 font-mono text-[10px] uppercase tracking-eyebrow text-cream/40">shareable watch link</div>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                <code className="flex-1 truncate rounded-lg border border-cream/10 bg-ink px-3 py-2.5 font-mono text-xs text-periwinkle/90">
                  {shareLink || "…"}
                </code>
                <div className="flex gap-2">
                  <button onClick={copy} className="rounded-full bg-amber px-5 py-2.5 font-mono text-xs text-ink transition-transform hover:scale-[1.03]">
                    {copied ? "copied ✓" : "copy link"}
                  </button>
                  <Link href={`/watch/${wallet}`} className="rounded-full border border-cream/20 px-5 py-2.5 font-mono text-xs text-cream/80 hover:border-cream/50">
                    open ↗
                  </Link>
                </div>
              </div>
            </section>

            <section className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-verdigris/25 bg-ink/40 p-6">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-eyebrow text-cream/40">earnings · available</span>
                  <button onClick={() => void refresh()} className="font-mono text-[11px] text-cream/50 hover:text-cream/80">refresh</button>
                </div>
                <div className="mt-2 font-mono text-3xl tabular-nums text-verdigris">${parseFloat(available).toFixed(6)}</div>
                <button
                  onClick={onInitiate}
                  disabled={!!busy || !(parseFloat(available) > 0)}
                  className="mt-4 rounded-full border border-verdigris/40 px-5 py-2 font-mono text-xs text-verdigris hover:border-verdigris disabled:opacity-40"
                >
                  {busy === "initiate" ? "initiating…" : "Initiate withdrawal"}
                </button>
              </div>
              <div className="rounded-2xl border border-cream/10 bg-ink/40 p-6">
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-cream/40">withdrawable now</div>
                <div className="mt-2 font-mono text-3xl tabular-nums text-cream/80">${parseFloat(withdrawable).toFixed(6)}</div>
                <button
                  onClick={onFinalize}
                  disabled={!!busy || !(parseFloat(withdrawable) > 0)}
                  className="mt-4 rounded-full border border-cream/25 px-5 py-2 font-mono text-xs text-cream hover:border-cream/60 disabled:opacity-40"
                >
                  {busy === "finalize" ? "withdrawing…" : "Finalize → wallet"}
                </button>
                <p className="mt-3 font-mono text-[11px] text-cream/40">
                  Gateway withdrawals mature after a short on-chain delay, then finalize to your wallet.
                </p>
              </div>
            </section>

            {err && <p className="mt-4 font-mono text-[11px] text-coral/80">{err}</p>}
          </>
        )}
      </div>
    </main>
  );
}
