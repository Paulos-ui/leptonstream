import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";
import { BatchFacilitatorClient } from "@circle-fin/x402-batching/server";
import { ARC } from "@/lib/arc";

export const runtime = "nodejs";

const facilitator = new BatchFacilitatorClient({ url: ARC.facilitatorUrl });

const MAX_UNITS = 1_000_000; // $1.00 per batch ceiling — abuse guard

function requirementsFor(payTo: string, units: number) {
  return {
    scheme: "exact",
    network: ARC.caip2,
    asset: ARC.usdc,
    amount: String(units),
    payTo,
    maxTimeoutSeconds: 604_900, // ≥ 7 days + buffer, per Gateway docs
    extra: {
      name: "GatewayWalletBatched",
      version: "1",
      verifyingContract: ARC.gatewayWallet,
    },
  };
}

// GatewayClient.pay() hits this twice: first unpaid (→ 402 + requirements),
// then with the signed authorization in the payment header (→ settle → 200).
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ stream: string }> }
) {
  const { stream: payTo } = await params;
  const units = Number(req.nextUrl.searchParams.get("units"));

  if (!isAddress(payTo)) {
    return NextResponse.json({ error: "bad payee address" }, { status: 400 });
  }
  if (!Number.isInteger(units) || units <= 0 || units > MAX_UNITS) {
    return NextResponse.json({ error: "bad units" }, { status: 400 });
  }

  const requirements = requirementsFor(payTo, units);

  const sig =
    req.headers.get("x-payment") ??
    req.headers.get("payment-signature") ??
    req.headers.get("payment");

  if (!sig) {
    const body = {
      x402Version: 2,
      resource: {
        url: req.nextUrl.pathname,
        description: "LeptonStream per-second viewing",
        mimeType: "application/json",
      },
      accepts: [requirements],
    };
    return new NextResponse(JSON.stringify({ accepts: [requirements] }), {
      status: 402,
      headers: {
        "content-type": "application/json",
        "PAYMENT-REQUIRED": Buffer.from(JSON.stringify(body)).toString("base64"),
      },
    });
  }

  try {
    const payload = JSON.parse(Buffer.from(sig, "base64").toString("utf8"));
    const settlement = await facilitator.settle(payload, requirements);
    if (!settlement.success) {
      return NextResponse.json(
        { error: settlement.errorReason ?? "settlement failed" },
        { status: 402 }
      );
    }
    return NextResponse.json({
      ok: true,
      tx: settlement.transaction,
      payer: settlement.payer,
      units,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message.split("\n")[0] }, { status: 402 });
  }
}
