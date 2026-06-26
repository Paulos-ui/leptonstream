"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { SEED_STREAMS, watchHrefFor, OWNER_ADDRESS, DEFAULT_WATCH_RATE } from "@/lib/explore";

export default function ExplorePage() {
  const router = useRouter();
  const [link, setLink] = useState("");
  const [err, setErr] = useState("");

  const playOwn = () => {
    const url = link.trim();
    const ok = /youtube\.com|youtu\.be|\.m3u8(\?|$)|\.mp4(\?|$)|\.webm(\?|$)/i.test(url);
    if (!ok) { setErr("Paste a YouTube link or a direct video / .m3u8 URL."); return; }
    router.push(`/watch/${OWNER_ADDRESS}?src=${encodeURIComponent(url)}&rate=${DEFAULT_WATCH_RATE}`);
  };

  return (
    <main className="min-h-screen px-5 pb-24 pt-20 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="font-mono text-[11px] uppercase tracking-eyebrow text-muted hover:text-leaf">← leptonstream</Link>

        <header className="mt-8">
          <span className="font-mono text-[11px] uppercase tracking-eyebrow text-muted">pick a stream · pay by the second</span>
          <h1 className="mt-2 font-serif text-7xl tracking-tight text-ink sm:text-8xl">Explore<span className="text-leaf">.</span></h1>
          <p className="mt-3 max-w-xl text-lg text-muted">
            Open one and value starts streaming — as little as a millionth of a dollar per second, metered live and settled on Arc. No subscription, no minimum. The smallest unit, finally sellable.
          </p>
        </header>

        {/* The wall */}
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SEED_STREAMS.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Link href={watchHrefFor(s.src, s.pricePerSec)} className="group block overflow-hidden rounded-2xl border border-ink/12 bg-white/40 transition-colors hover:border-ink/30">
                {/* tile head — accent field, no external thumbnail to break */}
                <div className="relative aspect-video overflow-hidden" style={{ background: `linear-gradient(135deg, ${s.accent}, ${s.accent}22)` }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-paper/90 font-serif text-2xl text-ink transition-transform group-hover:scale-110">▶</span>
                  </div>
                  <span className="absolute left-3 top-3 rounded-full bg-paper/85 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink/70">{s.category}</span>
                </div>
                <div className="p-5">
                  <div className="font-serif text-2xl text-ink">{s.title}</div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-mono text-[12px] tabular-nums text-leaf">${s.pricePerSec.toFixed(6)}/s</span>
                    <span className="font-mono text-[11px] text-muted group-hover:text-ink">Watch &amp; support →</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Bring your own */}
        <section className="mt-16 rounded-2xl border border-ink/12 bg-white/40 p-7">
          <span className="font-mono text-[11px] uppercase tracking-eyebrow text-muted">bring your own</span>
          <h2 className="mt-2 font-serif text-3xl text-ink">Paste any stream and watch.</h2>
          <p className="mt-2 max-w-lg text-muted">Drop a YouTube link or a direct video URL. The same per-second meter runs on it — a live demo of nanopayments on anything.</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              value={link}
              onChange={(e) => { setLink(e.target.value); setErr(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") playOwn(); }}
              placeholder="https://youtube.com/watch?v=…  or  https://…/stream.m3u8"
              className="flex-1 rounded-lg border border-ink/15 bg-white px-4 py-3 font-mono text-sm text-ink placeholder:text-ink/30"
            />
            <button onClick={playOwn} className="rounded-lg bg-ink px-6 py-3 font-mono text-sm text-paper transition-transform hover:scale-[1.02]">
              Watch →
            </button>
          </div>
          {err && <p className="mt-2 font-mono text-[11px] text-coral/90">{err}</p>}
          <p className="mt-3 font-mono text-[10px] text-muted">at ${DEFAULT_WATCH_RATE.toFixed(6)}/s · the meter counts only while the video plays.</p>
        </section>
      </div>
    </main>
  );
}
