import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";
import { ARC } from "@/lib/arc";

export const runtime = "nodejs";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

// GET /api/transfers/0x... → recent incoming x402 settlements for a payee.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ addr: string }> }
) {
  const { addr } = await params;
  if (!isAddress(addr)) {
    return NextResponse.json({ error: "bad address" }, { status: 400, headers: CORS });
  }
  try {
    const url =
      `${ARC.gatewayApi}/x402/transfers?to=${addr}` +
      `&network=eip155:${ARC.chainId}&pageSize=12`;
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    const transfers = (data?.transfers ?? []).map(
      (t: {
        id: string;
        status: string;
        fromAddress: string;
        amount: string;
        createdAt: string;
        transactionHash?: string;
      }) => ({
        id: t.id,
        status: String(t.status),
        from: t.fromAddress,
        amount: t.amount,
        createdAt: t.createdAt,
        tx: t.transactionHash,
      })
    );
    return NextResponse.json({ transfers }, { headers: CORS });
  } catch (e) {
    return NextResponse.json(
      { transfers: [], error: (e as Error).message.split("\n")[0] },
      { status: 200, headers: CORS }
    );
  }
}
