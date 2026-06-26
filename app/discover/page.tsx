"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CATEGORIES, TIER_COLOR } from "@/lib/badge";
import { short } from "@/lib/format";

interface Creator {
  address: string;
  username: string;
  category: string;
  tagline: string;
  streamUrl: string;
  rate: number;
  earnedUsd: number;
  tier: { id: number; name: string };
  live: boolean | null;
  viewers: number;
}

function watchHref(c: Creator): string {
  if (!c.streamUrl) return `/watch/${c.address}`;
  const direct = /youtube\.com|youtu\.be|\.mp4|\.m3u8|\.webm/i.test(c.streamUrl);
  return `/watch/${c.address}?${direct ? "src" : "server"}=${encodeURIComponent(c.streamUrl)}`;
}

export default function DiscoverPage() {
  const [creators, setCreators] = useState<Creator[] | null>(null);
  const [cat, setCat] = useState<string>("All");

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const d = await (await fetch("/api/discover", { cache: "no-store" })).json();
        if (alive) setCreators(d.creators ?? []);
      } catch { if (alive) setCreators([]); }
    };
    void load();
    const id = setInterval(load, 10000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const filtered = useMemo(
    () => (creators ?? []).filter((c) => cat === "All" || c.category === cat),
    [creators, cat]
  );

  return (
    <main className="min-h-screen px-5 pb-24 pt-20 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="font-mono text-[11px] uppercase tracking-eyebrow text-muted hover:text-leaf">← leptonstream</Link>
        <header className="mt-8">
          <span className="font-mono text-[11px] uppercase tracking-eyebrow text-muted">browse & support</span>
          <h1 className="mt-2 font-serif text-6xl tracking-tight text-ink sm:text-7xl">Discover<span className="text-leaf">.</span></h1>
          <p className="mt-3 max-w-lg text-muted">Find a stream worth your attention and support it by the second. Pick a lane.</p>
        </header>

        {/* Category tabs */}
        <div className="mt-8 flex flex-wrap gap-2">
          {["All", ...CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full border px-4 py-1.5 font-mono text-[12px] transition-colors ${
                cat === c ? "border-leaf bg-leaf/10 text-leaf" : "border-ink/15 text-ink/70 hover:border-ink/40"
              }`}
            >
              {c.toLowerCase()}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="mt-8">
          {creators === null && <p className="font-mono text-[11px] uppercase tracking-eyebrow text-muted">loading…</p>}
          {creators?.length === 0 && (
            <div className="rounded-2xl border border-ink/10 bg-white/40 p-8 text-center">
              <p className="font-serif text-2xl text-ink">No listed creators yet.</p>
              <p className="mt-2 text-muted">List your stream in the <Link href="/studio" className="text-leaf underline">studio</Link> to appear here.</p>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((c) => {
                const color = TIER_COLOR[c.tier.id] ?? "#8A7E6A";
                return (
                  <motion.div
                    key={c.address}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                  >
                    <Link href={watchHref(c)} className="flex h-full flex-col rounded-2xl border border-ink/12 bg-white/50 p-5 transition-colors hover:border-ink/30">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">{c.category}</span>
                        {c.live === true ? (
                          <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-eyebrow text-coral">
                            <span className="h-1.5 w-1.5 rounded-full bg-coral" style={{ animation: "pulseDot 1.6s infinite" }} /> live{c.viewers > 0 ? ` · ${c.viewers}` : ""}
                          </span>
                        ) : c.live === false ? (
                          <span className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">offline</span>
                        ) : null}
                      </div>

                      <div className="mt-4 font-serif text-2xl text-ink">@{c.username}</div>
                      {c.tagline && <p className="mt-1 line-clamp-2 text-sm text-muted">{c.tagline}</p>}

                      <div className="mt-auto flex items-center justify-between pt-5">
                        <span className="flex items-center gap-2 font-mono text-[11px]">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                          <span style={{ color }}>{c.tier.id === 0 ? short(c.address) : c.tier.name}</span>
                        </span>
                        <span className="font-mono text-[11px] text-muted">${c.rate.toFixed(4)}/s · ${c.earnedUsd.toFixed(2)} earned</span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <style>{`@keyframes pulseDot{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </main>
  );
}
