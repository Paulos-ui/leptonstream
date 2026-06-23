"use client";

import {
  useScroll,
  useMotionValueEvent,
  useTransform,
  motion,
} from "framer-motion";
import { useRef } from "react";
import { scrollSignal } from "@/lib/scrollSignal";
import { useStreamStore } from "@/lib/store";

const SESSION_SECONDS = 1800; // a 30-minute session, scrubbed by scroll
const TICKS = 60;

export default function Instrument() {
  const ref = useRef<HTMLDivElement>(null);
  const ratePerSec = useStreamStore((s) => s.ratePerSec);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Channel the stream into a measured beam, peaking mid-act.
  const focus = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 0]);
  useMotionValueEvent(focus, "change", (v) => {
    scrollSignal.focus = v;
  });

  const enter = useTransform(scrollYProgress, [0, 0.12], [0, 1]);

  // DOM-direct readouts.
  const indicator = useRef<HTMLDivElement>(null);
  const secNum = useRef<HTMLSpanElement>(null);
  const sessionNum = useRef<HTMLSpanElement>(null);

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const seconds = p * SESSION_SECONDS;
    const session = seconds * ratePerSec;
    if (indicator.current)
      indicator.current.style.left = `${(p * 100).toFixed(2)}%`;
    if (secNum.current)
      secNum.current.textContent = Math.floor(seconds).toLocaleString();
    if (sessionNum.current)
      sessionNum.current.textContent = `$${session.toFixed(5)}`;
  });

  return (
    <div ref={ref} className="relative h-[220vh]">
      <div className="sticky top-0 flex h-screen items-center px-6 sm:px-10 lg:px-16">
        <motion.div style={{ opacity: enter }} className="mx-auto w-full max-w-5xl">
          <span className="mb-6 block font-mono text-[11px] uppercase tracking-eyebrow text-amber/80">
            the instrument
          </span>
          <h2 className="font-serif text-[clamp(2.25rem,7vw,5.5rem)] leading-[1] text-cream">
            Priced to the second.
          </h2>
          <p className="mt-8 max-w-xl text-base leading-relaxed text-cream/70 sm:text-lg">
            No bundles, no flat fees. A precise meter prices the stream as you
            watch it — every second metered exactly, nothing wasted on what you
            never saw.
          </p>

          {/* Measurement rail */}
          <div className="mt-16">
            <div className="relative">
              {/* calibrated ruler */}
              <svg
                viewBox="0 0 1000 40"
                preserveAspectRatio="none"
                className="h-10 w-full"
                aria-hidden="true"
              >
                <line
                  x1="0"
                  y1="38"
                  x2="1000"
                  y2="38"
                  stroke="rgba(244,236,221,0.25)"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
                {Array.from({ length: TICKS + 1 }).map((_, i) => {
                  const major = i % 5 === 0;
                  const x = (i / TICKS) * 1000;
                  return (
                    <line
                      key={i}
                      x1={x}
                      y1={major ? 20 : 28}
                      x2={x}
                      y2={38}
                      stroke={
                        major ? "rgba(246,169,43,0.55)" : "rgba(244,236,221,0.2)"
                      }
                      strokeWidth="1"
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                })}
              </svg>

              {/* travelling indicator */}
              <div
                ref={indicator}
                className="pointer-events-none absolute top-0 h-10"
                style={{ left: "0%" }}
              >
                <div className="absolute -left-px top-0 h-10 w-0.5 bg-coral" />
                <div className="absolute -left-[5px] -top-1 h-2.5 w-2.5 rounded-full bg-coral" />
              </div>
            </div>

            {/* readouts */}
            <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
              <Readout label="rate / second">
                <span className="text-amber">${ratePerSec.toFixed(6)}</span>
              </Readout>
              <Readout label="seconds metered">
                <span ref={secNum} className="tabular-nums text-cream">
                  0
                </span>
              </Readout>
              <Readout label="this session">
                <span ref={sessionNum} className="tabular-nums text-coral">
                  $0.00000
                </span>
              </Readout>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function Readout({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-cream/15 pt-4">
      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-cream/40">
        {label}
      </div>
      <div className="mt-2 font-mono text-2xl sm:text-3xl">{children}</div>
    </div>
  );
}
