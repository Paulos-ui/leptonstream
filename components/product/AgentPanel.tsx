"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion, animate } from "framer-motion";
import type { AgentState } from "@/core/types";

const STATE_META: Record<AgentState, { label: string; color: string }> = {
  idle: { label: "idle", color: "#8A7E6A" },
  streaming: { label: "streaming · full rate", color: "#5BA013" },
  watching: { label: "watching · holding rate", color: "#C77D2E" },
  throttled: { label: "throttled", color: "#FF6B57" },
  recovering: { label: "recovering", color: "#C77D2E" },
  paused: { label: "paused", color: "#8A7E6A" },
  ceiling_reached: { label: "ceiling reached", color: "#7A5AF0" },
  stopped: { label: "stopped", color: "#8A7E6A" },
};

const U = 1e6; // base units → USD

export default function AgentPanel({
  state, reason, seconds,
  spentUnits, pendingUnits, inFlightUnits, ceilingUnits,
  effectiveRate, rateUnitsPerSec, quality, lowQuality, highQuality,
  settledCount, metering, playing, log,
}: {
  state: AgentState; reason: string; seconds: number;
  spentUnits: number; pendingUnits: number; inFlightUnits: number; ceilingUnits: number;
  effectiveRate: number; rateUnitsPerSec: number; quality: number; lowQuality: number; highQuality: number;
  settledCount: number; metering: boolean; playing: boolean; log: { t: number; line: string }[];
}) {
  const reduce = useReducedMotion();
  const meta = STATE_META[state] ?? STATE_META.idle;
  const accrued = spentUnits + inFlightUnits + pendingUnits;
  const ceilPct = ceilingUnits > 0 ? Math.min(100, (accrued / ceilingUnits) * 100) : 0;
  const qPct = Math.max(0, Math.min(100, quality * 100));
  const factor = rateUnitsPerSec > 0 ? effectiveRate / rateUnitsPerSec : 1;

  // Settlement pulse
  const [pulse, setPulse] = useState(0);
  const prevSettled = useRef(settledCount);
  useEffect(() => {
    if (settledCount > prevSettled.current && !reduce) setPulse((p) => p + 1);
    prevSettled.current = settledCount;
  }, [settledCount, reduce]);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-ink/12 bg-white/50 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">
          payment agent · <span className="text-ink/70">deterministic</span> · no llm in the loop
        </div>
        <motion.span
          key={state}
          initial={reduce ? false : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-full px-3 py-1 font-mono text-[11px]"
          style={{ background: `${meta.color}1A`, color: meta.color }}
        >
          <motion.span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }}
            animate={playing && metering && !reduce ? { opacity: [1, 0.3, 1] } : {}} transition={{ duration: 1.4, repeat: Infinity }} />
          {meta.label}
        </motion.span>
      </div>

      <p className="mt-2 font-mono text-[12px] text-ink/70">{reason || "waiting to start…"}</p>

      {/* Rate: effective vs full — the throttle made visible */}
      <div className="mt-5">
        <div className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-eyebrow text-muted">
          <span>spend rate</span>
          <span>
            <span style={{ color: factor < 0.99 ? "#FF6B57" : "#5BA013" }}>${(effectiveRate / U).toFixed(6)}/s</span>
            {factor < 0.99 && <span className="text-muted"> · {Math.round(factor * 100)}% of full</span>}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
          <motion.div className="h-full rounded-full" style={{ background: factor < 0.99 ? "#FF6B57" : "#5BA013" }}
            animate={{ width: `${Math.max(4, factor * 100)}%` }} transition={{ duration: 0.5 }} />
        </div>
      </div>

      {/* Quality gauge with the hysteresis band marked */}
      <div className="mt-5">
        <div className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-eyebrow text-muted">
          <span>playback quality</span>
          <span className="text-ink/70">{Math.round(qPct)}%</span>
        </div>
        <div className="relative mt-1.5 h-2 w-full rounded-full bg-ink/10">
          {/* hysteresis band between low and high */}
          <div className="absolute inset-y-0 rounded-full bg-ink/10"
            style={{ left: `${lowQuality * 100}%`, width: `${(highQuality - lowQuality) * 100}%` }} />
          <div className="absolute inset-y-[-3px] w-px bg-coral/60" style={{ left: `${lowQuality * 100}%` }} />
          <div className="absolute inset-y-[-3px] w-px bg-leaf/60" style={{ left: `${highQuality * 100}%` }} />
          <motion.div className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-white shadow"
            style={{ background: meta.color }} animate={{ left: `calc(${qPct}% - 6px)` }} transition={{ duration: 0.4 }} />
        </div>
        <div className="mt-1 flex justify-between font-mono text-[9px] text-muted">
          <span>throttle ↓ {Math.round(lowQuality * 100)}%</span>
          <span>↑ {Math.round(highQuality * 100)}% resume</span>
        </div>
      </div>

      {/* Money invariant: streamed → settling → settled */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <Money label="streamed" value={accrued / U} sub={`${seconds}s metered`} />
        <Money label="settling" value={inFlightUnits / U} sub="awaiting confirm" accent="#C77D2E" />
        <Money label="settled on arc" value={spentUnits / U} sub={`${settledCount} batches`} accent="#5BA013" pulseKey={pulse} />
      </div>

      {/* Ceiling */}
      <div className="mt-5">
        <div className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-eyebrow text-muted">
          <span>session ceiling</span>
          <span className="text-ink/70">${(accrued / U).toFixed(4)} / ${(ceilingUnits / U).toFixed(2)}</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
          <motion.div className="h-full rounded-full bg-ink/60" animate={{ width: `${ceilPct}%` }} transition={{ duration: 0.5 }} />
        </div>
        <p className="mt-1.5 font-mono text-[9px] text-muted">the agent physically cannot authorize past this — enforced in code, not a prompt.</p>
      </div>

      {/* Live decision log — the agent's reasoning, as it happens */}
      {log.length > 0 && (
        <div className="mt-6 border-t border-ink/10 pt-4">
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">decision log</div>
          <div className="mt-2 space-y-1">
            <AnimatePresence initial={false}>
              {log.slice(-5).map((e, i) => (
                <motion.div
                  key={`${e.t}-${i}-${e.line}`}
                  initial={reduce ? false : { opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex gap-3 font-mono text-[11px]"
                >
                  <span className="tabular-nums text-ink/40">{String(e.t).padStart(3, "0")}s</span>
                  <span className="text-ink/70">{e.line}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </section>
  );
}

function Money({ label, value, sub, accent, pulseKey }: { label: string; value: number; sub: string; accent?: string; pulseKey?: number }) {
  const reduce = useReducedMotion();
  const [disp, setDisp] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    if (value === prev.current) return;
    if (reduce) { setDisp(value); prev.current = value; return; }
    const c = animate(prev.current, value, { duration: 0.5, onUpdate: setDisp });
    prev.current = value;
    return () => c.stop();
  }, [value, reduce]);
  return (
    <motion.div className="rounded-xl border border-ink/10 bg-white/50 p-3"
      animate={pulseKey && !reduce ? { boxShadow: [`0 0 0px ${accent ?? "#5BA013"}00`, `0 0 18px ${accent ?? "#5BA013"}55`, `0 0 0px ${accent ?? "#5BA013"}00`] } : {}}
      transition={{ duration: 1 }}>
      <div className="font-mono text-[9px] uppercase tracking-eyebrow text-muted">{label}</div>
      <div className="mt-0.5 font-serif text-xl tabular-nums" style={{ color: accent ?? "#16100C" }}>${disp.toFixed(6)}</div>
      <div className="font-mono text-[9px] text-muted">{sub}</div>
    </motion.div>
  );
}
