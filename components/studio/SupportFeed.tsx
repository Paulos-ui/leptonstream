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
    <section className="mt-6 rounded-2xl border border-ink/10 bg-white/40 p-6">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">live support · settled on arc</span>
        <span className="font-mono text-[11px] text-verdigris">{feed.length} recent</span>
      </div>
      <div className="mt-3 divide-y divide-ink/10">
        {feed.length === 0 && (
          <p className="py-2 font-mono text-[11px] text-ink/30">
            no supporters yet — share your link and they&apos;ll appear here as value streams in.
          </p>
        )}
        <AnimatePresence initial={false}>
          {feed.map((t) => (
            <motion.div
              key={t.id}
              layout={!reduce}
              initial={reduce ? false : { opacity: 0, y: -8, backgroundColor: "rgba(91,160,19,0.08)" }}
              animate={{ opacity: 1, y: 0, backgroundColor: "rgba(0,0,0,0)" }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-between py-2 font-mono text-[11px]"
            >
              <span className="text-ink/60">{short(t.from)}</span>
              <span className="tabular-nums text-leaf">+${(Number(t.amount) / 1e6).toFixed(6)}</span>
              <span className="text-ink/30">{relTime(t.createdAt)}</span>
              {t.tx ? (
                <a href={txUrl(t.tx)} target="_blank" rel="noreferrer" className="text-leaf hover:text-leaf">↗</a>
              ) : (
                <span className="text-ink/20">·</span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
