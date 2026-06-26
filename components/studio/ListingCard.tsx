"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Address } from "viem";
import { signMessage, walletError, getOnchainTier } from "@/lib/connect";
import { listingMessage } from "@/lib/claim-message";
import { CATEGORIES, RATE_OPTIONS, bracketMax, tierName, tierFor, TIER_COLOR } from "@/lib/badge";

const BADGE_ENABLED = !!process.env.NEXT_PUBLIC_BADGE_ADDRESS;

export default function ListingCard({ account }: { account: Address }) {
  const [hasUsername, setHasUsername] = useState<boolean | null>(null);
  const [listed, setListed] = useState(false);
  const [category, setCategory] = useState<string>("Talk");
  const [tagline, setTagline] = useState("");
  const [streamUrl, setStreamUrl] = useState("");
  const [rate, setRate] = useState(0.002);
  const [earnedUsd, setEarnedUsd] = useState(0);
  const [onchainTier, setOnchainTier] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    try {
      const d = await (await fetch(`/api/profile/${account}`, { cache: "no-store" })).json();
      setHasUsername(!!d.username);
      setListed(!!d.listed);
      if (d.category) setCategory(d.category);
      if (d.tagline) setTagline(d.tagline);
      if (d.streamUrl) setStreamUrl(d.streamUrl);
      if (d.rate) setRate(d.rate);
      setEarnedUsd(d.earnedUsd ?? 0);
    } catch { /* ignore */ }
  }, [account]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { getOnchainTier(account).then(setOnchainTier).catch(() => {}); }, [account]);

  // The bracket the creator has unlocked.
  const allowedTier = BADGE_ENABLED ? onchainTier : tierFor(earnedUsd).id;
  const cap = bracketMax(allowedTier);
  const nextLocked = RATE_OPTIONS.find((r) => r > cap);

  const save = async (nextListed: boolean) => {
    if (!hasUsername) { setMsg("Claim a username first (above)."); return; }
    setBusy(true); setMsg("");
    try {
      const sig = await signMessage(account, listingMessage(account));
      const res = await fetch("/api/profile/listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: account, signature: sig, listed: nextListed, category, tagline, streamUrl, rate }),
      });
      const d = await res.json();
      if (!d.ok) { setMsg(d.error || "could not save"); }
      else {
        setListed(d.profile.listed);
        if (typeof d.profile.rate === "number") setRate(d.profile.rate);
        setMsg(nextListed ? "✓ Listed in Discover" : "removed from Discover");
        setTimeout(() => setMsg(""), 2500);
      }
    } catch (e) { setMsg(walletError(e) || "could not save"); }
    finally { setBusy(false); }
  };

  return (
    <section className="mt-6 rounded-2xl border border-ink/10 bg-white/40 p-6">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">list in discover</span>
        <span className="flex items-center gap-2 rounded-full px-3 py-1 font-mono text-[11px]" style={{ background: `${TIER_COLOR[allowedTier]}1A`, color: TIER_COLOR[allowedTier] }}>
          bracket: up to ${cap.toFixed(3)}/s
        </span>
      </div>
      <p className="mt-1 text-sm text-muted">Appear on the public Discover page so viewers can find and support you. You set your per-second rate — higher brackets unlock with your badge tier.</p>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">category</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategory(c)}
                className={`rounded-full border px-3 py-1 font-mono text-[11px] ${category === c ? "border-leaf bg-leaf/10 text-leaf" : "border-ink/15 text-ink/70 hover:border-ink/40"}`}>
                {c.toLowerCase()}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">tagline</div>
          <input value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={140} placeholder="what your stream is about"
            className="mt-2 w-full rounded-lg border border-ink/15 bg-white px-3 py-2.5 font-mono text-sm text-ink placeholder:text-ink/30" />
        </div>
      </div>

      <div className="mt-4">
        <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">stream url (owncast, or a youtube / video link)</div>
        <input value={streamUrl} onChange={(e) => setStreamUrl(e.target.value)} placeholder="https://watch.yourdomain.com  ·  or a YouTube link"
          className="mt-2 w-full rounded-lg border border-ink/15 bg-white px-3 py-2.5 font-mono text-sm text-ink placeholder:text-ink/30" />
      </div>

      <div className="mt-4">
        <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">support rate ($/second)</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {RATE_OPTIONS.map((r) => {
            const locked = r > cap;
            return (
              <button key={r} disabled={locked} onClick={() => setRate(r)}
                className={`rounded-full border px-3 py-1.5 font-mono text-[11px] ${rate === r ? "border-leaf bg-leaf/10 text-leaf" : locked ? "border-ink/10 text-ink/30" : "border-ink/15 text-ink/70 hover:border-ink/40"}`}>
                {locked ? "🔒 " : ""}${r.toFixed(3)}/s
              </button>
            );
          })}
        </div>
        {nextLocked && (
          <p className="mt-2 font-mono text-[10px] text-muted">
            {BADGE_ENABLED
              ? <>mint the next badge tier to unlock ${nextLocked.toFixed(3)}/s and beyond.</>
              : <>earn the next tier to unlock ${nextLocked.toFixed(3)}/s and beyond.</>}
          </p>
        )}
      </div>

      <div className="mt-5 flex items-center gap-3">
        {listed ? (
          <>
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => void save(true)} disabled={busy}
              className="rounded-full bg-leaf px-5 py-2.5 font-mono text-sm text-ink disabled:opacity-50">
              {busy ? "saving…" : "Save listing"}
            </motion.button>
            <button onClick={() => void save(false)} disabled={busy} className="rounded-full border border-ink/20 px-5 py-2.5 font-mono text-sm text-ink/70 hover:border-ink">
              Unlist
            </button>
          </>
        ) : (
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => void save(true)} disabled={busy}
            className="rounded-full bg-ink px-5 py-2.5 font-mono text-sm text-paper disabled:opacity-50">
            {busy ? "listing…" : "List me in Discover →"}
          </motion.button>
        )}
        {msg && <span className="font-mono text-[11px] text-muted">{msg}</span>}
      </div>
      <p className="mt-3 font-mono text-[10px] text-muted">your rate is enforced server-side against your unlocked bracket ({allowedTier > 0 ? tierName(allowedTier) : "Unranked"}).</p>
    </section>
  );
}
