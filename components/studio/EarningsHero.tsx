"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, animate } from "framer-motion";

export default function EarningsHero({
  available,
  totalInGateway,
  supporters,
}: {
  available: number;
  totalInGateway: number;
  supporters: number;
}) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(available);
  const [pulse, setPulse] = useState(0);
  const prev = useRef(available);

  useEffect(() => {
    if (available === prev.current) return;
    const increased = available > prev.current;
    if (reduce) {
      setDisplay(available);
    } else {
      const controls = animate(prev.current, available, {
        duration: 0.7,
        ease: "easeOut",
        onUpdate: (v) => setDisplay(v),
      });
      if (increased) setPulse((p) => p + 1);
      prev.current = available;
      return () => controls.stop();
    }
    if (increased) setPulse((p) => p + 1);
    prev.current = available;
  }, [available, reduce]);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-cream/10 bg-gradient-to-b from-ink/70 to-ink/20 p-8 sm:p-10">
      {!reduce && (
        <motion.div
          key={pulse}
          aria-hidden
          initial={{ opacity: pulse ? 0.6 : 0, scale: 0.9 }}
          animate={{ opacity: 0, scale: 1.25 }}
          transition={{ duration: 1.3, ease: "easeOut" }}
          className="pointer-events-none absolute -left-10 -top-10 h-64 w-64 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(246,169,43,0.5), transparent 70%)" }}
        />
      )}
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-cream/40">available to withdraw</div>
          <motion.div
            animate={pulse && !reduce ? { scale: [1, 1.025, 1] } : {}}
            transition={{ duration: 0.5 }}
            className="mt-2 font-serif text-6xl tabular-nums text-amber sm:text-7xl"
          >
            ${display.toFixed(6)}
          </motion.div>
        </div>
        <div className="text-right font-mono text-[11px] text-cream/40">
          <div className="text-cream/70">{supporters} supporter{supporters === 1 ? "" : "s"}</div>
          <div className="mt-1">${totalInGateway.toFixed(6)} in Gateway</div>
        </div>
      </div>
    </section>
  );
}
