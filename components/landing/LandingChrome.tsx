"use client";

import Link from "next/link";

export function LandingNav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-ink/10 bg-paper/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2 font-mono text-sm text-ink">
          <span className="text-leaf">▦</span> leptonstream
        </Link>
        <div className="hidden items-center gap-7 font-mono text-[13px] text-ink/70 md:flex">
          <Link href="/discover" className="hover:text-ink">discover</Link>
          <Link href="/leaderboard" className="hover:text-ink">leaderboard</Link>
          <a href="#how" className="hover:text-ink">how</a>
          <a href="#faq" className="hover:text-ink">faq</a>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 rounded-full border border-ink/20 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink/70 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-leaf" /> arc testnet
          </span>
          <Link href="/studio" className="rounded-lg bg-ink px-4 py-2 font-mono text-[13px] text-paper transition-transform hover:scale-[1.02]">
            Connect wallet →
          </Link>
        </div>
      </div>
    </nav>
  );
}

export function SectionMark({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="font-mono text-[12px] text-leaf">§ {n}</span>
      <span className="h-px flex-1 bg-ink/15" />
      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">{label}</span>
    </div>
  );
}
