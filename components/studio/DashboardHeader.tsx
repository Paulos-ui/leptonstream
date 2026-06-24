"use client";

import { motion } from "framer-motion";
import { addrUrl } from "@/lib/arc";
import { short } from "@/lib/format";

export default function DashboardHeader({
  account,
  chainOk,
  onSwitch,
}: {
  account: string;
  chainOk: boolean;
  onSwitch: () => void;
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-8 flex flex-wrap items-center justify-between gap-3"
    >
      <div>
        <span className="font-mono text-[11px] uppercase tracking-eyebrow text-cream/40">dashboard</span>
        <h1 className="mt-1 font-serif text-3xl text-cream">Your earnings</h1>
      </div>
      <div className="flex items-center gap-3">
        {!chainOk && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={onSwitch}
            className="rounded-full border border-amber/50 px-3 py-1.5 font-mono text-[11px] text-amber hover:border-amber"
          >
            Switch to Arc
          </motion.button>
        )}
        <span className="flex items-center gap-2 rounded-full border border-cream/15 px-3 py-1.5 font-mono text-[11px] text-cream/70">
          <motion.span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: chainOk ? "#5E8F86" : "#FF6B57" }}
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 2.4, repeat: Infinity }}
          />
          <a href={addrUrl(account)} target="_blank" rel="noreferrer" className="hover:text-amber">{short(account)}</a>
        </span>
      </div>
    </motion.header>
  );
}
