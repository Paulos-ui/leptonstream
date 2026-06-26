import { NextRequest, NextResponse } from "next/server";
import { resolveProfile, getReferralCount, referralEarningsUsd } from "@/lib/profiles";
import { earnedUsd, recentTransfers } from "@/lib/gateway-read";
import { tierFor } from "@/lib/badge";

export const runtime = "nodejs";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS" };
export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params;
  const profile = await resolveProfile(handle);

  // A profile may not exist yet (no username claimed) but the address can still
  // have earnings — support raw-address profiles too.
  const address = profile?.address ?? (/^0x[a-fA-F0-9]{40}$/.test(handle) ? handle.toLowerCase() : null);
  if (!address) {
    return NextResponse.json({ error: "not found" }, { status: 404, headers: CORS });
  }

  const [earned, transfers, referrals, referralEarnings] = await Promise.all([
    earnedUsd(address),
    recentTransfers(address),
    getReferralCount(address),
    referralEarningsUsd(address),
  ]);

  const supporters = new Set(transfers.map((t) => t.from.toLowerCase())).size;
  const tier = tierFor(earned);

  return NextResponse.json(
    {
      address,
      username: profile?.username ?? null,
      createdAt: profile?.createdAt ?? null,
      referredBy: profile?.referredBy ?? null,
      earnedUsd: earned,
      supporters,
      referrals,
      referralEarnings,
      tier,
      recent: transfers.slice(0, 8),
      listed: profile?.listed ?? false,
      category: profile?.category ?? null,
      tagline: profile?.tagline ?? "",
      streamUrl: profile?.streamUrl ?? "",
      rate: profile?.rate ?? null,
    },
    { headers: CORS }
  );
}
