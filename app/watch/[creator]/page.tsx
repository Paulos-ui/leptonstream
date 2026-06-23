"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Hex } from "viem";
import { isAddress } from "viem";
import { useStreamSession } from "@/hooks/useStreamSession";
import VideoStream from "@/components/product/VideoStream";
import { formatUSDC, usdc } from "@/core/money";
import { ARC, txUrl, addrUrl } from "@/lib/arc";
import { STATE_COLOR, STATE_LABEL, short } from "@/lib/format";
import {
  loadOrCreateKey,
  addressOf,
  makeClient,
  getFunds,
  depositToGateway,
  type Funds,
} from "@/lib/wallet";

const RATE = 0.000124; // $/sec

export default function WatchPage() {
  const params = useParams<{ creator: string }>();
  const sp = useSearchParams();
  const creator = params.creator;
  const demo =
    sp.get("demo") === "1" || process.env.NEXT_PUBLIC_DEMO === "1";

  const validCreator = isAddress(creator);

  const [ceiling, setCeiling] = useState(0.1);
  const [pk, setPk] = useState<Hex | null>(null);
  const [address, setAddress] = useState<string>("");
  const [funds, setFunds] = useState<Funds | null>(null);
  const [busy, setBusy] = useState<string>("");

  // Burner wallet bootstrap (real mode only).
  useEffect(() => {
    if (demo) return;
    const key = loadOrCreateKey();
    setPk(key);
    setAddress(addressOf(key));
  }, [demo]);

  const refreshFunds = useMemo(
    () => async () => {
      if (!pk) return;
      try {
        setBusy("balances");
        const client = await makeClient(pk);
        setFunds(await getFunds(client));
      } catch {
        /* surfaced via UI state */
      } finally {
        setBusy("");
      }
    },
    [pk]
  );

  useEffect(() => {
    if (pk) void refreshFunds();
  }, [pk, refreshFunds]);

  const onDeposit = async () => {
    if (!pk) return;
    setBusy("deposit");
    try {
      const client = await makeClient(pk);
      await depositToGateway(client, "1");
      await refreshFunds();
    } finally {
      setBusy("");
    }
  };

  const s = useStreamSession({
    creator,
    ratePerSecUsd: RATE,
    ceilingUsd: ceiling,
    demo,
    privateKey: pk,
  });

  const gatewayAvail = funds ? parseFloat(funds.gatewayAvailable) : 0;
  const canStart = demo || gatewayAvail > 0;
  const stateColor = STATE_COLOR[s.state];

  if (!validCreator) {
    return (
      <main className="mx-auto max-w-xl px-6 py-32 text-center">
        <h1 className="font-serif text-3xl text-cream">Invalid stream link</h1>
        <p className="mt-4 text-cream/60">
          A watch link must point to a creator&apos;s Arc address. Create one in
          the{" "}
          <Link href="/studio" className="text-amber underline">
            studio
          </Link>
          .
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 pb-24 pt-24 sm:px-8 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-eyebrow text-cream/40">
            watching · {short(creator)}
          </span>
          <Link
            href={demo ? `/watch/${creator}` : `/watch/${creator}?demo=1`}
            className="rounded-full border border-cream/20 px-3 py-1 font-mono text-[10px] uppercase tracking-eyebrow text-cream/60 hover:border-cream/50"
          >
            {demo ? "demo mode ●" : "switch to demo"}
          </Link>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
          {/* Left: player + controls */}
          <div>
            <VideoStream
              src={sp.get("src") ?? undefined}
              playing={s.playing}
              quality={s.quality}
              color={stateColor}
            />

            <div className="mt-5 flex flex-wrap items-center gap-3">
              {!s.playing ? (
                <button
                  onClick={() => void s.start()}
                  disabled={!canStart}
                  className="rounded-full bg-amber px-6 py-2.5 font-mono text-sm text-ink transition-transform enabled:hover:scale-[1.03] disabled:opacity-40"
                >
                  {s.state === "stopped" ? "Stopped" : "Start streaming"}
                </button>
              ) : (
                <button
                  onClick={s.pause}
                  className="rounded-full border border-cream/25 px-6 py-2.5 font-mono text-sm text-cream hover:border-cream/60"
                >
                  Pause
                </button>
              )}
              <button
                onClick={s.stop}
                className="rounded-full border border-cream/15 px-6 py-2.5 font-mono text-sm text-cream/70 hover:border-cream/40"
              >
                Stop &amp; settle
              </button>
              <button
                onClick={s.dropQuality}
                className="rounded-full border border-periwinkle/30 px-6 py-2.5 font-mono text-sm text-periwinkle/90 hover:border-periwinkle/70"
              >
                Simulate quality drop
              </button>
            </div>

            {/* Ceiling config */}
            <div className="mt-8 rounded-xl border border-cream/10 bg-ink/40 p-5">
              <div className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-eyebrow text-cream/40">
                <span>your ceiling</span>
                <span className="text-cream/70">
                  rate ${RATE.toFixed(6)}/sec
                </span>
              </div>
              <div className="mt-3 flex items-center gap-4">
                <input
                  type="range"
                  min={0.02}
                  max={1}
                  step={0.01}
                  value={ceiling}
                  disabled={s.playing}
                  onChange={(e) => setCeiling(parseFloat(e.target.value))}
                  className="flex-1 accent-amber disabled:opacity-50"
                />
                <span className="w-20 text-right font-mono text-lg text-amber tabular-nums">
                  ${ceiling.toFixed(2)}
                </span>
              </div>
              <p className="mt-2 font-mono text-[11px] text-cream/40">
                the agent can never spend past this — about{" "}
                {Math.round(ceiling / RATE / 60)} min at full rate
              </p>
            </div>
          </div>

          {/* Right: live rail */}
          <div className="space-y-5">
            {/* Wallet (real mode) */}
            {!demo && (
              <div className="rounded-xl border border-cream/10 bg-ink/40 p-5">
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-cream/40">
                  your wallet (testnet burner)
                </div>
                <a
                  href={address ? addrUrl(address) : "#"}
                  className="mt-2 block font-mono text-sm text-cream/80 hover:text-amber"
                >
                  {address ? short(address) : "creating…"}
                </a>
                <div className="mt-4 grid grid-cols-2 gap-3 font-mono text-sm">
                  <Stat label="wallet usdc" value={funds?.walletUsdc ?? "—"} />
                  <Stat
                    label="gateway available"
                    value={funds?.gatewayAvailable ?? "—"}
                    accent="#5E8F86"
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={ARC.faucet}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-cream/20 px-4 py-2 font-mono text-[11px] text-cream/80 hover:border-cream/50"
                  >
                    Get test USDC ↗
                  </a>
                  <button
                    onClick={onDeposit}
                    disabled={!!busy}
                    className="rounded-full border border-amber/40 px-4 py-2 font-mono text-[11px] text-amber hover:border-amber disabled:opacity-40"
                  >
                    {busy === "deposit" ? "depositing…" : "Deposit $1 → Gateway"}
                  </button>
                  <button
                    onClick={() => void refreshFunds()}
                    disabled={!!busy}
                    className="rounded-full border border-cream/15 px-4 py-2 font-mono text-[11px] text-cream/60 hover:border-cream/40 disabled:opacity-40"
                  >
                    {busy === "balances" ? "…" : "Refresh"}
                  </button>
                </div>
                {!canStart && (
                  <p className="mt-3 font-mono text-[11px] text-coral/80">
                    Fund the Gateway balance to start streaming.
                  </p>
                )}
              </div>
            )}

            {/* Agent HUD */}
            <div className="rounded-xl border border-periwinkle/20 bg-ink/40 p-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-eyebrow text-cream/40">
                  payment agent
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: stateColor }}
                  />
                  <span className="font-mono text-sm" style={{ color: stateColor }}>
                    {STATE_LABEL[s.state]}
                  </span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4">
                <Stat
                  label="streamed"
                  value={formatUSDC(s.spentUnits)}
                  accent="#F6A92B"
                  big
                />
                <Stat label="watch time" value={`${s.seconds}s`} big />
              </div>

              {/* Reasoning log */}
              <div className="mt-5 border-t border-cream/10 pt-4">
                <span className="font-mono text-[10px] uppercase tracking-eyebrow text-cream/40">
                  reasoning
                </span>
                <div className="mt-2 space-y-1">
                  {s.log.length === 0 && (
                    <p className="font-mono text-[11px] text-cream/30">
                      press start to begin metering
                    </p>
                  )}
                  {s.log.map((l, i) => (
                    <div
                      key={i}
                      className="flex gap-3 font-mono text-[11px] leading-snug"
                    >
                      <span className="tabular-nums text-periwinkle/60">
                        {String(l.t).padStart(3, "0")}s
                      </span>
                      <span
                        className={
                          i === s.log.length - 1 ? "text-cream/80" : "text-cream/45"
                        }
                      >
                        {l.line}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Settlements */}
            <div className="rounded-xl border border-cream/10 bg-ink/40 p-5">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[10px] uppercase tracking-eyebrow text-cream/40">
                  settled {demo ? "(simulated)" : "on arc"}
                </span>
                <span className="font-mono text-[11px] text-verdigris">
                  {s.settled.length} batches
                </span>
              </div>
              <div className="mt-3 max-h-48 space-y-1.5 overflow-y-auto">
                {s.settled.length === 0 && (
                  <p className="font-mono text-[11px] text-cream/30">
                    batches settle every ~$0.005
                  </p>
                )}
                {s.settled
                  .slice()
                  .reverse()
                  .map((b) => (
                    <div
                      key={b.seq}
                      className="flex items-center justify-between font-mono text-[11px]"
                    >
                      <span className="text-cream/60">
                        seq {String(b.seq).padStart(2, "0")} ·{" "}
                        {formatUSDC(b.units)}
                      </span>
                      {b.tx ? (
                        <a
                          href={demo ? "#" : txUrl(b.tx)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-periwinkle/70 hover:text-periwinkle"
                        >
                          {b.tx.slice(0, 10)}… ↗
                        </a>
                      ) : (
                        <span className="text-cream/30">pending</span>
                      )}
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

function Stat({
  label,
  value,
  accent,
  big,
}: {
  label: string;
  value: string;
  accent?: string;
  big?: boolean;
}) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-cream/40">
        {label}
      </div>
      <div
        className={`mt-1 font-mono tabular-nums ${big ? "text-2xl" : "text-sm"}`}
        style={{ color: accent ?? "#F4ECDD" }}
      >
        {value}
      </div>
    </div>
  );
}
