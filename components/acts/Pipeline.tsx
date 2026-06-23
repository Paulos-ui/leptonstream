"use client";

import {
  useScroll,
  useMotionValueEvent,
  useTransform,
  motion,
} from "framer-motion";
import { useRef, useState } from "react";

type Stage = {
  n: string;
  title: string;
  desc: string;
  accent: "amber" | "peri";
};

const STAGES: Stage[] = [
  {
    n: "01",
    title: "Your ceiling",
    desc: "You set a maximum spend before play. A hard limit nothing downstream can cross.",
    accent: "amber",
  },
  {
    n: "02",
    title: "The agent",
    desc: "Watches quality second by second, decides the rate, and signs each nanopayment batch.",
    accent: "peri",
  },
  {
    n: "03",
    title: "Circle Arc",
    desc: "Batches route as USDC nanopayments through Circle's Gateway on the Arc network.",
    accent: "amber",
  },
  {
    n: "04",
    title: "x402 settlement",
    desc: "Value settles to the creator per second over the x402 protocol — paid as watched.",
    accent: "amber",
  },
];

export default function Pipeline() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const i = Math.min(STAGES.length - 1, Math.floor(p * STAGES.length));
    setActive(i);
  });

  const enter = useTransform(scrollYProgress, [0, 0.08], [0, 1]);
  // Flow fill + traveling pulse along the channel.
  const fill = useTransform(scrollYProgress, [0.04, 0.96], ["0%", "100%"]);

  return (
    <div ref={ref} className="relative h-[260vh]">
      <div className="sticky top-0 flex h-screen items-center px-6 sm:px-10 lg:px-16">
        {/* Legibility scrim so the diagram reads over the live stream. */}
        <div className="absolute inset-0 bg-gradient-to-b from-ink/20 via-ink/55 to-ink/20" />

        <motion.div
          style={{ opacity: enter }}
          className="relative mx-auto w-full max-w-6xl"
        >
          <span className="mb-6 block font-mono text-[11px] uppercase tracking-eyebrow text-amber/80">
            under the hood
          </span>
          <h2 className="max-w-3xl font-serif text-[clamp(2.25rem,6vw,4.75rem)] leading-[1] text-cream">
            The rails beneath the stream.
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-cream/70 sm:text-lg">
            One continuous stream to you. Underneath, a precise pipeline moves
            value from your limit to the creator, in real time.
          </p>

          {/* The channel */}
          <div className="relative mt-16">
            {/* base line */}
            <div className="absolute left-0 right-0 top-7 hidden h-px bg-cream/15 lg:block" />
            <motion.div
              className="absolute left-0 top-7 hidden h-px bg-amber lg:block"
              style={{ width: fill }}
            />
            {/* traveling pulse */}
            <motion.div
              className="absolute top-[26px] hidden h-2 w-2 -translate-x-1/2 rounded-full bg-amber lg:block"
              style={{ left: fill }}
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:gap-5">
              {STAGES.map((s, i) => {
                const on = i <= active;
                const accent = s.accent === "peri" ? "#8B8BFA" : "#F6A92B";
                return (
                  <div
                    key={s.n}
                    className="group relative rounded-xl border bg-ink/40 p-6 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1"
                    style={{
                      borderColor: on
                        ? `${accent}66`
                        : "rgba(244,236,221,0.12)",
                      opacity: on ? 1 : 0.42,
                    }}
                  >
                    {/* node marker aligned to the channel line on desktop */}
                    <div
                      className="absolute -top-[37px] left-6 hidden h-3 w-3 rounded-full border-2 transition-colors duration-500 lg:block"
                      style={{
                        borderColor: on ? accent : "rgba(244,236,221,0.3)",
                        backgroundColor: on ? accent : "#16100C",
                      }}
                    />
                    <div
                      className="font-mono text-[11px] tracking-eyebrow transition-colors duration-500"
                      style={{ color: on ? accent : "rgba(244,236,221,0.4)" }}
                    >
                      {s.n}
                    </div>
                    <h3 className="mt-3 font-serif text-2xl text-cream">
                      {s.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-cream/60">
                      {s.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
