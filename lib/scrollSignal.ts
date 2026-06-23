/**
 * scrollSignal
 *
 * A single mutable object that carries *presentation* scroll state to the
 * WebGL stream. It is deliberately NOT React state: the canvas reads it every
 * frame inside useFrame, and writing React state 60×/sec would thrash renders.
 *
 * Financial / simulation truth lives in the Zustand store (lib/store.ts).
 * Presentation truth lives here. The two never mix — that separation is what
 * keeps the stream buttery.
 */
export const scrollSignal = {
  /** Global scroll progress through the whole document, 0..1. */
  progress: 0,
  /** Normalized scroll velocity, 0..1. Drives emission "pumping" in the hero. */
  velocity: 0,
  /** Local progress through the QuantumZoom act, 0..1. Drives continuous→discrete. */
  zoom: 0,
  /** Agent presence, 0..1. Cools the stream toward periwinkle in the agent act. */
  agent: 0,
  /** Agent throttle, 0..1. Slows and dims the flow when quality drops. */
  throttle: 0,
  /** Simulated stream quality, 0..1 (consumed by the HUD; informational). */
  quality: 1,
  /** Timestamp (ms) of the last committed agent decision — drives the pulse flash. */
  pulseAt: 0,
  /** Instrument focus, 0..1. Narrows the flow into a measured beam (Act 2). */
  focus: 0,
  /** Finale rate, 0..1, set by the CTA slider. 0.5 = neutral intensity. */
  rate: 0.5,
};

export type ScrollSignal = typeof scrollSignal;
