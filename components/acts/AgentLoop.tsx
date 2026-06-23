"use client";

import {
  useScroll,
  useMotionValueEvent,
  useTransform,
  motion,
} from "framer-motion";
import { useRef, useState } from "react";
import { scrollSignal } from "@/lib/scrollSignal";

type Decision = "FULL" | "THROTTLE";
type Display = "Streaming" | "Watching" | "Throttled" | "Recovering";

// Hysteresis band — the agent commits and won't flap between these.
const LOW = 0.52;
const HIGH = 0.72;

const ease = [0.16, 1, 0.3, 1] as const;

const STATE_COPY: Record<Display, string> = {
  Streaming: "full rate · stream healthy",
  Watching: "quality slipping · holding rate",
  Throttled: "rate cut · protecting your ceiling",
  Recovering: "quality returning · easing back",
};

const STATE_COLOR: Record<Display, string> = {
  Streaming: "#5E8F86", // verdigris — settled / healthy
  Watching: "#F6A92B", // amber — alert
  Throttled: "#FF6B57", // coral — acting
  Recovering: "#8B8BFA", // periwinkle — deliberating back up
};

export default function AgentLoop() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const [display, setDisplay] = useState<Display>("Streaming");
  const [log, setLog] = useState<{ t: string; line: string }[]>([
    { t: "00.0", line: "agent online · monitoring stream quality" },
  ]);

  // Refs hold loop state without forcing re-renders.
  const committed = useRef<Decision>("FULL");
  const prevDisplay = useRef<Display>("Streaming");
  const rateSmooth = useRef(1);

  // DOM-direct readout targets.
  const qBar = useRef<HTMLDivElement>(null);
  const qNum = useRef<HTMLSpanElement>(null);
  const rNum = useRef<HTMLSpanElement>(null);

  // Panel/editorial fade tied to act presence.
  const enter = useTransform(scrollYProgress, [0, 0.1], [0, 1]);
  const editorialX = useTransform(scrollYProgress, [0, 0.1], [-20, 0]);
  const panelX = useTransform(scrollYProgress, [0, 0.1], [20, 0]);

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    // Simulated stream quality: a smooth dip centered mid-act, recovering after.
    const q = Math.max(0, 1 - 0.72 * Math.exp(-Math.pow((p - 0.5) / 0.17, 2)));

    // Periwinkle presence ramps in at the start of the act and out at the end.
    const presence = Math.min(p / 0.12, 1) * Math.min((1 - p) / 0.12, 1);

    // Hysteresis: commit a decision, hold it through the band, don't flap.
    let changed = false;
    if (committed.current === "FULL" && q < LOW) {
      committed.current = "THROTTLE";
      changed = true;
    } else if (committed.current === "THROTTLE" && q > HIGH) {
      committed.current = "FULL";
      changed = true;
    }

    const targetRate = committed.current === "THROTTLE" ? 0.3 : 1;
    rateSmooth.current += (targetRate - rateSmooth.current) * 0.18;

    // Feed the stream.
    scrollSignal.agent = presence;
    scrollSignal.throttle = committed.current === "THROTTLE" ? 0.78 : 0;
    scrollSignal.quality = q;
    if (changed) scrollSignal.pulseAt = performance.now();

    // DOM-direct readouts — no React re-render on scroll.
    if (qBar.current) qBar.current.style.width = `${(q * 100).toFixed(1)}%`;
    if (qNum.current) qNum.current.textContent = `${Math.round(q * 100)}%`;
    if (rNum.current) rNum.current.textContent = `${rateSmooth.current.toFixed(2)}×`;

    // Display state — re-render only when it actually changes.
    const d: Display =
      committed.current === "FULL"
        ? q >= HIGH
          ? "Streaming"
          : "Watching"
        : q <= LOW
          ? "Throttled"
          : "Recovering";
    if (d !== prevDisplay.current) {
      prevDisplay.current = d;
      setDisplay(d);
    }

    // Log only real commitments — the agent's actual decisions.
    if (changed) {
      const t = (p * 100).toFixed(1);
      const line =
        committed.current === "THROTTLE"
          ? `quality ${Math.round(q * 100)}% below floor → throttle to 0.30×`
          : `quality ${Math.round(q * 100)}% restored → resume 1.00×`;
      setLog((l) => [...l.slice(-4), { t, line }]);
    }
  });

  const color = STATE_COLOR[display];

  return (
    <div ref={ref} className="relative h-[280vh]">
      <div className="sticky top-0 flex h-screen items-center px-6 sm:px-10 lg:px-16">
        <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
          {/* Editorial */}
          <motion.div style={{ opacity: enter, x: editorialX }}>
            <span className="mb-6 block font-mono text-[11px] uppercase tracking-eyebrow text-periwinkle/80">
              the gate
            </span>
            <h2 className="font-serif text-[clamp(2.25rem,6vw,4.75rem)] leading-[1] text-cream">
              The agent watches every second.
            </h2>
            <p className="mt-8 max-w-md text-base leading-relaxed text-cream/70 sm:text-lg">
              You set a ceiling. From there the agent holds the stream: it
              throttles the rate when quality degrades, resumes when it
              recovers, and never spends past your limit. Scroll, and watch it
              reason through a live quality drop.
            </p>
          </motion.div>

          {/* Instrument panel */}
          <motion.div
            style={{ opacity: enter, x: panelX }}
            className="rounded-2xl border border-periwinkle/20 bg-ink/40 p-6 backdrop-blur-sm sm:p-8"
          >
            {/* State badge */}
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-eyebrow text-cream/40">
                agent state
              </span>
              <div className="flex items-center gap-2.5">
                <motion.span
                  animate={{
                    scale: display === "Streaming" ? [1, 1.15, 1] : [1, 1.5, 1],
                    opacity: [1, 0.5, 1],
                  }}
                  transition={{
                    duration: display === "Streaming" ? 2.4 : 1,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span
                  className="font-mono text-sm font-medium"
                  style={{ color }}
                >
                  {display}
                </span>
              </div>
            </div>
            <p className="mt-1.5 text-right font-mono text-[11px] text-cream/40">
              {STATE_COPY[display]}
            </p>

            {/* Quality meter */}
            <div className="mt-8">
              <div className="flex items-baseline justify-between font-mono">
                <span className="text-[10px] uppercase tracking-eyebrow text-cream/40">
                  stream quality
                </span>
                <span ref={qNum} className="tabular-nums text-sm text-cream/80">
                  100%
                </span>
              </div>
              <div className="relative mt-3 h-1.5 w-full overflow-hidden rounded-full bg-cream/10">
                <div
                  ref={qBar}
                  className="h-full rounded-full bg-periwinkle"
                  style={{ width: "100%" }}
                />
                {/* Quality floor marker */}
                <div
                  className="absolute top-[-3px] h-[12px] w-px bg-coral/60"
                  style={{ left: `${LOW * 100}%` }}
                />
              </div>
              <p className="mt-2 font-mono text-[10px] text-coral/50">
                floor {Math.round(LOW * 100)}% · throttle trips below
              </p>
            </div>

            {/* Agent rate */}
            <div className="mt-8 flex items-baseline justify-between">
              <span className="font-mono text-[10px] uppercase tracking-eyebrow text-cream/40">
                agent rate
              </span>
              <span
                ref={rNum}
                className="tabular-nums font-mono text-3xl text-amber"
              >
                1.00×
              </span>
            </div>

            {/* Reasoning log */}
            <div className="mt-8 border-t border-cream/10 pt-5">
              <span className="font-mono text-[10px] uppercase tracking-eyebrow text-cream/40">
                reasoning
              </span>
              <div className="mt-3 space-y-1.5">
                {log.map((entry, i) => (
                  <motion.div
                    key={`${entry.t}-${entry.line}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: i === log.length - 1 ? 1 : 0.4, x: 0 }}
                    transition={{ duration: 0.4, ease }}
                    className="flex gap-3 font-mono text-[11px] leading-snug"
                  >
                    <span className="tabular-nums text-periwinkle/60">
                      {entry.t}
                    </span>
                    <span className="text-cream/70">{entry.line}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
