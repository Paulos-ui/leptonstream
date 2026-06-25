import { NextRequest, NextResponse } from "next/server";
import {
  createPublicClient, http, isAddress, type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ARC } from "@/lib/arc";
import { BADGE_ABI } from "@/lib/badge-abi";
import { earnedUsd } from "@/lib/gateway-read";
import { tierFor } from "@/lib/badge";

export const runtime = "nodejs";

const BADGE = process.env.NEXT_PUBLIC_BADGE_ADDRESS as Address | undefined;
const ATTESTER = process.env.ATTESTER_PRIVATE_KEY as `0x${string}` | undefined;

// GET /api/badge/attest/0x... → { tier, configured, nonce?, signature? }
// The client takes (tier, signature) to LeptonBadge.claim(tier, sig).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;
  if (!isAddress(address)) {
    return NextResponse.json({ error: "bad address" }, { status: 400 });
  }

  const earned = await earnedUsd(address);
  const tier = tierFor(earned);

  if (!BADGE || !ATTESTER) {
    return NextResponse.json({ configured: false, tier });
  }
  if (tier.id === 0) {
    return NextResponse.json({ configured: true, tier, error: "no tier earned yet" });
  }

  try {
    const client = createPublicClient({ transport: http(ARC.rpcUrl) });
    const nonce = (await client.readContract({
      address: BADGE,
      abi: BADGE_ABI,
      functionName: "nonces",
      args: [address as Address],
    })) as bigint;

    const account = privateKeyToAccount(ATTESTER);
    const signature = await account.signTypedData({
      domain: { name: "LeptonBadge", version: "1", chainId: ARC.chainId, verifyingContract: BADGE },
      types: {
        Claim: [
          { name: "to", type: "address" },
          { name: "tier", type: "uint8" },
          { name: "nonce", type: "uint256" },
        ],
      },
      primaryType: "Claim",
      message: { to: address as Address, tier: tier.id, nonce },
    });

    return NextResponse.json({ configured: true, tier, nonce: nonce.toString(), signature });
  } catch (e) {
    return NextResponse.json({ configured: true, tier, error: (e as Error).message.split("\n")[0] }, { status: 200 });
  }
}
