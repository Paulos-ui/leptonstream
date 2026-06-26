import { NextResponse } from "next/server";
import { getListedProfiles } from "@/lib/profiles";
import { earnedUsd } from "@/lib/gateway-read";
import { tierFor } from "@/lib/badge";
import { getStatus, normalizeServer } from "@/lib/owncast";

export const runtime = "nodejs";
const CORS = { "Access-Control-Allow-Origin": "*" };

function isOwncast(url?: string) {
  return !!url && !/youtube\.com|youtu\.be|\.mp4|\.m3u8|\.webm/i.test(url);
}

export async function GET() {
  const listed = await getListedProfiles();

  const rows = await Promise.all(
    listed.map(async (p) => {
      const earned = await earnedUsd(p.address);
      let live: boolean | null = null;
      let viewers = 0;
      if (isOwncast(p.streamUrl)) {
        try {
          const st = await getStatus(normalizeServer(p.streamUrl!));
          live = !!st?.online;
          viewers = st?.viewerCount ?? 0;
        } catch { live = null; }
      }
      return {
        address: p.address,
        username: p.username,
        category: p.category ?? "Talk",
        tagline: p.tagline ?? "",
        streamUrl: p.streamUrl ?? "",
        rate: p.rate ?? 0.002,
        earnedUsd: earned,
        tier: tierFor(earned),
        live,
        viewers,
      };
    })
  );

  // live first, then by earnings
  rows.sort((a, b) => Number(!!b.live) - Number(!!a.live) || b.earnedUsd - a.earnedUsd);
  return NextResponse.json({ creators: rows }, { headers: CORS });
}
