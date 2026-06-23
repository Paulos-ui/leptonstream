import { create } from "zustand";

/**
 * The financial / simulation truth of the stream.
 * Phase 1 only needs the per-second rate (the hero counter consumes it).
 * Later phases will add: budget ceiling, total spent, agent state, quality.
 */
interface StreamState {
  /** Cost charged per second of stream, in USDC. */
  ratePerSec: number;
  setRate: (rate: number) => void;
}

export const useStreamStore = create<StreamState>((set) => ({
  ratePerSec: 0.000124,
  setRate: (ratePerSec) => set({ ratePerSec }),
}));
