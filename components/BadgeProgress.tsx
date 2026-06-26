"use client";

import { motion } from "framer-motion";
import { tierProgress, TIER_COLOR } from "@/lib/badge";

export default function BadgeProgress({ earnedUsd, minted }: { earnedUsd: number; minted?: number }) {
  const { current, next, pct, toGoUsd } = tierProgress(earnedUsd);
  const color = TIER_COLOR[current.id] ?? "#8A7E6A";
  const nextColor = next ? TIER_COLOR[next.id] : color;

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-eyebrow">
          <span className="h-2 w-2 rounded-full" style={{ background: color }} />
          <span style={{ color }}>{current.id === 0 ? "unranked" : current.name}</span>
          {typeof minted === "number" && minted >= current.id && current.id > 0 && (
            <span className="text-muted">· minted ✓</span>
          )}
        </span>
        {next ? (
          <span className="font-mono text-[11px] text-muted">next: <span style={{ color: nextColor }}>{next.name}</span></span>
        ) : (
          <span className="font-mono text-[11px]" style={{ color }}>max tier</span>
        )}
      </div>

      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ink/10">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}, ${nextColor})` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      <div className="mt-1.5 font-mono text-[11px] text-muted">
        {next
          ? <>${earnedUsd.toFixed(4)} earned · <span style={{ color: nextColor }}>${toGoUsd.toFixed(4)} more</span> to {next.name}</>
          : <>${earnedUsd.toFixed(4)} earned · you&apos;ve reached the top tier</>}
      </div>
    </div>
  );
}
