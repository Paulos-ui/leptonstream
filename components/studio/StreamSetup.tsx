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
    <div className="mt-6 rounded-2xl border border-ink/10 bg-white/40">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between p-6 text-left">
        <span className="font-mono text-[11px] uppercase tracking-eyebrow text-ink/60">set up your stream</span>
        <motion.span animate={{ rotate: open ? 45 : 0 }} className="font-mono text-lg text-muted">+</motion.span>
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
            <div className="space-y-7 border-t border-ink/10 p-6">
              {/* Primary: shareable link */}
              <div>
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">share your support link</div>
                <p className="mt-1 text-sm text-muted">Put this in your stream description or post it anywhere. Viewers open it to support you by the second.</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="flex-1 truncate rounded-lg border border-ink/10 bg-white px-3 py-2.5 font-mono text-xs text-ink/70">{supportLink}</span>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => copy(supportLink, "link")} className="shrink-0 rounded-full bg-ink px-4 py-2.5 font-mono text-xs text-paper">{copied === "link" ? "copied ✓" : "Copy link"}</motion.button>
                  <Link href={supportLink.replace(origin, "") || "#"} className="shrink-0 rounded-full border border-ink/20 px-4 py-2.5 font-mono text-xs text-ink/75 hover:border-ink">open ↗</Link>
                </div>
              </div>

              {/* Optional: Owncast server */}
              <div>
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">your owncast address (optional)</div>
                <p className="mt-1 text-sm text-muted">Add it so the support page can show your live feed and viewer count.</p>
                <input
                  value={server} onChange={(e) => setServer(e.target.value)}
                  placeholder="https://watch.yourdomain.com"
                  className="mt-3 w-full rounded-lg border border-ink/15 bg-white px-3 py-2.5 font-mono text-sm text-ink placeholder:text-ink/30"
                />
              </div>

              {/* Optional: overlay — code hidden behind a copy button */}
              <div>
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">show a support widget on your stream</div>
                <p className="mt-1 text-sm text-muted">Optional. Copy the overlay and paste it once into your Owncast custom-content box — a small &ldquo;support&rdquo; widget then appears on your page automatically.</p>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => copy(snippet, "snippet")} className="mt-3 rounded-full border border-leaf/50 px-5 py-2.5 font-mono text-xs text-leaf hover:border-leaf">
                  {copied === "snippet" ? "copied ✓ — paste into Owncast" : "Copy overlay"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
