"use client";

import { motion } from "framer-motion";
import Counter from "@/components/ui/Counter";
import { useStreamStore } from "@/lib/store";

const ease = [0.16, 1, 0.3, 1] as const;

export default function Hero() {
  const ratePerSec = useStreamStore((s) => s.ratePerSec);

  return (
    <section className="relative flex min-h-screen flex-col justify-center px-6 sm:px-10 lg:px-16">
      <div className="mx-auto w-full max-w-5xl">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease }}
          className="mb-8 font-mono text-[11px] uppercase tracking-eyebrow text-amber/80"
        >
          Per-second support for live streams · powered by agents
        </motion.p>

        <h1 className="font-serif text-cream">
          <motion.span
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease, delay: 0.08 }}
            className="block text-[clamp(3rem,9vw,7.5rem)] leading-[0.95]"
          >
            Value, in
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease, delay: 0.18 }}
            className="block text-[clamp(3rem,9vw,7.5rem)] italic leading-[0.95]"
          >
            constant motion.
          </motion.span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 0.34 }}
          className="mt-10 max-w-xl text-base leading-relaxed text-cream/70 sm:text-lg"
        >
          Your viewers support your live stream by the second, not in
          lump-sum tips — and an autonomous agent meters, throttles, and settles
          every payment in real time. Drop it onto the Owncast server you
          already run; no platform to migrate to.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 0.5 }}
          className="mt-12 flex items-baseline gap-3 font-mono"
        >
          <span className="text-2xl text-amber sm:text-3xl">
            <Counter ratePerSec={ratePerSec} />
          </span>
          <span className="text-[11px] uppercase tracking-eyebrow text-cream/40">
            streamed since you arrived
          </span>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="pointer-events-none absolute inset-x-0 bottom-8 flex justify-center"
      >
        <motion.span
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          className="font-mono text-[11px] uppercase tracking-eyebrow text-cream/35"
        >
          scroll to look closer
        </motion.span>
      </motion.div>
    </section>
  );
}
