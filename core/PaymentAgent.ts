import type {
  AgentEvent,
  AgentState,
  PaymentBatch,
  SessionConfig,
} from "./types";
import type { SettlementAdapter } from "./adapters/SettlementAdapter";

type Decision = "FULL" | "THROTTLE";

/**
 * The viewer's Payment Agent.
 *
 * Money model (the key invariant): three running totals.
 *   accrued    — value metered so far (float, sub-unit precise)
 *   dispatched — value placed into batches (settled OR awaiting retry)
 *   settled    — value confirmed on-chain
 * New batches only ever carry (floor(accrued) − dispatched), so a failed batch
 * sitting in the retry queue can never be double-counted.
 *
 * Safety: the ceiling is enforced here in code, and decisions are fully
 * deterministic. An LLM may narrate or flag anomalies, but it is never in the
 * path that authorizes a transfer.
 */
export class PaymentAgent {
  private cfg: Required<SessionConfig>;
  private adapter: SettlementAdapter;
  private listeners = new Set<(e: AgentEvent) => void>();

  private state: AgentState = "idle";
  private committed: Decision = "FULL";

  private accrued = 0;
  private dispatched = 0;
  private settled = 0;
  private seconds = 0;
  private seq = 0;

  private active = false;
  private settling = false;
  private retryQueue: PaymentBatch[] = [];

  constructor(cfg: SessionConfig, adapter: SettlementAdapter) {
    this.adapter = adapter;
    this.cfg = {
      lowQuality: 0.52,
      highQuality: 0.72,
      throttledFactor: 0.3,
      ...cfg,
    };
  }

  // ---- public surface -----------------------------------------------------

  on(fn: (e: AgentEvent) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  get currentState(): AgentState {
    return this.state;
  }
  get spentUnits(): number {
    return this.settled;
  }
  get pendingUnits(): number {
    return Math.floor(this.accrued) - this.dispatched;
  }
  get inFlightUnits(): number {
    return this.dispatched - this.settled;
  }
  get secondsMetered(): number {
    return this.seconds;
  }
  get running(): boolean {
    return this.active;
  }

  start(): void {
    if (this.state !== "idle" && this.state !== "paused") return;
    this.active = true;
    this.setState("streaming", "stream started · metering per second");
  }

  pause(): void {
    if (!this.active) return;
    this.active = false;
    this.setState("paused", "viewer paused · metering stopped");
    void this.flush();
  }

  resume(): void {
    if (this.state !== "paused") return;
    this.active = true;
    this.setState("streaming", "resumed · metering per second");
  }

  async stop(): Promise<void> {
    this.active = false;
    await this.flush();
    await this.drainRetries();
    this.setState("stopped", "session ended · final settlement complete");
  }

  /** Advance the meter by dtSec at the given live quality signal (0..1). */
  async tick(dtSec: number, quality: number): Promise<void> {
    if (!this.active) return;

    this.decide(quality);
    const factor = this.committed === "THROTTLE" ? this.cfg.throttledFactor : 1;
    const effectiveRate = this.cfg.rateUnitsPerSec * factor;
    let inc = effectiveRate * dtSec;

    // Hard ceiling — enforced in code, never crossed.
    const remaining = this.cfg.ceilingUnits - this.accrued;
    if (inc >= remaining) {
      inc = Math.max(0, remaining);
      this.accrued += inc;
      this.seconds += dtSec;
      this.active = false;
      this.emit({
        type: "tick",
        seconds: this.seconds,
        spentUnits: this.settled,
        effectiveRate,
        quality,
        state: this.state,
      });
      await this.flush();
      this.setState("ceiling_reached", "ceiling reached · agent stopped spending");
      this.emit({ type: "ceiling", spentUnits: this.settled });
      return;
    }

    this.accrued += inc;
    this.seconds += dtSec;
    this.emit({
      type: "tick",
      seconds: this.seconds,
      spentUnits: this.settled,
      effectiveRate,
      quality,
      state: this.state,
    });

    if (this.pendingUnits >= this.cfg.batchThresholdUnits) {
      await this.flush();
    }
  }

  // ---- internals ----------------------------------------------------------

  // Hysteresis: commit a decision and hold it through the band — no flapping.
  private decide(quality: number): void {
    const { lowQuality, highQuality, throttledFactor } = this.cfg;
    if (this.committed === "FULL" && quality < lowQuality) {
      this.committed = "THROTTLE";
      this.setState(
        "throttled",
        `quality ${pct(quality)} below floor → throttle to ${throttledFactor}×`
      );
    } else if (this.committed === "THROTTLE" && quality > highQuality) {
      this.committed = "FULL";
      this.setState("streaming", `quality ${pct(quality)} restored → resume full rate`);
    } else if (this.committed === "FULL") {
      this.setState(
        quality < highQuality ? "watching" : "streaming",
        quality < highQuality ? "quality slipping · holding rate" : "stream healthy"
      );
    } else {
      this.setState(
        quality > lowQuality ? "recovering" : "throttled",
        quality > lowQuality
          ? "quality returning · easing back"
          : "rate cut · protecting ceiling"
      );
    }
  }

  private async flush(): Promise<void> {
    if (this.settling) return;
    const increment = this.pendingUnits;
    if (increment <= 0) {
      await this.drainRetries();
      return;
    }

    this.settling = true;
    const batch: PaymentBatch = {
      sessionId: this.cfg.sessionId,
      seq: ++this.seq,
      payer: this.cfg.payer,
      payee: this.cfg.payee,
      cumulativeUnits: this.dispatched + increment,
      incrementUnits: increment,
      createdAt: Date.now(),
    };
    this.dispatched += increment; // counted once, here

    try {
      const result = await this.adapter.settle(batch);
      if (result.ok) {
        this.settled += increment;
        this.emit({ type: "batch", batch, result });
      } else {
        this.retryQueue.push(batch);
        this.emit({
          type: "error",
          message: `settle failed (seq ${batch.seq}): ${result.error} · queued for retry`,
        });
      }
    } catch (e) {
      this.retryQueue.push(batch);
      this.emit({
        type: "error",
        message: `settle threw (seq ${batch.seq}): ${(e as Error).message}`,
      });
    } finally {
      this.settling = false;
    }

    await this.drainRetries();
  }

  private async drainRetries(maxAttempts = 4): Promise<void> {
    let attempt = 0;
    while (this.retryQueue.length && attempt < maxAttempts) {
      attempt++;
      await delay(150 * attempt); // linear backoff
      const batch = this.retryQueue[0];
      if (!batch) break;
      const result = await this.adapter.settle(batch);
      if (result.ok) {
        this.settled += batch.incrementUnits;
        this.retryQueue.shift();
        this.emit({ type: "batch", batch, result });
      }
    }
  }

  private setState(state: AgentState, reason: string): void {
    if (state === this.state) return;
    this.state = state;
    this.emit({ type: "state", state, reason });
  }

  private emit(e: AgentEvent): void {
    for (const fn of this.listeners) fn(e);
  }
}

const pct = (q: number) => `${Math.round(q * 100)}%`;
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
