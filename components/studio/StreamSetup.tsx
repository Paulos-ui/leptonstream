"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function StreamSetup({
  origin, server, setServer, snippet, supportLink, copy, copied, open, setOpen,
}: {
  origin: string; server: string; setServer: (v: string) => void;
  snippet: string; supportLink: string;
  copy: (text: string, which: string) => void; copied: string;
  open: boolean; setOpen: (v: boolean) => void;
}) {
  return (
    <div className="mt-6 rounded-2xl border border-cream/10 bg-ink/40">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between p-6 text-left">
        <span className="font-mono text-[11px] uppercase tracking-eyebrow text-cream/60">set up your owncast stream</span>
        <motion.span animate={{ rotate: open ? 45 : 0 }} className="font-mono text-lg text-cream/40">+</motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="border-t border-cream/10 p-6">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-cream/40">your owncast server (optional)</div>
              <input
                value={server} onChange={(e) => setServer(e.target.value)}
                placeholder="https://watch.yourdomain.com"
                className="mt-2 w-full rounded-lg border border-cream/15 bg-ink px-3 py-2.5 font-mono text-sm text-cream placeholder:text-cream/30"
              />

              <div className="mt-5 font-mono text-[11px] text-cream/60">Overlay snippet (Owncast → Admin → Custom Content / JS):</div>
              <div className="mt-2 flex items-start gap-2">
                <code className="flex-1 overflow-x-auto rounded-lg border border-cream/10 bg-ink px-3 py-2.5 font-mono text-[11px] text-periwinkle/90 whitespace-pre">{snippet}</code>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => copy(snippet, "snippet")} className="shrink-0 rounded-full bg-amber px-4 py-2.5 font-mono text-xs text-ink">{copied === "snippet" ? "✓" : "copy"}</motion.button>
              </div>

              <div className="mt-5 font-mono text-[11px] text-cream/60">Or a shareable support link:</div>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 truncate rounded-lg border border-cream/10 bg-ink px-3 py-2.5 font-mono text-xs text-periwinkle/90">{supportLink}</code>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => copy(supportLink, "link")} className="shrink-0 rounded-full bg-amber px-4 py-2.5 font-mono text-xs text-ink">{copied === "link" ? "✓" : "copy"}</motion.button>
                <Link href={supportLink.replace(origin, "") || "#"} className="shrink-0 rounded-full border border-cream/20 px-4 py-2.5 font-mono text-xs text-cream/80 hover:border-cream/50">open ↗</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
