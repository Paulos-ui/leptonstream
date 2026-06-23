"use client";

import { useEffect, useRef } from "react";

/**
 * A live value counter that updates the DOM directly in a RAF loop instead of
 * via React state — the proven pattern for jitter-free 60fps numbers. The
 * digits use tabular figures so the width never reflows as it climbs.
 */
export default function Counter({
  ratePerSec,
  prefix = "$",
  decimals = 6,
}: {
  ratePerSec: number;
  prefix?: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const zero = `${prefix}0.${"0".repeat(decimals)}`;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduce) {
      node.textContent = zero;
      return;
    }

    let total = 0;
    let last = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      total += ratePerSec * dt;
      node.textContent = prefix + total.toFixed(decimals);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [ratePerSec, prefix, decimals, zero]);

  return (
    <span ref={ref} className="tabular-nums">
      {zero}
    </span>
  );
}
