import { NextRequest, NextResponse } from "next/server";
import { verifyMessage, isAddress, createPublicClient, http, type Address } from "viem";
import { updateListing } from "@/lib/profiles";
import { listingMessage } from "@/lib/claim-message";
import { earnedUsd } from "@/lib/gateway-read";
import { tierFor, bracketMax } from "@/lib/badge";
import { BADGE_ABI } from "@/lib/badge-abi";
import { ARC } from "@/lib/arc";

export const runtime = "nodejs";

const BADGE = process.env.NEXT_PUBLIC_BADGE_ADDRESS as Address | undefined;

async function allowedTierId(address: Address): Promise<number> {
  // On-chain minted tier is the gate when the badge is configured (mint to
  // unlock). Otherwise fall back to earned tier.
  if (BADGE) {
    try {
      const client = createPublicClient({ transport: http(ARC.rpcUrl) });
      const t = (await client.readContract({ address: BADGE, abi: BADGE_ABI, functionName: "tierOf", args: [address] })) as number;
      return Number(t) || 0;
    } catch { /* fall through */ }
  }
  return tierFor(await earnedUsd(address)).id;
}

export async function POST(req: NextRequest) {
  let body: { address?: string; signature?: string; listed?: boolean; category?: string; tagline?: string; streamUrl?: string; rate?: number };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "bad request" }, { status: 400 }); }

  const { address, signature } = body;
  if (!address || !isAddress(address) || !signature) {
    return NextResponse.json({ ok: false, error: "missing fields" }, { status: 400 });
  }

  let valid = false;
  try {
    valid = await verifyMessage({ address: address as Address, message: listingMessage(address), signature: signature as `0x${string}` });
  } catch { valid = false; }
  if (!valid) return NextResponse.json({ ok: false, error: "signature did not verify" }, { status: 401 });

  // Clamp the requested rate to the creator's unlocked bracket.
  const tierId = await allowedTierId(address as Address);
  const cap = bracketMax(tierId);
  const requested = Number(body.rate ?? 0.002);
  const rate = Math.min(cap, Math.max(0.0005, Number.isFinite(requested) ? requested : 0.002));

  const result = await updateListing(address, {
    listed: !!body.listed,
    category: body.category,
    tagline: body.tagline,
    streamUrl: body.streamUrl,
    rate,
  });
  if (!result.ok) return NextResponse.json(result, { status: 409 });
  return NextResponse.json({ ok: true, profile: result.profile, allowedTier: tierId, cap });
}
