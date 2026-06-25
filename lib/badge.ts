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
  { id: 1, name: "Glow", min: 0, blurb: "First value received — the stream is earning." },
  { id: 2, name: "Shine", min: 0.5, blurb: "A real, repeat audience is backing the stream." },
  { id: 3, name: "Blaze", min: 5, blurb: "Sustained per-second support at scale." },
  { id: 4, name: "Supernova", min: 50, blurb: "A flagship creator on LeptonStream." },
];

const RANKED = TIERS.filter((t) => Number.isFinite(t.min)).sort((a, b) => b.min - a.min);

/** Highest tier whose threshold the earnings meet. Returns id 0 if none/zero. */
export function tierFor(earnedUsd: number): Tier {
  if (!(earnedUsd > 0)) return TIERS[0];
  return RANKED.find((t) => earnedUsd >= t.min) ?? TIERS[0];
}

export const TIER_COLOR: Record<number, string> = {
  0: "#8A7E6A",
  1: "#5BA013",
  2: "#3F8C8C",
  3: "#C77D2E",
  4: "#7A5AF0",
};
