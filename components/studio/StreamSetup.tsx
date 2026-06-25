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
    <div className="mt-6 overflow-hidden rounded-2xl border border-leaf/40 bg-leaf/[0.06]">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-4 p-6 text-left">
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-leaf/15 font-serif text-lg text-leaf">↗</span>
          <span>
            <span className="block font-serif text-xl text-ink">Start earning — share your link</span>
            <span className="block font-mono text-[11px] text-muted">this is where viewers come to support you, per second</span>
          </span>
        </span>
        <motion.span animate={{ rotate: open ? 45 : 0 }} className="font-mono text-2xl text-leaf">+</motion.span>
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
            <div className="space-y-7 border-t border-leaf/25 p-6">
              {/* Primary: the support link */}
              <div>
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">your support link</div>
                <p className="mt-1 text-sm text-muted">Post it in your stream description, bio, or chat. Anyone who opens it supports you by the second while they watch.</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="flex-1 truncate rounded-lg border border-ink/15 bg-white px-3 py-3 font-mono text-sm text-ink">{supportLink}</span>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => copy(supportLink, "link")} className="shrink-0 rounded-full bg-leaf px-5 py-3 font-mono text-sm text-ink">{copied === "link" ? "copied ✓" : "Copy link"}</motion.button>
                  <Link href={supportLink.replace(origin, "") || "#"} className="shrink-0 rounded-full border border-ink/20 px-5 py-3 font-mono text-sm text-ink/75 hover:border-ink">open ↗</Link>
                </div>
              </div>

              {/* Optional: stream URL */}
              <div>
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">your stream (optional)</div>
                <p className="mt-1 text-sm text-muted">Your Owncast address — or paste a YouTube / video link to preview the stream right on your support page.</p>
                <input
                  value={server} onChange={(e) => setServer(e.target.value)}
                  placeholder="https://watch.yourdomain.com  ·  or a YouTube link"
                  className="mt-3 w-full rounded-lg border border-ink/15 bg-white px-3 py-2.5 font-mono text-sm text-ink placeholder:text-ink/30"
                />
              </div>

              {/* Optional: overlay, code hidden behind a button */}
              <div>
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">show a support widget on your stream</div>
                <p className="mt-1 text-sm text-muted">Optional. Copy the overlay and paste it once into your Owncast custom-content box — a small support widget then appears on your page automatically.</p>
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
