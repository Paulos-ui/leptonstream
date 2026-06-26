"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TIER_COLOR } from "@/lib/badge";
import { short } from "@/lib/format";

interface Leader {
  address: string;
  username: string | null;
  earnedUsd: number;
  tier: { id: number; name: string };
}

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<Leader[] | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const d = await (await fetch("/api/leaderboard", { cache: "no-store" })).json();
        if (alive) setLeaders(d.leaders ?? []);
      } catch { if (alive) setLeaders([]); }
    };
    void load();
    const id = setInterval(load, 8000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  return (
    <main className="min-h-screen px-5 pb-24 pt-20 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="font-mono text-[11px] uppercase tracking-eyebrow text-muted hover:text-leaf">← leptonstream</Link>
        <header className="mt-8">
          <span className="font-mono text-[11px] uppercase tracking-eyebrow text-muted">paid by the second</span>
          <h1 className="mt-2 font-serif text-6xl tracking-tight text-ink sm:text-7xl">Leaderboard<span className="text-leaf">.</span></h1>
          <p className="mt-3 text-muted">Creators earning the most through live per-second support, settled on Arc.</p>
        </header>

        <div className="mt-10">
          {leaders === null && <p className="font-mono text-[11px] uppercase tracking-eyebrow text-muted">loading…</p>}
          {leaders?.length === 0 && (
            <div className="rounded-2xl border border-ink/10 bg-white/40 p-8 text-center">
              <p className="font-serif text-2xl text-ink">No ranked creators yet.</p>
              <p className="mt-2 text-muted">Claim a username in the <Link href="/studio" className="text-leaf underline">studio</Link> and start earning to appear here.</p>
            </div>
          )}
          <div className="divide-y divide-ink/10 border-y border-ink/10">
            {leaders?.map((l, i) => {
              const color = TIER_COLOR[l.tier.id] ?? "#8A7E6A";
              const handle = l.username ?? l.address;
              return (
                <Link key={l.address} href={`/u/${handle}`} className="flex items-center gap-4 py-4 transition-colors hover:bg-white/40">
                  <span className="w-8 text-center font-serif text-2xl text-muted">{i + 1}</span>
                  <span className="flex-1">
                    <span className="font-serif text-xl text-ink">{l.username ? `@${l.username}` : short(l.address)}</span>
                    {l.tier.id > 0 && (
                      <span className="ml-3 font-mono text-[11px]" style={{ color }}>{l.tier.name}</span>
                    )}
                  </span>
                  <span className="font-mono tabular-nums text-lg" style={{ color }}>${l.earnedUsd.toFixed(4)}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
