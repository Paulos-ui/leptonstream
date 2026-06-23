"use client";

import { motion, useScroll, useSpring } from "framer-motion";

export default function ProgressGauge() {
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.4,
  });

  return (
    <div
      aria-hidden="true"
      className="fixed right-5 top-1/2 z-40 hidden h-40 w-px -translate-y-1/2 bg-cream/15 lg:block"
    >
      <motion.div
        className="absolute left-0 top-0 w-px origin-top bg-gradient-to-b from-amber to-coral"
        style={{ height: "100%", scaleY }}
      />
    </div>
  );
}
