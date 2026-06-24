"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Hex, Address } from "viem";
import { isAddress } from "viem";
import { useStreamSession } from "@/hooks/useStreamSession";
import VideoStream from "@/components/product/VideoStream";
import { formatUSDC } from "@/core/money";
import { ARC, txUrl, addrUrl } from "@/lib/arc";
import { STATE_COLOR, STATE_LABEL, short } from "@/lib/format";
import { loadOrCreateKey, addressOf, makeClient, depositToGateway } from "@/lib/wallet";
import { hasWallet, readWalletUsdc, readGatewayAvailable, fundSession, waitForTx, walletError } from "@/lib/connect";
import { useWallet } from "@/hooks/useWallet";
import { getStatus, getInstanceName, hlsUrl } from "@/lib/owncast";

const RATE = 0.000124; // $/sec

export default function WatchPage() {
  const params = useParams<{ creator: string }>();
  const sp = useSearchParams();
  const creator = params.creator;
  const server = sp.get("server"); // Owncast instance, optional
  const safe = sp.get("safe") === "1"; // hidden stage fallback
  const validCreator = isAddress(creator);

  const [ceiling, setCeiling] = useState(0.1);
  const { account: wallet, chainOk, connecting, connect, switchToArc, error: connErr } = useWallet();
  const [pk, setPk] = useState<Hex | null>(null);
  const [sessionAddr, setSessionAddr] = useState<Address | "">("");
  const [walletUsdc, setWalletUsdc] = useState("—");
  const [armed, setArmed] = useState("0");
  const [fundAmt, setFundAmt] = useState("1.00");
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  // Real playback quality + optional demo override.
  const [realQuality, setRealQuality] = useState(1);
  const [simUntil, setSimUntil] = useState(0);
  const quality = Date.now() < simUntil ? 0.3 : realQuality;

  // Owncast live status (their server, their truth).
  const [oc, setOc] = useState<{ online: boolean; viewers: number; name?: string } | null>(null);
  useEffect(() => {
    if (!server) return;
    let alive = true;
    const poll = async () => {
      try {
        const s = await getStatus(server);
        if (alive && s) setOc((p) => ({ online: s.online, viewers: s.viewerCount, name: p?.name }));
      } catch {
        if (alive) setOc(null);
      }
    };
    void poll();
    void getInstanceName(server).then((n) => alive && n && setOc((p) => ({ online: p?.online ?? false, viewers: p?.viewers ?? 0, name: n })));
    const id = setInterval(poll, 10000);
    return () => { alive = false; clearInterval(id); };
  }, [server]);

  const videoSrc = server ? hlsUrl(server) : sp.get("src") ?? undefined;

  useEffect(() => {
    const key = loadOrCreateKey();
    setPk(key);
    setSessionAddr(addressOf(key) as Address);
  }, []);

  const refresh = useCallback(async () => {
    try {
      if (wallet) setWalletUsdc(await readWalletUsdc(wallet));
      if (sessionAddr) setArmed(await readGatewayAvailable(sessionAddr as Address));
    } catch { /* contextual */ }
  }, [wallet, sessionAddr]);

  useEffect(() => { void refresh(); }, [refresh]);


  const onArm = async () => {
    if (!wallet || !pk || !sessionAddr) return;
    setErr(""); setBusy("arm");
    try {
      const tx = await fundSession(wallet, sessionAddr as Address, fundAmt);
      await waitForTx(tx);
      const client = await makeClient(pk);
      await depositToGateway(client, fundAmt);
      await refresh();
    } catch (e) { setErr(walletError(e)); }
    finally { setBusy(""); }
  };

  const s = useStreamSession({ creator, ratePerSecUsd: RATE, ceilingUsd: ceiling, demo: safe, privateKey: pk, quality });

  const hasFunds = parseFloat(walletUsdc) > 0;
  const canStart = safe || parseFloat(armed) > 0;
  const stateColor = STATE_COLOR[s.state];

  if (!validCreator) {
    return (
      <main className="mx-auto max-w-xl px-6 py-32 text-center">
        <h1 className="font-serif text-3xl text-cream">Invalid support link</h1>
        <p className="mt-4 text-cream/60">
          A link must point to a creator&apos;s Arc address. Streamers create theirs in the{" "}
          <Link href="/studio" className="text-amber underline">studio</Link>.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 pb-24 pt-24 sm:px-8 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-[11px] uppercase tracking-eyebrow text-cream/40">
            {oc?.name ? `${oc.name} · ` : "supporting · "}{short(creator)}
            {server && oc?.online && <span className="ml-2 text-verdigris">{oc.viewers} watching</span>}
          </span>
          {wallet && (
            <span className="font-mono text-[11px] text-cream/50">
              you · <a href={addrUrl(wallet)} target="_blank" rel="noreferrer" className="text-periwinkle/80 hover:text-periwinkle">{short(wallet)}</a>
            </span>
          )}
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <VideoStream src={videoSrc} playing={s.playing} quality={quality} color={stateColor} onQuality={setRealQuality} />

            <div className="mt-5 flex flex-wrap items-center gap-3">
              {!s.playing ? (
                <button onClick={() => void s.start()} disabled={!canStart}
                  className="rounded-full bg-amber px-6 py-2.5 font-mono text-sm text-ink transition-transform enabled:hover:scale-[1.03] disabled:opacity-40">
                  {s.state === "stopped" ? "Stopped" : "Start supporting"}
                </button>
              ) : (
                <button onClick={s.pause} className="rounded-full border border-cream/25 px-6 py-2.5 font-mono text-sm text-cream hover:border-cream/60">Pause</button>
              )}
              <button onClick={s.stop} className="rounded-full border border-cream/15 px-6 py-2.5 font-mono text-sm text-cream/70 hover:border-cream/40">Stop &amp; settle</button>
              <button onClick={() => setSimUntil(Date.now() + 12000)} className="rounded-full border border-periwinkle/30 px-6 py-2.5 font-mono text-sm text-periwinkle/90 hover:border-periwinkle/70">Simulate quality drop</button>
            </div>

            <div className="mt-8 rounded-xl border border-cream/10 bg-ink/40 p-5">
              <div className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-eyebrow text-cream/40">
                <span>your ceiling</span><span className="text-cream/70">rate ${RATE.toFixed(6)}/sec</span>
              </div>
              <div className="mt-3 flex items-center gap-4">
                <input type="range" min={0.02} max={1} step={0.01} value={ceiling} disabled={s.playing}
                  onChange={(e) => setCeiling(parseFloat(e.target.value))} className="flex-1 accent-amber disabled:opacity-50" />
                <span className="w-20 text-right font-mono text-lg text-amber tabular-nums">${ceiling.toFixed(2)}</span>
              </div>
              <p className="mt-2 font-mono text-[11px] text-cream/40">the session can never spend past this — about {Math.round(ceiling / RATE / 60)} min at full rate</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-xl border border-cream/10 bg-ink/40 p-5">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-cream/40">your wallet</div>
              {!wallet ? (
                <button onClick={() => void connect()} disabled={connecting}
                  className="mt-3 w-full rounded-full bg-cream px-5 py-2.5 font-mono text-sm text-ink transition-transform hover:scale-[1.02] disabled:opacity-50">
                  {connecting ? "connecting…" : hasWallet() ? "Connect wallet" : "Install a wallet to connect"}
                </button>
              ) : (
                <>
                  <a href={addrUrl(wallet)} target="_blank" rel="noreferrer" className="mt-2 block font-mono text-sm text-cream/80 hover:text-amber">{short(wallet)}</a>
                  {!chainOk && (
                    <button onClick={() => void switchToArc()} className="mt-2 w-full rounded-full border border-amber/50 px-4 py-2 font-mono text-[11px] text-amber hover:border-amber">
                      Switch to Arc Testnet
                    </button>
                  )}
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <Stat label="wallet usdc" value={walletUsdc === "—" ? "—" : `$${parseFloat(walletUsdc).toFixed(4)}`} />
                    <Stat label="session armed" value={`$${parseFloat(armed).toFixed(4)}`} accent="#5E8F86" />
                  </div>
                  <div className="mt-4 border-t border-cream/10 pt-4">
                    <div className="font-mono text-[10px] uppercase tracking-eyebrow text-cream/40">arm a capped session</div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="font-mono text-sm text-cream/50">$</span>
                      <input value={fundAmt} onChange={(e) => setFundAmt(e.target.value)} inputMode="decimal"
                        className="w-20 rounded-md border border-cream/15 bg-ink px-2 py-1.5 font-mono text-sm text-cream" />
                      <button onClick={onArm} disabled={!!busy || !hasFunds}
                        className="flex-1 rounded-full border border-amber/40 px-4 py-2 font-mono text-[12px] text-amber hover:border-amber disabled:opacity-40">
                        {busy === "arm" ? "arming…" : "Fund session →"}
                      </button>
                    </div>
                    {!hasFunds && (
                      <p className="mt-2 font-mono text-[11px] text-amber/80">
                        Your wallet has no test USDC yet — <a href={ARC.faucet} target="_blank" rel="noreferrer" className="underline">get some from the faucet ↗</a>, then refresh.
                      </p>
                    )}
                    <p className="mt-2 font-mono text-[11px] text-cream/40">
                      one signature funds a session that streams autonomously to creator {short(creator)}, capped at your ceiling. Session {sessionAddr ? short(sessionAddr) : "…"} on Arc.
                    </p>
                    <button onClick={() => void refresh()} className="mt-2 font-mono text-[11px] text-cream/50 hover:text-cream/80">refresh balances</button>
                  </div>
                </>
              )}
              {(err || connErr) && (
                <div className="mt-3 max-h-24 overflow-auto rounded-md border border-coral/30 bg-coral/5 p-2 font-mono text-[11px] leading-snug text-coral/90 break-words">
                  {err || connErr}
                </div>
              )}
              {wallet && !canStart && hasFunds && <p className="mt-3 font-mono text-[11px] text-cream/50">Fund a session to start.</p>}
            </div>

            <div className="rounded-xl border border-periwinkle/20 bg-ink/40 p-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-eyebrow text-cream/40">payment agent</span>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: stateColor }} />
                  <span className="font-mono text-sm" style={{ color: stateColor }}>{STATE_LABEL[s.state]}</span>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4">
                <Stat label="streamed" value={formatUSDC(s.spentUnits)} accent="#F6A92B" big />
                <Stat label="watch time" value={`${s.seconds}s`} big />
              </div>
              <div className="mt-5 border-t border-cream/10 pt-4">
                <span className="font-mono text-[10px] uppercase tracking-eyebrow text-cream/40">reasoning</span>
                <div className="mt-2 space-y-1">
                  {s.log.length === 0 && <p className="font-mono text-[11px] text-cream/30">press start to begin metering</p>}
                  {s.log.map((l, i) => (
                    <div key={i} className="flex gap-3 font-mono text-[11px] leading-snug">
                      <span className="tabular-nums text-periwinkle/60">{String(l.t).padStart(3, "0")}s</span>
                      <span className={i === s.log.length - 1 ? "text-cream/80" : "text-cream/45"}>{l.line}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-cream/10 bg-ink/40 p-5">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[10px] uppercase tracking-eyebrow text-cream/40">settled on arc</span>
                <span className="font-mono text-[11px] text-verdigris">{s.settled.length} batches</span>
              </div>
              <div className="mt-3 max-h-48 space-y-1.5 overflow-y-auto">
                {s.settled.length === 0 && <p className="font-mono text-[11px] text-cream/30">batches settle every ~$0.005</p>}
                {s.settled.slice().reverse().map((b) => (
                  <div key={b.seq} className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-cream/60">seq {String(b.seq).padStart(2, "0")} · {formatUSDC(b.units)}</span>
                    {b.tx ? <a href={txUrl(b.tx)} target="_blank" rel="noreferrer" className="text-periwinkle/70 hover:text-periwinkle">{b.tx.slice(0, 10)}… ↗</a> : <span className="text-cream/30">pending</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value, accent, big }: { label: string; value: string; accent?: string; big?: boolean }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-cream/40">{label}</div>
      <div className={`mt-1 font-mono tabular-nums ${big ? "text-2xl" : "text-sm"}`} style={{ color: accent ?? "#F4ECDD" }}>{value}</div>
    </div>
  );
}
