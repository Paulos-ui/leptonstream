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
import { fetchBalances, fundSession, waitForTx, walletError } from "@/lib/connect";
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
  const [fundAmt, setFundAmt] = useState("0.10");
  const [addOpen, setAddOpen] = useState(false);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  // Real playback quality + optional demo override.
  const [realQuality, setRealQuality] = useState(1);
  const [simUntil, setSimUntil] = useState(0);
  const quality = Date.now() < simUntil ? 0.3 : realQuality;
  const [videoActive, setVideoActive] = useState(false);

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
      if (wallet) setWalletUsdc((await fetchBalances(wallet)).walletUsdc);
      if (sessionAddr) setArmed((await fetchBalances(sessionAddr)).available);
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
      // Reflect the deposit right away so Start enables without a second fund.
      setArmed((p) => String((parseFloat(p) || 0) + (parseFloat(fundAmt) || 0)));
      void refresh();
    } catch (e) { setErr(walletError(e)); }
    finally { setBusy(""); }
  };

  const s = useStreamSession({ creator, ratePerSecUsd: RATE, ceilingUsd: ceiling, demo: safe, privateKey: pk, quality, metering: videoActive });

  const hasFunds = parseFloat(walletUsdc) > 0;
  const isArmed = parseFloat(armed) > 0;
  const canStart = safe || isArmed;
  const isOwnStream = !!wallet && wallet.toLowerCase() === creator.toLowerCase();
  const stateColor = STATE_COLOR[s.state];

  const fundRow = (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm text-ink/50">$</span>
      <input value={fundAmt} onChange={(e) => setFundAmt(e.target.value)} inputMode="decimal"
        className="w-20 rounded-md border border-ink/15 bg-white px-2 py-1.5 font-mono text-sm text-ink" />
      <button onClick={onArm} disabled={!!busy || !hasFunds}
        className="flex-1 rounded-full border border-leaf/40 px-4 py-2 font-mono text-[12px] text-leaf hover:border-leaf disabled:opacity-40">
        {busy === "arm" ? "arming…" : "Fund session →"}
      </button>
    </div>
  );

  if (!validCreator) {
    return (
      <main className="mx-auto max-w-xl px-6 py-32 text-center">
        <h1 className="font-serif text-3xl text-ink">Invalid support link</h1>
        <p className="mt-4 text-ink/60">
          A link must point to a creator&apos;s Arc address. Streamers create theirs in the{" "}
          <Link href="/studio" className="text-leaf underline">studio</Link>.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 pb-24 pt-24 sm:px-8 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-[11px] uppercase tracking-eyebrow text-muted">
            <Link href="/" className="text-muted hover:text-leaf">leptonstream</Link>
            {" · "}{oc?.name ? `${oc.name} · ` : ""}{short(creator)}
            {server && oc?.online && <span className="ml-2 text-verdigris">{oc.viewers} watching</span>}
          </span>
          {wallet && (
            <span className="font-mono text-[11px] text-ink/50">
              {isOwnStream ? (
                <Link href="/studio" className="text-leaf hover:underline">This is you — open your dashboard →</Link>
              ) : (
                <>you · <a href={addrUrl(wallet)} target="_blank" rel="noreferrer" className="text-leaf hover:text-leaf">{short(wallet)}</a></>
              )}
            </span>
          )}
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <VideoStream src={videoSrc} playing={s.playing} quality={quality} color={stateColor} onQuality={setRealQuality} onActive={setVideoActive} />

            {s.playing && !videoActive && (
              <p className="mt-3 font-mono text-[11px] text-muted">paused — metering only counts while the video is actually playing.</p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              {!s.playing ? (
                <button onClick={() => void s.start()} disabled={!canStart}
                  className="rounded-full bg-leaf px-6 py-2.5 font-mono text-sm text-ink transition-transform enabled:hover:scale-[1.03] disabled:opacity-40">
                  Start supporting
                </button>
              ) : (
                <button onClick={s.pause} className="rounded-full border border-ink/25 px-6 py-2.5 font-mono text-sm text-ink hover:border-ink/60">Pause</button>
              )}
              <button onClick={s.stop} className="rounded-full border border-ink/15 px-6 py-2.5 font-mono text-sm text-ink/70 hover:border-ink/40">Stop &amp; settle</button>
              <button onClick={() => setSimUntil(Date.now() + 12000)} className="rounded-full border border-ink/20 px-6 py-2.5 font-mono text-sm text-leaf hover:border-leaf">Simulate quality drop</button>
            </div>

            <div className="mt-8 rounded-xl border border-ink/10 bg-white/40 p-5">
              <div className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-eyebrow text-muted">
                <span>your ceiling</span><span className="text-ink/70">rate ${RATE.toFixed(6)}/sec</span>
              </div>
              <div className="mt-3 flex items-center gap-4">
                <input type="range" min={0.02} max={1} step={0.01} value={ceiling} disabled={s.playing}
                  onChange={(e) => setCeiling(parseFloat(e.target.value))} className="flex-1 accent-leaf disabled:opacity-50" />
                <span className="w-20 text-right font-mono text-lg text-leaf tabular-nums">${ceiling.toFixed(2)}</span>
              </div>
              <p className="mt-2 font-mono text-[11px] text-muted">the session can never spend past this — about {Math.round(ceiling / RATE / 60)} min at full rate</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-xl border border-ink/10 bg-white/40 p-5">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">your session</span>
                <button onClick={() => void refresh()} className="font-mono text-[10px] text-muted hover:text-ink/70">refresh</button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <Stat label="session armed" value={`$${parseFloat(armed).toFixed(4)}`} accent="#5E8F86" big />
                <Stat label="wallet usdc" value={wallet ? (walletUsdc === "—" ? "…" : `$${parseFloat(walletUsdc).toFixed(4)}`) : "—"} />
              </div>

              {isArmed ? (
                <div className="mt-4 border-t border-ink/10 pt-4">
                  <p className="font-mono text-[11px] text-verdigris">✓ Session armed — press Start to continue.</p>
                  <p className="mt-1 font-mono text-[11px] text-muted">Session {sessionAddr ? short(sessionAddr) : "…"} · lives in this browser.</p>
                  <button onClick={() => setAddOpen((o) => !o)} className="mt-3 font-mono text-[11px] text-leaf hover:text-leaf">
                    {addOpen ? "– close" : "+ Add funds"}
                  </button>
                  {addOpen && (
                    <div className="mt-2">
                      {!wallet ? (
                        <button onClick={() => void connect()} disabled={connecting} className="w-full rounded-full bg-ink px-5 py-2.5 font-mono text-sm text-paper disabled:opacity-50">
                          {connecting ? "connecting…" : "Connect wallet to add funds"}
                        </button>
                      ) : !chainOk ? (
                        <button onClick={() => void switchToArc()} className="w-full rounded-full border border-leaf/50 px-4 py-2 font-mono text-[11px] text-leaf">Switch to Arc Testnet</button>
                      ) : (
                        <>
                          {fundRow}
                          {!hasFunds && (
                            <p className="mt-2 font-mono text-[11px] text-leaf">
                              No test USDC — <a href={ARC.faucet} target="_blank" rel="noreferrer" className="underline">faucet ↗</a>, then refresh.
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-4 border-t border-ink/10 pt-4">
                  <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">arm a capped session</div>
                  {!wallet ? (
                    <button onClick={() => void connect()} disabled={connecting} className="mt-2 w-full rounded-full bg-ink px-5 py-2.5 font-mono text-sm text-paper disabled:opacity-50">
                      {connecting ? "connecting…" : "Connect wallet"}
                    </button>
                  ) : !chainOk ? (
                    <button onClick={() => void switchToArc()} className="mt-2 w-full rounded-full border border-leaf/50 px-4 py-2 font-mono text-[11px] text-leaf">Switch to Arc Testnet</button>
                  ) : (
                    <div className="mt-2">
                      {fundRow}
                      {!hasFunds && (
                        <p className="mt-2 font-mono text-[11px] text-leaf">
                          Your wallet has no test USDC yet — <a href={ARC.faucet} target="_blank" rel="noreferrer" className="underline">get some from the faucet ↗</a>, then refresh.
                        </p>
                      )}
                    </div>
                  )}
                  <p className="mt-2 font-mono text-[11px] text-muted">
                    The video plays for free. Funding starts the per-second support to {short(creator)} — one signature deposits the amount above into a session capped at your ceiling. You can start the moment it confirms.
                  </p>
                </div>
              )}

              {(err || connErr) && (
                <div className="mt-3 max-h-24 overflow-auto rounded-md border border-coral/30 bg-coral/5 p-2 font-mono text-[11px] leading-snug text-coral/90 break-words">
                  {err || connErr}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-ink/15 bg-white/40 p-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">payment agent</span>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: stateColor }} />
                  <span className="font-mono text-sm" style={{ color: stateColor }}>{STATE_LABEL[s.state]}</span>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4">
                <Stat label="streamed" value={formatUSDC(s.spentUnits)} accent="#5BA013" big />
                <Stat label="watch time" value={`${s.seconds}s`} big />
              </div>
              <div className="mt-5 border-t border-ink/10 pt-4">
                <span className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">reasoning</span>
                <div className="mt-2 space-y-1">
                  {s.log.length === 0 && <p className="font-mono text-[11px] text-ink/30">press start to begin metering</p>}
                  {s.log.map((l, i) => (
                    <div key={i} className="flex gap-3 font-mono text-[11px] leading-snug">
                      <span className="tabular-nums text-muted">{String(l.t).padStart(3, "0")}s</span>
                      <span className={i === s.log.length - 1 ? "text-ink/75" : "text-muted"}>{l.line}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-ink/10 bg-white/40 p-5">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">settled on arc</span>
                <span className="font-mono text-[11px] text-verdigris">{s.settled.length} batches</span>
              </div>
              <div className="mt-3 max-h-48 space-y-1.5 overflow-y-auto">
                {s.settled.length === 0 && <p className="font-mono text-[11px] text-ink/30">batches settle every ~$0.005</p>}
                {s.settled.slice().reverse().map((b) => (
                  <div key={b.seq} className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-ink/60">seq {String(b.seq).padStart(2, "0")} · {formatUSDC(b.units)}</span>
                    {b.tx ? <a href={txUrl(b.tx)} target="_blank" rel="noreferrer" className="text-leaf hover:text-leaf">{b.tx.slice(0, 10)}… ↗</a> : <span className="text-ink/30">pending</span>}
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
      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">{label}</div>
      <div className={`mt-1 font-mono tabular-nums ${big ? "text-2xl" : "text-sm"}`} style={{ color: accent ?? "#16100C" }}>{value}</div>
    </div>
  );
}
