import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, isAddress, formatUnits, type Address } from "viem";
import { ARC } from "@/lib/arc";
import { ERC20_ABI } from "@/lib/gateway-abi";

export const runtime = "nodejs";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

// Authoritative Gateway balance (includes RECEIVED settlements) via Circle's
// Gateway API — the same source the SDK uses — plus on-chain wallet USDC.
// Read server-side so the browser never hits CORS on the Gateway API / RPC.
// The Gateway /balances endpoint returns amounts as base-unit integer strings
// (the SDK formats them separately). Normalize to a decimal USDC string here so
// the client can parseFloat directly. Defensive: if a value already looks
// decimal, pass it through unchanged.
function toDecimal(x: unknown): string {
  if (x == null) return "0";
  const s = String(x);
  if (s.includes(".")) return s;
  try {
    return formatUnits(BigInt(s), 6);
  } catch {
    return "0";
  }
}

async function gatewayBalance(addr: string) {
  const res = await fetch(`${ARC.gatewayApi}/balances`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: "USDC",
      sources: [{ depositor: addr, domain: ARC.domain }],
    }),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  const b = data?.balances?.[0];
  return {
    available: toDecimal(b?.balance),
    withdrawing: toDecimal(b?.withdrawing),
    withdrawable: toDecimal(b?.withdrawable),
  };
}

async function walletUsdc(addr: Address) {
  try {
    const client = createPublicClient({ transport: http(ARC.rpcUrl) });
    const v = (await client.readContract({
      address: ARC.usdc as Address,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [addr],
    })) as bigint;
    return formatUnits(v, 6);
  } catch {
    return "0";
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ addr: string }> }
) {
  const { addr } = await params;
  if (!isAddress(addr)) {
    return NextResponse.json({ error: "bad address" }, { status: 400, headers: CORS });
  }
  try {
    const [gw, w] = await Promise.all([gatewayBalance(addr), walletUsdc(addr as Address)]);
    return NextResponse.json(
      { address: addr, walletUsdc: w, ...gw },
      { headers: CORS }
    );
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message.split("\n")[0], available: "0", withdrawing: "0", withdrawable: "0", walletUsdc: "0" },
      { status: 200, headers: CORS }
    );
  }
}
