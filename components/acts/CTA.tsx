"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import RateSlider from "@/components/ui/RateSlider";
import Counter from "@/components/ui/Counter";

const ease = [0.16, 1, 0.3, 1] as const;

export default function CTA() {
  const [rate, setRate] = useState(0.00004 + (0.0004 - 0.00004) * 0.5);

  const filmCost = rate * 7200; // a 2-hour film
  const subscription = 15.99;

  return (
    <section className="relative flex min-h-screen flex-col justify-center px-6 py-32 sm:px-10 lg:px-16">
      <div className="mx-auto w-full max-w-3xl text-center">
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease }}
          className="mb-6 block font-mono text-[11px] uppercase tracking-eyebrow text-amber/80"
        >
          your stream
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease, delay: 0.05 }}
          className="font-serif text-[clamp(2.5rem,8vw,6rem)] leading-[0.98] text-cream"
        >
          Set your rate.
          <br />
          <span className="italic">Start the stream.</span>
        </motion.h2>

        {/* Live control */}
        <div className="mx-auto mt-16 max-w-xl">
          <div className="flex items-baseline justify-between font-mono text-[11px] uppercase tracking-eyebrow text-cream/40">
            <span>drag to set your rate</span>
            <span className="tabular-nums text-amber">
              ${rate.toFixed(6)} / sec
            </span>
          </div>
          <div className="mt-4">
            <RateSlider onChange={(r) => setRate(r)} />
          </div>

          {/* Live readouts driven by the chosen rate */}
          <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-cream/10 bg-cream/5 text-left">
            <div className="bg-ink/40 p-5">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-cream/40">
                streaming now
              </div>
              <div className="mt-2 font-mono text-2xl text-amber">
                <Counter key={rate} ratePerSec={rate} />
              </div>
            </div>
            <div className="bg-ink/40 p-5">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-cream/40">
                a 2-hour film
              </div>
              <div className="mt-2 font-mono text-2xl text-coral">
                ${filmCost.toFixed(2)}
              </div>
            </div>
          </div>
          <p className="mt-4 font-mono text-[11px] text-cream/40">
            at this rate, a full film costs{" "}
            <span className="text-verdigris">${filmCost.toFixed(2)}</span> — and
            you stop paying the second you stop watching. A flat subscription is
            ${subscription.toFixed(2)} whether you watch it or not.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-14 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="/studio"
            className="rounded-full bg-amber px-8 py-3.5 font-mono text-sm font-medium text-ink transition-transform hover:scale-[1.03]"
          >
            Launch LeptonStream
          </a>
          <a
            href="https://github.com/Paulos-ui/leptonstream"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-cream/20 px-8 py-3.5 font-mono text-sm text-cream/80 transition-colors hover:border-cream/50"
          >
            View on GitHub ↗
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="mx-auto mt-32 flex w-full max-w-6xl flex-col items-center justify-between gap-4 border-t border-cream/10 pt-8 font-mono text-[11px] text-cream/35 sm:flex-row">
        <span>
          <span className="text-amber">◆</span> LeptonStream
        </span>
        <span>value, in constant motion</span>
        <span>Lepton Agents Hackathon · {new Date().getFullYear()}</span>
      </footer>
    </section>
  );
}
