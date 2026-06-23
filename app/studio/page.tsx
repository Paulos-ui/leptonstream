"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Address } from "viem";
import { addrUrl } from "@/lib/arc";
import {
  hasWallet, connectWallet, readGatewayAvailable, readWithdrawable,
  initiateWithdraw, finalizeWithdraw, walletError,
} from "@/lib/connect";
import { normalizeServer } from "@/lib/owncast";

export default function StudioPage() {
  const [wallet, setWallet] = useState<Address | null>(null);
  const [origin, setOrigin] = useState("");
  const [server, setServer] = useState("");
  const [available, setAvailable] = useState("0");
  const [withdrawable, setWithdrawable] = useState("0");
  const [busy, setBusy] = useState("");
  const [copied, setCopied] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => setOrigin(window.location.origin), []);

  const srv = server.trim() ? normalizeServer(server) : "";
  const supportLink = wallet ? `${origin}/watch/${wallet}${srv ? `?server=${encodeURIComponent(srv)}` : ""}` : "";
  const snippet = wallet
    ? `<script src="${origin}/embed.js" data-payee="${wallet}"${srv ? ` data-server="${srv}"` : ""}></script>`
    : "";

  const refresh = useCallback(async () => {
    if (!wallet) return;
    try {
      setAvailable(await readGatewayAvailable(wallet));
      setWithdrawable(await readWithdrawable(wallet));
    } catch { /* non-fatal */ }
  }, [wallet]);

  useEffect(() => {
    if (!wallet) return;
    void refresh();
    const id = setInterval(() => void refresh(), 6000);
    return () => clearInterval(id);
  }, [wallet, refresh]);

  const onConnect = async () => {
    setErr(""); setBusy("connect");
    try { setWallet(await connectWallet()); }
    catch (e) { setErr(walletError(e)); }
    finally { setBusy(""); }
  };
  const onInitiate = async () => {
    if (!wallet || !(parseFloat(available) > 0)) return;
    setBusy("initiate"); setErr("");
    try { await initiateWithdraw(wallet, available); await refresh(); }
    catch (e) { setErr(walletError(e)); }
    finally { setBusy(""); }
  };
  const onFinalize = async () => {
    if (!wallet) return;
    setBusy("finalize"); setErr("");
    try { await finalizeWithdraw(wallet); await refresh(); }
    catch (e) { setErr(walletError(e)); }
    finally { setBusy(""); }
  };
  const copy = async (text: string, which: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(which); setTimeout(() => setCopied(""), 1500);
  };

  return (
    <main className="min-h-screen px-5 pb-24 pt-24 sm:px-8 lg:px-16">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10">
          <span className="font-mono text-[11px] uppercase tracking-eyebrow text-cream/40">streamer setup</span>
          <h1 className="mt-2 font-serif text-4xl text-cream">Get paid by the second on the stream you already run.</h1>
          <p className="mt-3 max-w-xl text-cream/55">
            Keep your Owncast server. Add a support layer your viewers can stream value through, live — settled on Arc, with no platform to migrate to.
          </p>
        </header>

        {!wallet ? (
          <button onClick={onConnect} disabled={busy === "connect"}
            className="rounded-full bg-amber px-7 py-3 font-mono text-sm text-ink transition-transform hover:scale-[1.02] disabled:opacity-50">
            {busy === "connect" ? "connecting…" : hasWallet() ? "Connect wallet to begin" : "Install a wallet to connect"}
          </button>
        ) : (
          <>
            <section className="rounded-2xl border border-cream/10 bg-ink/40 p-6">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-cream/40">1 · your payee address</div>
              <a href={addrUrl(wallet)} target="_blank" rel="noreferrer" className="mt-1 block font-mono text-sm text-cream/80 hover:text-amber">{wallet}</a>

              <div className="mt-5 font-mono text-[10px] uppercase tracking-eyebrow text-cream/40">2 · your owncast server (optional)</div>
              <input value={server} onChange={(e) => setServer(e.target.value)} placeholder="https://watch.yourdomain.com"
                className="mt-2 w-full rounded-lg border border-cream/15 bg-ink px-3 py-2.5 font-mono text-sm text-cream placeholder:text-cream/30" />
              <p className="mt-2 font-mono text-[11px] text-cream/40">
                We use your instance&apos;s public status + HLS to show your live feed and viewer count. Leave blank to share a payment-only page.
              </p>
            </section>

            <section className="mt-6 rounded-2xl border border-amber/20 bg-ink/40 p-6">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-cream/40">3 · add it to your stream</div>

              <div className="mt-3 font-mono text-[11px] text-cream/60">Option A — overlay snippet (paste into Owncast → Admin → Custom Content / JS):</div>
              <div className="mt-2 flex items-start gap-2">
                <code className="flex-1 overflow-x-auto rounded-lg border border-cream/10 bg-ink px-3 py-2.5 font-mono text-[11px] text-periwinkle/90 whitespace-pre">{snippet}</code>
                <button onClick={() => copy(snippet, "snippet")} className="shrink-0 rounded-full bg-amber px-4 py-2.5 font-mono text-xs text-ink hover:scale-[1.03]">{copied === "snippet" ? "✓" : "copy"}</button>
              </div>

              <div className="mt-5 font-mono text-[11px] text-cream/60">Option B — shareable support link (no instance changes; put it in your stream description):</div>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 truncate rounded-lg border border-cream/10 bg-ink px-3 py-2.5 font-mono text-xs text-periwinkle/90">{supportLink}</code>
                <button onClick={() => copy(supportLink, "link")} className="shrink-0 rounded-full bg-amber px-4 py-2.5 font-mono text-xs text-ink hover:scale-[1.03]">{copied === "link" ? "✓" : "copy"}</button>
                <Link href={supportLink.replace(origin, "") || "#"} className="shrink-0 rounded-full border border-cream/20 px-4 py-2.5 font-mono text-xs text-cream/80 hover:border-cream/50">open ↗</Link>
              </div>
            </section>

            <section className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-verdigris/25 bg-ink/40 p-6">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-eyebrow text-cream/40">earnings · available</span>
                  <button onClick={() => void refresh()} className="font-mono text-[11px] text-cream/50 hover:text-cream/80">refresh</button>
                </div>
                <div className="mt-2 font-mono text-3xl tabular-nums text-verdigris">${parseFloat(available).toFixed(6)}</div>
                <button onClick={onInitiate} disabled={!!busy || !(parseFloat(available) > 0)}
                  className="mt-4 rounded-full border border-verdigris/40 px-5 py-2 font-mono text-xs text-verdigris hover:border-verdigris disabled:opacity-40">
                  {busy === "initiate" ? "initiating…" : "Initiate withdrawal"}
                </button>
              </div>
              <div className="rounded-2xl border border-cream/10 bg-ink/40 p-6">
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-cream/40">withdrawable now</div>
                <div className="mt-2 font-mono text-3xl tabular-nums text-cream/80">${parseFloat(withdrawable).toFixed(6)}</div>
                <button onClick={onFinalize} disabled={!!busy || !(parseFloat(withdrawable) > 0)}
                  className="mt-4 rounded-full border border-cream/25 px-5 py-2 font-mono text-xs text-cream hover:border-cream/60 disabled:opacity-40">
                  {busy === "finalize" ? "withdrawing…" : "Finalize → wallet"}
                </button>
                <p className="mt-3 font-mono text-[11px] text-cream/40">Gateway withdrawals mature after a short on-chain delay, then finalize to your wallet.</p>
              </div>
            </section>

            {err && <div className="mt-4 max-h-24 overflow-auto rounded-md border border-coral/30 bg-coral/5 p-2 font-mono text-[11px] text-coral/90 break-words">{err}</div>}
          </>
        )}
      </div>
    </main>
  );
}
