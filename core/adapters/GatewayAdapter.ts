import type { GatewayClient } from "@circle-fin/x402-batching/client";
import type { SettlementAdapter } from "./SettlementAdapter";
import type { PaymentBatch, SettlementResult } from "../types";

/**
 * Real settlement via Circle Gateway nanopayments.
 *
 * Each agent batch becomes one `client.pay()` against the streamer's metered
 * endpoint: the SDK does the 402 handshake, signs an EIP-3009 authorization
 * offchain (gasless), and the facilitator settles it in batches on Arc. The
 * agent never knows the difference between this and the mock.
 */
export class GatewayAdapter implements SettlementAdapter {
  readonly name = "gateway";

  constructor(
    private client: GatewayClient,
    /** Builds the metered URL for a given increment (in USDC base units). */
    private resourceUrl: (units: number) => string
  ) {}

  async settle(batch: PaymentBatch): Promise<SettlementResult> {
    try {
      const res = (await this.client.pay(
        this.resourceUrl(batch.incrementUnits)
      )) as { status: number; data?: { tx?: string; transaction?: string } };

      const ok = res.status >= 200 && res.status < 300;
      if (!ok) {
        return { ok: false, settledUnits: 0, error: `status ${res.status}` };
      }
      return {
        ok: true,
        settledUnits: batch.incrementUnits,
        txHash: res.data?.tx ?? res.data?.transaction,
      };
    } catch (e) {
      return { ok: false, settledUnits: 0, error: (e as Error).message };
    }
  }
}
