import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, isAddress, formatUnits, type Address } from "viem";
import { ARC } from "@/lib/arc";
import { GATEWAY_WALLET_ABI } from "@/lib/gateway-abi";

export const runtime = "nodejs";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

// GET /api/balance/0x... → live Gateway "available" (received) for a payee.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ addr: string }> }
) {
  const { addr } = await params;
  if (!isAddress(addr)) {
    return NextResponse.json({ error: "bad address" }, { status: 400, headers: CORS });
  }
  try {
    const client = createPublicClient({ transport: http(ARC.rpcUrl) });
    const v = (await client.readContract({
      address: ARC.gatewayWallet as Address,
      abi: GATEWAY_WALLET_ABI,
      functionName: "availableBalance",
      args: [ARC.usdc as Address, addr as Address],
    })) as bigint;
    return NextResponse.json(
      { address: addr, available: formatUnits(v, 6) },
      { headers: CORS }
    );
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message.split("\n")[0] },
      { status: 502, headers: CORS }
    );
  }
}
