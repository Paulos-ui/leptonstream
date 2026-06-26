// Earning tiers. A creator's tier is derived from their total received (USD).
// The same ladder powers the profile badge and the on-chain NFT attestation,
// so the NFT metadata and the UI never disagree.

export interface Tier {
  id: number;
  name: string;
  min: number; // minimum total received (USD) to hold this tier
  blurb: string;
}

export const TIERS: Tier[] = [
  { id: 0, name: "Unranked", min: Infinity, blurb: "No support received yet." }, // sentinel, never matched by tierFor
  { id: 1, name: "Glow", min: 0.001, blurb: "First value received — the stream is earning." },
  { id: 2, name: "Shine", min: 0.5, blurb: "A real, repeat audience is backing the stream." },
  { id: 3, name: "Blaze", min: 5, blurb: "Sustained per-second support at scale." },
  { id: 4, name: "Supernova", min: 50, blurb: "A flagship creator on LeptonStream." },
];

const RANKED = TIERS.filter((t) => Number.isFinite(t.min)).sort((a, b) => b.min - a.min);
const ASCENDING = TIERS.filter((t) => Number.isFinite(t.min)).sort((a, b) => a.min - b.min);

/** Highest tier whose threshold the earnings meet. Returns id 0 if none/zero. */
export function tierFor(earnedUsd: number): Tier {
  if (!(earnedUsd > 0)) return TIERS[0];
  return RANKED.find((t) => earnedUsd >= t.min) ?? TIERS[0];
}

export function tierName(id: number): string {
  return (TIERS.find((t) => t.id === id) ?? TIERS[0]).name;
}

export interface TierProgress {
  current: Tier;
  next: Tier | null;
  pct: number;       // 0..100 toward `next`
  toGoUsd: number;   // dollars remaining to reach `next`
}

/** Where a creator sits on the ladder and how close they are to the next tier. */
export function tierProgress(earnedUsd: number): TierProgress {
  const current = tierFor(earnedUsd);
  const next = ASCENDING.find((t) => earnedUsd < t.min) ?? null;
  if (!next) return { current, next: null, pct: 100, toGoUsd: 0 };
  const floor = current.id === 0 ? 0 : current.min;
  const span = next.min - floor;
  const pct = span > 0 ? Math.max(0, Math.min(100, ((earnedUsd - floor) / span) * 100)) : 0;
  return { current, next, pct, toGoUsd: Math.max(0, next.min - earnedUsd) };
}

export const TIER_COLOR: Record<number, string> = {
  0: "#8A7E6A",
  1: "#5BA013",
  2: "#3F8C8C",
  3: "#C77D2E",
  4: "#7A5AF0",
};

// Max support rate ($/sec) a creator may set, unlocked by their badge tier.
// Higher tiers can offer higher-rate brackets — the on-chain badge is the key.
export const RATE_BRACKET: Record<number, number> = {
  0: 0.005, // Unranked
  1: 0.005, // Glow
  2: 0.01,  // Shine
  3: 0.02,  // Blaze
  4: 0.05,  // Supernova
};

export function bracketMax(tierId: number): number {
  return RATE_BRACKET[tierId] ?? 0.005;
}

// Selectable per-second rates shown to a creator (locked above their bracket).
export const RATE_OPTIONS = [0.001, 0.002, 0.005, 0.01, 0.02, 0.05];

export const CATEGORIES = ["Gaming", "Music", "Talk", "Art", "Education", "IRL"] as const;
export type Category = (typeof CATEGORIES)[number];
