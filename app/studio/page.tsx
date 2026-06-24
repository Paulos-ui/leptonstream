"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { addrUrl } from "@/lib/arc";
import { short } from "@/lib/format";
import {
  readGatewayAvailable, readMaturing, readWithdrawable,
  initiateWithdraw, finalizeWithdraw, walletError,
} from "@/lib/connect";
import { useWallet } from "@/hooks/useWallet";
import { normalizeServer } from "@/lib/owncast";

// Smooth count-up so earnings feel like they're flowing in, not ticking.
function useCountUp(target: number) {
  const [val, setVal] = useState(target);
  const raf = useRef(0);
  const from = useRef(target);
  useEffect(() => {
    from.current = val;
    const t0 = performance.now();
    const dur = 700;
    cancelAnimationFrame(raf.current);
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      setVal(from.current + (target - from.current) * e);
      if (k < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return val;
}

export default function DashboardPage() {
  const { account, chainOk, connecting, connect, switchToArc, error: connErr } = useWallet();
  const [origin, setOrigin] = useState("");
  const [server, setServer] = useState("");
  const [available, setAvailable] = useState(0);
  const [maturing, setMaturing] = useState(0);
  const [withdrawable, setWithdrawable] = useState(0);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState("");
  const [setupOpen, setSetupOpen] = useState(false);

  useEffect(() => setOrigin(window.location.origin), []);

  const srv = server.trim() ? normalizeServer(server) : "";
  const supportLink = account ? `${origin}/watch/${account}${srv ? `?server=${encodeURIComponent(srv)}` : ""}` : "";
  const snippet = account
    ? `<script src="${origin}/embed.js" data-payee="${account}"${srv ? ` data-server="${srv}"` : ""}></script>`
    : "";

  const refresh = useCallback(async () => {
    if (!account) return;
    try {
      const [a, m, w] = await Promise.all([
        readGatewayAvailable(account), readMaturing(account), readWithdrawable(account),
      ]);
      setAvailable(parseFloat(a)); setMaturing(parseFloat(m)); setWithdrawable(parseFloat(w));
    } catch { /* non-fatal */ }
  }, [account]);

  useEffect(() => {
    if (!account) return;
    void refresh();
    const id = setInterval(() => void refresh(), 6000);
    return () => clearInterval(id);
  }, [account, refresh]);

  const onInitiate = async () => {
    if (!account || !(available > 0)) return;
    setBusy("initiate"); setErr("");
    try { await initiateWithdraw(account, available.toString()); await refresh(); }
    catch (e) { setErr(walletError(e)); } finally { setBusy(""); }
  };
  const onFinalize = async () => {
    if (!account) return;
    setBusy("finalize"); setErr("");
    try { await finalizeWithdraw(account); await refresh(); }
    catch (e) { setErr(walletError(e)); } finally { setBusy(""); }
  };
  const copy = async (text: string, which: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(which); setTimeout(() => setCopied(""), 1500);
  };

  const heroVal = useCountUp(available);

  // ---- Not connected ----
  if (!account) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6">
        <span className="font-mono text-[11px] uppercase tracking-eyebrow text-amber/80">creator dashboard</span>
        <h1 className="mt-3 font-serif text-5xl leading-tight text-cream">Get paid by the second on the stream you already run.</h1>
        <p className="mt-4 max-w-lg text-cream/55">Connect the wallet you want earnings to settle to. It becomes your payee address — self-custody, no account, no middleman.</p>
        <button onClick={() => void connect()} disabled={connecting}
          className="mt-8 w-fit rounded-full bg-amber px-7 py-3 font-mono text-sm text-ink transition-transform hover:scale-[1.02] disabled:opacity-50">
          {connecting ? "connecting…" : "Connect wallet"}
        </button>
        {connErr && <p className="mt-4 font-mono text-[11px] text-coral/80">{connErr}</p>}
      </main>
    );
  }

  // ---- Connected dashboard ----
  const total = available + maturing + withdrawable;
  return (
    <main className="min-h-screen px-5 pb-24 pt-24 sm:px-8 lg:px-16">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-eyebrow text-cream/40">dashboard</span>
            <h1 className="mt-1 font-serif text-3xl text-cream">Your earnings</h1>
          </div>
          <div className="flex items-center gap-3">
            {!chainOk && (
              <button onClick={() => void switchToArc()} className="rounded-full border border-amber/50 px-3 py-1.5 font-mono text-[11px] text-amber hover:border-amber">Switch to Arc</button>
            )}
            <span className="flex items-center gap-2 rounded-full border border-cream/15 px-3 py-1.5 font-mono text-[11px] text-cream/70">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: chainOk ? "#5E8F86" : "#FF6B57" }} />
              <a href={addrUrl(account)} target="_blank" rel="noreferrer" className="hover:text-amber">{short(account)}</a>
            </span>
          </div>
        </header>

        {/* Hero figure */}
        <div className="rounded-3xl border border-cream/10 bg-gradient-to-b from-ink/60 to-ink/20 p-8 sm:p-10">
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-cream/40">available to withdraw</div>
          <div className="mt-2 font-serif text-6xl tabular-nums text-amber sm:text-7xl">
            ${heroVal.toFixed(6)}
          </div>
          <div className="mt-2 font-mono text-[11px] text-cream/40">
            ${total.toFixed(6)} total in Gateway · settles to {short(account)} on Arc
          </div>

          {/* Value pipeline */}
          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
            <Stage label="available" value={available} accent="#F6A92B"
              action={available > 0 ? { text: busy === "initiate" ? "initiating…" : "Withdraw all →", onClick: onInitiate, disabled: !!busy } : undefined} />
            <Flow active={available > 0} />
            <Stage label="maturing" value={maturing} accent="#8B8BFA" sub="on-chain delay" />
            <Flow active={withdrawable > 0} />
            <Stage label="ready · in wallet next" value={withdrawable} accent="#5E8F86"
              action={withdrawable > 0 ? { text: busy === "finalize" ? "finalizing…" : "Finalize →", onClick: onFinalize, disabled: !!busy } : undefined} />
          </div>
          {err && <div className="mt-4 max-h-20 overflow-auto rounded-md border border-coral/30 bg-coral/5 p-2 font-mono text-[11px] text-coral/90 break-words">{err}</div>}
        </div>

        {/* Setup (folded) */}
        <div className="mt-6 rounded-2xl border border-cream/10 bg-ink/40">
          <button onClick={() => setSetupOpen((o) => !o)} className="flex w-full items-center justify-between p-6 text-left">
            <span className="font-mono text-[11px] uppercase tracking-eyebrow text-cream/60">set up your owncast stream</span>
            <span className="font-mono text-cream/40">{setupOpen ? "–" : "+"}</span>
          </button>
          {setupOpen && (
            <div className="border-t border-cream/10 p-6">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-cream/40">your owncast server (optional)</div>
              <input value={server} onChange={(e) => setServer(e.target.value)} placeholder="https://watch.yourdomain.com"
                className="mt-2 w-full rounded-lg border border-cream/15 bg-ink px-3 py-2.5 font-mono text-sm text-cream placeholder:text-cream/30" />

              <div className="mt-5 font-mono text-[11px] text-cream/60">Overlay snippet (Owncast → Admin → Custom Content / JS):</div>
              <div className="mt-2 flex items-start gap-2">
                <code className="flex-1 overflow-x-auto rounded-lg border border-cream/10 bg-ink px-3 py-2.5 font-mono text-[11px] text-periwinkle/90 whitespace-pre">{snippet}</code>
                <button onClick={() => copy(snippet, "snippet")} className="shrink-0 rounded-full bg-amber px-4 py-2.5 font-mono text-xs text-ink">{copied === "snippet" ? "✓" : "copy"}</button>
              </div>

              <div className="mt-5 font-mono text-[11px] text-cream/60">Or a shareable support link (no instance changes):</div>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 truncate rounded-lg border border-cream/10 bg-ink px-3 py-2.5 font-mono text-xs text-periwinkle/90">{supportLink}</code>
                <button onClick={() => copy(supportLink, "link")} className="shrink-0 rounded-full bg-amber px-4 py-2.5 font-mono text-xs text-ink">{copied === "link" ? "✓" : "copy"}</button>
                <Link href={supportLink.replace(origin, "") || "#"} className="shrink-0 rounded-full border border-cream/20 px-4 py-2.5 font-mono text-xs text-cream/80 hover:border-cream/50">open ↗</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Stage({ label, value, accent, sub, action }: {
  label: string; value: number; accent: string; sub?: string;
  action?: { text: string; onClick: () => void; disabled: boolean };
}) {
  return (
    <div className="rounded-2xl border border-cream/10 bg-ink/40 p-5">
      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-cream/40">{label}</div>
      <div className="mt-1.5 font-mono text-2xl tabular-nums" style={{ color: accent }}>${value.toFixed(6)}</div>
      {sub && <div className="mt-1 font-mono text-[10px] text-cream/30">{sub}</div>}
      {action && (
        <button onClick={action.onClick} disabled={action.disabled}
          className="mt-3 w-full rounded-full border px-4 py-1.5 font-mono text-[11px] disabled:opacity-40"
          style={{ borderColor: `${accent}66`, color: accent }}>
          {action.text}
        </button>
      )}
    </div>
  );
}

// Animated connector — value visibly flows when a stage has a balance.
function Flow({ active }: { active: boolean }) {
  return (
    <div className="hidden items-center sm:flex" aria-hidden="true">
      <div className="relative h-[2px] w-full min-w-[28px] overflow-hidden rounded bg-cream/10">
        {active && (
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(90deg, transparent, #F6A92B, transparent)",
              backgroundSize: "60% 100%",
              animation: "flowRight 1.4s linear infinite",
            }}
          />
        )}
      </div>
      <style>{`@keyframes flowRight{from{background-position:-60% 0}to{background-position:160% 0}}`}</style>
    </div>
  );
}
