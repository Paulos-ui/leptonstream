"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Address, Hex } from "viem";
import { TIER_COLOR } from "@/lib/badge";
import { short } from "@/lib/format";
import { addrUrl, txUrl } from "@/lib/arc";
import { useWallet } from "@/hooks/useWallet";
import { claimBadge, waitForTx, walletError } from "@/lib/connect";

interface Tier { id: number; name: string; blurb: string }
interface ProfileResp {
  address: string;
  username: string | null;
  referredBy: string | null;
  earnedUsd: number;
  supporters: number;
  referrals: number;
  tier: Tier;
  recent: { id: string; from: string; amount: string; createdAt: string; tx?: string }[];
}

const BADGE = process.env.NEXT_PUBLIC_BADGE_ADDRESS as Address | undefined;

export default function ProfilePage() {
  const { handle } = useParams<{ handle: string }>();
  const [p, setP] = useState<ProfileResp | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [origin, setOrigin] = useState("");
  const { account, connect, connecting } = useWallet();

  const [mintMsg, setMintMsg] = useState("");
  const [minting, setMinting] = useState(false);

  useEffect(() => setOrigin(window.location.origin), []);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/profile/${handle}`, { cache: "no-store" });
      if (!res.ok) { setNotFound(true); return; }
      setP(await res.json());
    } catch { setNotFound(true); }
  }, [handle]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 6000);
    return () => clearInterval(id);
  }, [load]);

  const isOwner = !!account && !!p && account.toLowerCase() === p.address.toLowerCase();

  const mint = async () => {
    if (!account || !p || !BADGE) return;
    setMinting(true); setMintMsg("");
    try {
      const att = await (await fetch(`/api/badge/attest/${p.address}`, { cache: "no-store" })).json();
      if (!att.configured) { setMintMsg("On-chain badge isn't enabled on this deployment yet."); return; }
      if (!att.signature) { setMintMsg(att.error || "No tier to mint yet."); return; }
      const tx = await claimBadge(account, BADGE, att.tier.id, att.signature as Hex);
      await waitForTx(tx);
      setMintMsg(`✓ Badge minted — ${att.tier.name}.`);
    } catch (e) { setMintMsg(walletError(e) || "Mint failed."); }
    finally { setMinting(false); }
  };

  if (notFound) {
    return (
      <main className="mx-auto max-w-xl px-6 py-32 text-center">
        <h1 className="font-serif text-4xl text-ink">No profile here yet</h1>
        <p className="mt-4 text-muted">This handle hasn&apos;t been claimed. Creators set theirs up in the <Link href="/studio" className="text-leaf underline">studio</Link>.</p>
      </main>
    );
  }
  if (!p) {
    return <main className="flex min-h-screen items-center justify-center"><span className="font-mono text-[11px] uppercase tracking-eyebrow text-muted">loading profile…</span></main>;
  }

  const color = TIER_COLOR[p.tier.id] ?? "#8A7E6A";
  const display = p.username ? `@${p.username}` : short(p.address);
  const referralUrl = `${origin}/?ref=${p.username ?? p.address}`;

  return (
    <main className="min-h-screen px-5 pb-24 pt-20 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="font-mono text-[11px] uppercase tracking-eyebrow text-muted hover:text-leaf">← leptonstream</Link>

        <header className="mt-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-6xl tracking-tight text-ink">{display}</h1>
            <a href={addrUrl(p.address)} target="_blank" rel="noreferrer" className="mt-2 inline-block font-mono text-[12px] text-muted hover:text-leaf">{short(p.address)} ↗</a>
          </div>
          {p.tier.id > 0 ? (
            <div className="rounded-2xl border px-5 py-3 text-right" style={{ borderColor: `${color}55`, background: `${color}12` }}>
              <div className="font-mono text-[10px] uppercase tracking-eyebrow" style={{ color }}>earned badge</div>
              <div className="font-serif text-2xl" style={{ color }}>{p.tier.name}</div>
              <div className="font-mono text-[10px] text-muted">tier {p.tier.id} of 4</div>
            </div>
          ) : (
            <div className="rounded-2xl border border-ink/10 px-5 py-3 text-right">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">badge</div>
              <div className="font-serif text-xl text-muted">Unranked</div>
            </div>
          )}
        </header>

        <div className="mt-8 grid grid-cols-3 gap-3">
          <Stat label="earned (in gateway)" value={`$${p.earnedUsd.toFixed(4)}`} accent={color} />
          <Stat label="supporters" value={String(p.supporters)} />
          <Stat label="creators referred" value={String(p.referrals)} />
        </div>

        <p className="mt-4 font-mono text-[12px] text-muted">{p.tier.blurb}</p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={`/watch/${p.address}`} className="rounded-full bg-ink px-6 py-3 font-mono text-sm text-paper transition-transform hover:scale-[1.02]">Support this creator →</Link>
          {isOwner && BADGE && p.tier.id > 0 && (
            <button onClick={() => void mint()} disabled={minting} className="rounded-full border border-leaf/50 px-6 py-3 font-mono text-sm text-leaf hover:border-leaf disabled:opacity-50">
              {minting ? "minting…" : `Mint your ${p.tier.name} badge`}
            </button>
          )}
          {isOwner && !BADGE && p.tier.id > 0 && (
            <span className="self-center font-mono text-[11px] text-muted">on-chain badge not enabled on this deployment</span>
          )}
          {!account && (
            <button onClick={() => void connect()} disabled={connecting} className="rounded-full border border-ink/20 px-6 py-3 font-mono text-sm text-ink/75 hover:border-ink">
              {connecting ? "connecting…" : "Connect wallet"}
            </button>
          )}
        </div>
        {mintMsg && <p className="mt-3 font-mono text-[11px] text-muted">{mintMsg}</p>}

        <div className="mt-10 rounded-2xl border border-ink/10 bg-white/40 p-6">
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">recent support · settled on arc</div>
          <div className="mt-3 divide-y divide-ink/10">
            {p.recent.length === 0 && <p className="py-2 font-mono text-[11px] text-muted">no support yet — be the first.</p>}
            {p.recent.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2 font-mono text-[11px]">
                <span className="text-ink/60">{short(t.from)}</span>
                <span className="tabular-nums text-leaf">+${(Number(t.amount) / 1e6).toFixed(6)}</span>
                {t.tx ? <a href={txUrl(t.tx)} target="_blank" rel="noreferrer" className="text-leaf">↗</a> : <span className="text-ink/30">·</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-ink/10 bg-white/40 p-6">
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">refer creators</div>
          <p className="mt-1 text-sm text-muted">Share this link — creators who join through it are credited to {display}.</p>
          <code className="mt-3 block truncate rounded-lg border border-ink/10 bg-white px-3 py-2.5 font-mono text-xs text-ink/70">{referralUrl}</code>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-white/40 p-4">
      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">{label}</div>
      <div className="mt-1 font-serif text-3xl tabular-nums" style={{ color: accent ?? "#16100C" }}>{value}</div>
    </div>
  );
}
