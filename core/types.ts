export type AgentState =
  | "idle"
  | "streaming"
  | "watching"
  | "throttled"
  | "recovering"
  | "paused"
  | "ceiling_reached"
  | "stopped";

export interface SessionConfig {
  sessionId: string;
  payer: string; // viewer wallet address
  payee: string; // creator wallet address
  rateUnitsPerSec: number; // full per-second rate, in USDC base units
  ceilingUnits: number; // hard maximum the agent may ever authorize
  batchThresholdUnits: number; // settle once this much value has accrued
  lowQuality?: number; // throttle trips below this (default 0.52)
  highQuality?: number; // resume full rate above this (default 0.72)
  throttledFactor?: number; // rate multiplier while throttled (default 0.3)
}

export interface PaymentBatch {
  sessionId: string;
  seq: number;
  payer: string;
  payee: string;
  cumulativeUnits: number; // total authorized through this batch
  incrementUnits: number; // value settled in this batch
  createdAt: number;
}

export interface SettlementResult {
  ok: boolean;
  txHash?: string;
  settledUnits: number;
  error?: string;
}

export type AgentEvent =
  | {
      type: "tick";
      seconds: number;
      spentUnits: number;
      effectiveRate: number;
      quality: number;
      state: AgentState;
    }
  | { type: "state"; state: AgentState; reason: string }
  | { type: "batch"; batch: PaymentBatch; result: SettlementResult }
  | { type: "ceiling"; spentUnits: number }
  | { type: "error"; message: string };
