import type { PaymentBatch, SettlementResult } from "../types";

/**
 * Everything that moves money goes through this one interface.
 * Implementations: MockAdapter (demo-proof), X402Adapter (real Circle/x402),
 * and optionally an EscrowAdapter (our own Arc contract).
 *
 * The agent is written entirely against this interface, so swapping Mock for
 * real settlement is a one-line change and never touches the agent logic.
 */
export interface SettlementAdapter {
  readonly name: string;
  settle(batch: PaymentBatch): Promise<SettlementResult>;
}
