import type { SettlementAdapter } from "./SettlementAdapter";
import type { PaymentBatch, SettlementResult } from "../types";

export interface MockOptions {
  latencyMs?: number;
  /** Inject a transient failure on every Nth settle call (0 = never). */
  failEveryN?: number;
}

/**
 * Deterministic settlement for demos and local dev. Always available, no
 * network, no keys. Produces a stable fake tx hash per batch so the UI can
 * render a "view on explorer" link in mock mode too.
 */
export class MockAdapter implements SettlementAdapter {
  readonly name = "mock";
  private calls = 0;

  constructor(private opts: MockOptions = {}) {}

  async settle(batch: PaymentBatch): Promise<SettlementResult> {
    const { latencyMs = 120, failEveryN = 0 } = this.opts;
    await delay(latencyMs);
    this.calls++;

    if (failEveryN && this.calls % failEveryN === 0) {
      return {
        ok: false,
        settledUnits: 0,
        error: "mock transient RPC error (Unknown block) — recoverable",
      };
    }

    const txHash =
      "0x" + fnv(`${batch.sessionId}:${batch.seq}:${batch.cumulativeUnits}`);
    return { ok: true, txHash, settledUnits: batch.incrementUnits };
  }
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function fnv(s: string): string {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(16).padStart(8, "0").repeat(8).slice(0, 64);
}
