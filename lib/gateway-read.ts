import { formatUnits } from "viem";
import { ARC } from "./arc";

export function toDecimal(x: unknown): string {
  if (x == null) return "0";
  const s = String(x);
  if (s.includes(".")) return s;
  try {
    return formatUnits(BigInt(s), 6);
  } catch {
    return "0";
  }
}

export async function gatewayBalance(addr: string) {
  try {
    const res = await fetch(`${ARC.gatewayApi}/balances`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "USDC", sources: [{ depositor: addr, domain: ARC.domain }] }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    const b = data?.balances?.[0];
    return {
      available: toDecimal(b?.balance),
      withdrawing: toDecimal(b?.withdrawing),
      withdrawable: toDecimal(b?.withdrawable),
    };
  } catch {
    return { available: "0", withdrawing: "0", withdrawable: "0" };
  }
}

export interface Transfer {
  id: string;
  from: string;
  amount: string;
  createdAt: string;
  tx?: string;
}

export async function recentTransfers(addr: string): Promise<Transfer[]> {
  try {
    const url = `${ARC.gatewayApi}/x402/transfers?to=${addr}&network=eip155:${ARC.chainId}&pageSize=50`;
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    return (data?.transfers ?? []).map(
      (t: { id: string; fromAddress: string; amount: string; createdAt: string; transactionHash?: string }) => ({
        id: t.id,
        from: t.fromAddress,
        amount: t.amount,
        createdAt: t.createdAt,
        tx: t.transactionHash,
      })
    );
  } catch {
    return [];
  }
}

/** Total received from settlements (sum of incoming x402 transfers), USD. */
export async function receivedTotalUsd(addr: string): Promise<number> {
  const t = await recentTransfers(addr);
  return t.reduce((s, x) => s + Number(x.amount) / 1e6, 0);
}

/** A creator's earnings, USD. Prefer received settlements; fall back to the
 *  Gateway balance in case settlements credit the balance rather than the
 *  transfers feed. This is what the profile, tier, and badge all read. */
export async function earnedUsd(addr: string): Promise<number> {
  const received = await receivedTotalUsd(addr);
  if (received > 0) return received;
  const b = await gatewayBalance(addr);
  return parseFloat(b.available) + parseFloat(b.withdrawing) + parseFloat(b.withdrawable);
}
