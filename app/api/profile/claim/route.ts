import { NextRequest, NextResponse } from "next/server";
import { verifyMessage, isAddress, type Address } from "viem";
import { claimUsername } from "@/lib/profiles";
import { claimMessage } from "@/lib/claim-message";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { address?: string; username?: string; signature?: string; ref?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad request" }, { status: 400 });
  }

  const { address, username, signature, ref } = body;
  if (!address || !isAddress(address) || !username || !signature) {
    return NextResponse.json({ ok: false, error: "missing fields" }, { status: 400 });
  }

  // Prove the caller controls the address before granting the username.
  let valid = false;
  try {
    valid = await verifyMessage({
      address: address as Address,
      message: claimMessage(username, address),
      signature: signature as `0x${string}`,
    });
  } catch {
    valid = false;
  }
  if (!valid) {
    return NextResponse.json({ ok: false, error: "signature did not verify" }, { status: 401 });
  }

  const result = await claimUsername(address, username, ref);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 409 });
  }
  return NextResponse.json({ ok: true, profile: result.profile });
}
