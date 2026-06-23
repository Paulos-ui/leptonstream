"use client";

import {
  useScroll,
  useTransform,
  useMotionValueEvent,
  motion,
} from "framer-motion";
import { useRef } from "react";
import { scrollSignal } from "@/lib/scrollSignal";

export default function QuantumZoom() {
  const ref = useRef<HTMLDivElement>(null);

  // 0 when the tall section's top reaches the top of the viewport,
  // 1 when its bottom does — i.e. the whole time the sticky child is pinned.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Dive in (0→1) over the first half, pull back out (1→0) over the second —
  // you see the quanta, then the stream re-forms, continuous, for what's next.
  const zoom = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 0]);

  // Feed the canvas. This is the only line that connects scroll → the zoom.
  useMotionValueEvent(zoom, "change", (v) => {
    scrollSignal.zoom = v;
  });

  // Copy crossfade: "continuous" hands off to "discrete" around the dive peak.
  const continuousOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
  const continuousY = useTransform(scrollYProgress, [0, 0.4], [0, -24]);
  const discreteOpacity = useTransform(scrollYProgress, [0.4, 0.55], [0, 1]);
  const discreteY = useTransform(scrollYProgress, [0.4, 0.55], [24, 0]);

  // Live magnification readout, tracking the actual zoom (peaks mid-act).
  const zoomLabel = useTransform(zoom, (v) => `×${(1 + v * 39).toFixed(1)}`);

  return (
    <div ref={ref} className="relative h-[240vh]">
      <div className="sticky top-0 flex h-screen items-center px-6 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-5xl">
          <motion.span
            style={{ opacity: useTransform(scrollYProgress, [0, 0.1], [0, 1]) }}
            className="mb-6 block font-mono text-[11px] uppercase tracking-eyebrow text-periwinkle/70"
          >
            <motion.span>{zoomLabel}</motion.span> magnification
          </motion.span>

          <div className="relative h-[3.2em]">
            <motion.h2
              style={{ opacity: continuousOpacity, y: continuousY }}
              className="absolute inset-0 font-serif text-[clamp(2.25rem,7vw,5.5rem)] leading-[1] text-cream"
            >
              Continuous, to your eye.
            </motion.h2>
            <motion.h2
              style={{ opacity: discreteOpacity, y: discreteY }}
              className="absolute inset-0 font-serif text-[clamp(2.25rem,7vw,5.5rem)] leading-[1] text-cream"
            >
              Discrete, underneath.
            </motion.h2>
          </div>

          <motion.p
            style={{ opacity: discreteOpacity }}
            className="mt-8 max-w-lg text-base leading-relaxed text-cream/70 sm:text-lg"
          >
            Zoom in and the smooth flow resolves into individual leptons — each
            one a single nanopayment, settling on its own. You feel one
            continuous payment; the chain sees thousands of tiny, exact ones.
          </motion.p>
        </div>
      </div>
    </div>
  );
}
