"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { txUrl } from "@/lib/arc";
import { short } from "@/lib/format";
import type { Incoming } from "@/lib/connect";

function relTime(iso: string): string {
  const d = Date.parse(iso);
  if (Number.isNaN(d)) return "";
  const s = Math.max(0, Math.round((Date.now() - d) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

export default function SupportFeed({ feed }: { feed: Incoming[] }) {
  const reduce = useReducedMotion();
  return (
    <section className="mt-6 rounded-2xl border border-cream/10 bg-ink/40 p-6">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[10px] uppercase tracking-eyebrow text-cream/40">live support · settled on arc</span>
        <span className="font-mono text-[11px] text-verdigris">{feed.length} recent</span>
      </div>
      <div className="mt-3 divide-y divide-cream/5">
        {feed.length === 0 && (
          <p className="py-2 font-mono text-[11px] text-cream/30">
            no supporters yet — share your link and they&apos;ll appear here as value streams in.
          </p>
        )}
        <AnimatePresence initial={false}>
          {feed.map((t) => (
            <motion.div
              key={t.id}
              layout={!reduce}
              initial={reduce ? false : { opacity: 0, y: -8, backgroundColor: "rgba(246,169,43,0.08)" }}
              animate={{ opacity: 1, y: 0, backgroundColor: "rgba(0,0,0,0)" }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-between py-2 font-mono text-[11px]"
            >
              <span className="text-cream/60">{short(t.from)}</span>
              <span className="tabular-nums text-amber">+${(Number(t.amount) / 1e6).toFixed(6)}</span>
              <span className="text-cream/30">{relTime(t.createdAt)}</span>
              {t.tx ? (
                <a href={txUrl(t.tx)} target="_blank" rel="noreferrer" className="text-periwinkle/70 hover:text-periwinkle">↗</a>
              ) : (
                <span className="text-cream/20">·</span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
