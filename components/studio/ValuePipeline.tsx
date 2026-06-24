"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface Action { text: string; onClick: () => void; disabled: boolean }

export default function ValuePipeline({
  available, maturing, withdrawable, busy, onInitiate, onFinalize, error,
}: {
  available: number; maturing: number; withdrawable: number; busy: string;
  onInitiate: () => void; onFinalize: () => void; error: string;
}) {
  return (
    <section className="mt-6 rounded-3xl border border-cream/10 bg-ink/40 p-6 sm:p-8">
      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-cream/40">value pipeline</div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
        <Stage label="available" value={available} accent="#F6A92B"
          action={available > 0 ? { text: busy === "initiate" ? "initiating…" : "Withdraw all →", onClick: onInitiate, disabled: !!busy } : undefined} />
        <Flow active={available > 0} />
        <Stage label="maturing" value={maturing} accent="#8B8BFA" sub="on-chain delay" />
        <Flow active={withdrawable > 0} />
        <Stage label="ready · to wallet" value={withdrawable} accent="#5E8F86"
          action={withdrawable > 0 ? { text: busy === "finalize" ? "finalizing…" : "Finalize →", onClick: onFinalize, disabled: !!busy } : undefined} />
      </div>
      {error && (
        <div className="mt-4 max-h-20 overflow-auto rounded-md border border-coral/30 bg-coral/5 p-2 font-mono text-[11px] text-coral/90 break-words">{error}</div>
      )}
    </section>
  );
}

function Stage({ label, value, accent, sub, action }: {
  label: string; value: number; accent: string; sub?: string; action?: Action;
}) {
  const reduce = useReducedMotion();
  const prev = useRef(value);
  const [flash, setFlash] = useState(0);
  useEffect(() => {
    if (value > prev.current && !reduce) setFlash((f) => f + 1);
    prev.current = value;
  }, [value, reduce]);

  return (
    <motion.div
      key={`stage-${label}`}
      animate={flash ? { boxShadow: [`0 0 0px ${accent}00`, `0 0 22px ${accent}55`, `0 0 0px ${accent}00`] } : {}}
      transition={{ duration: 1 }}
      className="rounded-2xl border border-cream/10 bg-ink/50 p-5"
    >
      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-cream/40">{label}</div>
      <motion.div
        animate={flash && !reduce ? { scale: [1, 1.04, 1] } : {}}
        transition={{ duration: 0.5 }}
        className="mt-1.5 font-mono text-2xl tabular-nums"
        style={{ color: accent }}
      >
        ${value.toFixed(6)}
      </motion.div>
      {sub && <div className="mt-1 font-mono text-[10px] text-cream/30">{sub}</div>}
      {action && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={action.onClick}
          disabled={action.disabled}
          className="mt-3 w-full rounded-full border px-4 py-1.5 font-mono text-[11px] disabled:opacity-40"
          style={{ borderColor: `${accent}66`, color: accent }}
        >
          {action.text}
        </motion.button>
      )}
    </motion.div>
  );
}

function Flow({ active }: { active: boolean }) {
  const reduce = useReducedMotion();
  return (
    <div className="hidden items-center sm:flex" aria-hidden>
      <div className="relative h-[2px] w-full min-w-[28px] overflow-hidden rounded bg-cream/10">
        {active && !reduce && (
          <motion.div
            className="absolute top-0 h-full w-10 rounded"
            style={{ background: "linear-gradient(90deg, transparent, #F6A92B, transparent)" }}
            initial={{ left: "-25%" }}
            animate={{ left: "115%" }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
          />
        )}
      </div>
    </div>
  );
}
