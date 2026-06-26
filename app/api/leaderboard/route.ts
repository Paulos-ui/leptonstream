import { NextResponse } from "next/server";
import { getAllProfileAddresses, getProfileByAddress } from "@/lib/profiles";
import { earnedUsd } from "@/lib/gateway-read";
import { tierFor } from "@/lib/badge";

export const runtime = "nodejs";
const CORS = { "Access-Control-Allow-Origin": "*" };

export async function GET() {
  const addresses = (await getAllProfileAddresses()).slice(0, 50);
  const rows = await Promise.all(
    addresses.map(async (address) => {
      const [profile, earned] = await Promise.all([getProfileByAddress(address), earnedUsd(address)]);
      return {
        address,
        username: profile?.username ?? null,
        earnedUsd: earned,
        tier: tierFor(earned),
      };
    })
  );
  rows.sort((a, b) => b.earnedUsd - a.earnedUsd);
  return NextResponse.json({ leaders: rows.slice(0, 25) }, { headers: CORS });
}
