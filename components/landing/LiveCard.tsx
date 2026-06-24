"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const RATE = 0.0042; // $/sec
const CAP = 5;
const BATCH = 0.005;

interface Batch { id: number; time: string; hash: string; }

function hhmmss(d: Date) {
  return d.toTimeString().slice(0, 8);
}
function hash() {
  return "0x" + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");
}

export default function LiveCard() {
  const reduce = useReducedMotion();
  const [streamed, setStreamed] = useState(0.0312);
  const [batches, setBatches] = useState<Batch[]>([]);
  const settledRef = useRef(0);
  const seq = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStreamed((s) => {
        const next = Math.min(CAP, s + RATE);
        // emit a batch each time we cross another BATCH threshold
        while (settledRef.current + BATCH <= next) {
          settledRef.current += BATCH;
          seq.current += 1;
          const b = { id: seq.current, time: hhmmss(new Date()), hash: hash() };
          setBatches((prev) => [b, ...prev].slice(0, 6));
        }
        return next >= CAP ? 0.0312 : next; // loop the demo
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const pct = Math.min(100, (streamed / CAP) * 100);

  return (
    <div className="w-full rounded-2xl border border-ink/15 bg-paper shadow-[0_24px_60px_-30px_rgba(20,16,11,0.5)]">
      <div className="flex items-center justify-between border-b border-ink/10 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.12em]">
        <span className="flex items-center gap-2 text-ink/70">
          <motion.span className="h-1.5 w-1.5 rounded-full bg-leaf" animate={reduce ? {} : { opacity: [1, 0.3, 1] }} transition={{ duration: 1.6, repeat: Infinity }} />
          live session · creator.owncast.online
        </span>
        <span className="text-muted">arc · usdc</span>
      </div>

      <div className="px-5 pt-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">streamed so far</div>
        <div className="mt-1 font-serif text-5xl tabular-nums text-leaf sm:text-6xl">
          ${streamed.toFixed(4)}
        </div>
        <div className="mt-2 font-mono text-[11px] text-muted">
          <span className="text-leaf">●</span> ${RATE.toFixed(4)} / second · ceiling $5.00
        </div>

        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
          <motion.div className="h-full bg-leaf" animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} />
        </div>
        <div className="mt-1.5 flex justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
          <span>$0.00</span><span>session cap</span><span>$5.00</span>
        </div>
      </div>

      <div className="mt-5 border-t border-ink/10 px-5 py-4">
        <div className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          <span>settlement log</span><span>{batches.length} batches</span>
        </div>
        <div className="mt-2 space-y-0.5">
          <AnimatePresence initial={false}>
            {batches.map((b) => (
              <motion.div
                key={b.id}
                initial={reduce ? false : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="flex items-center justify-between font-mono text-[11px] tabular-nums"
              >
                <span className="text-ink/50">{b.time}</span>
                <span className="text-ink/60">batch · {b.hash}</span>
                <span className="text-leaf">+$0.0050</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
