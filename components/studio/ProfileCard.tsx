"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import type { Address } from "viem";
import { signMessage, walletError } from "@/lib/connect";
import { claimMessage } from "@/lib/claim-message";
import { tierFor, TIER_COLOR } from "@/lib/badge";
import BadgeProgress from "@/components/BadgeProgress";

interface ProfileData {
  username: string | null;
  earnedUsd: number;
  supporters: number;
  referrals: number;
  referralEarnings: number;
}

export default function ProfileCard({ account, onClaimed }: { account: Address; onClaimed?: () => void }) {
  const [origin, setOrigin] = useState("");
  const [ref, setRef] = useState<string | null>(null);
  const [data, setData] = useState<ProfileData | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    const sp = new URLSearchParams(window.location.search);
    const r = sp.get("ref");
    if (r) { try { localStorage.setItem("lepton.ref", r); } catch { /* ignore */ } }
    try { setRef(r || localStorage.getItem("lepton.ref")); } catch { setRef(r); }
  }, []);

  const load = async () => {
    try {
      const res = await fetch(`/api/profile/${account}`, { cache: "no-store" });
      const d = await res.json();
      setData({ username: d.username ?? null, earnedUsd: d.earnedUsd ?? 0, supporters: d.supporters ?? 0, referrals: d.referrals ?? 0, referralEarnings: d.referralEarnings ?? 0 });
    } catch { /* ignore */ }
  };
  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [account]);

  const claim = async () => {
    const u = name.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(u)) { setErr("3–20 chars: lowercase letters, numbers or underscore."); return; }
    setBusy(true); setErr("");
    try {
      const sig = await signMessage(account, claimMessage(u, account));
      const res = await fetch("/api/profile/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: account, username: u, signature: sig, ref }),
      });
      const d = await res.json();
      if (!d.ok) { setErr(d.error || "could not claim"); }
      else { setName(""); await load(); onClaimed?.(); }
    } catch (e) { setErr(walletError(e) || "could not claim"); }
    finally { setBusy(false); }
  };

  const copy = async (text: string, which: string) => {
    await navigator.clipboard.writeText(text); setCopied(which); setTimeout(() => setCopied(""), 1500);
  };

  const handle = data?.username ?? account;
  const profileUrl = `${origin}/u/${handle}`;
  const referralUrl = `${origin}/?ref=${handle}`;
  const tier = tierFor(data?.earnedUsd ?? 0);

  return (
    <section className="mt-6 rounded-2xl border border-ink/10 bg-white/40 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">your profile</span>
        {tier.id > 0 && (
          <span className="flex items-center gap-2 rounded-full px-3 py-1 font-mono text-[11px]" style={{ background: `${TIER_COLOR[tier.id]}1A`, color: TIER_COLOR[tier.id] }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: TIER_COLOR[tier.id] }} /> {tier.name} · tier {tier.id}
          </span>
        )}
      </div>

      {data?.username ? (
        <>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="font-serif text-3xl text-ink">@{data.username}</span>
            <Link href={`/u/${data.username}`} className="font-mono text-[12px] text-leaf hover:underline">view public profile ↗</Link>
          </div>
          <div className="mt-1 font-mono text-[11px] text-muted">{data.referrals} creator{data.referrals === 1 ? "" : "s"} referred</div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-leaf/30 bg-leaf/[0.06] p-4">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">referral earnings · 1%</div>
              <div className="mt-1 font-serif text-2xl tabular-nums text-leaf">${(data.referralEarnings ?? 0).toFixed(4)}</div>
              <div className="mt-1 font-mono text-[10px] text-muted">accrued from creators you referred · payout coming on-chain</div>
            </div>
            <div className="rounded-xl border border-ink/10 bg-white/40 p-4">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">your earnings</div>
              <div className="mt-1 font-serif text-2xl tabular-nums text-ink">${(data.earnedUsd ?? 0).toFixed(4)}</div>
              <div className="mt-1 font-mono text-[10px] text-muted">{data.supporters} supporter{data.supporters === 1 ? "" : "s"}</div>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-ink/10 bg-white/40 p-4">
            <BadgeProgress earnedUsd={data.earnedUsd ?? 0} />
          </div>

          <div className="mt-5 space-y-3">
            <LinkRow label="profile link" value={profileUrl} onCopy={() => copy(profileUrl, "p")} copied={copied === "p"} />
            <LinkRow label="referral link — invite other creators" value={referralUrl} onCopy={() => copy(referralUrl, "r")} copied={copied === "r"} />
          </div>
        </>
      ) : (
        <div className="mt-3">
          <p className="text-sm text-muted">Claim a username so supporters can find you at a clean link, and to unlock your referral link.</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="font-mono text-ink/50">@</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="yourname"
              className="flex-1 rounded-lg border border-ink/15 bg-white px-3 py-2.5 font-mono text-sm text-ink placeholder:text-ink/30" />
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => void claim()} disabled={busy}
              className="shrink-0 rounded-full bg-leaf px-5 py-2.5 font-mono text-sm text-ink disabled:opacity-50">
              {busy ? "signing…" : "Claim →"}
            </motion.button>
          </div>
          <p className="mt-2 font-mono text-[10px] text-muted">You&apos;ll sign a message to prove the wallet is yours — no gas, no transaction.</p>
        </div>
      )}

      {err && <p className="mt-3 font-mono text-[11px] text-coral/90">{err}</p>}
    </section>
  );
}

function LinkRow({ label, value, onCopy, copied }: { label: string; value: string; onCopy: () => void; copied: boolean }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">{label}</div>
      <div className="mt-1.5 flex items-center gap-2">
        <span className="flex-1 truncate rounded-lg border border-ink/10 bg-white px-3 py-2.5 font-mono text-xs text-ink/70">{value}</span>
        <motion.button whileTap={{ scale: 0.95 }} onClick={onCopy} className="shrink-0 rounded-full border border-ink/20 px-4 py-2.5 font-mono text-xs text-ink/75 hover:border-ink">{copied ? "✓" : "copy"}</motion.button>
      </div>
    </div>
  );
}
