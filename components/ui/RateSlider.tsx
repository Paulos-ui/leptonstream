"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { scrollSignal } from "@/lib/scrollSignal";
import { useStreamStore } from "@/lib/store";

const MIN_RATE = 0.00004;
const MAX_RATE = 0.0004;

function rateFor(v: number) {
  return MIN_RATE + (MAX_RATE - MIN_RATE) * v;
}

export default function RateSlider({
  onChange,
}: {
  onChange?: (rate: number, v: number) => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(0.5);
  const dragging = useRef(false);
  const setRate = useStreamStore((s) => s.setRate);

  const apply = useCallback(
    (v: number) => {
      const clamped = Math.max(0, Math.min(1, v));
      setValue(clamped);
      const rate = rateFor(clamped);
      setRate(rate); // financial truth
      scrollSignal.rate = clamped; // presentation truth (stream intensity)
      onChange?.(rate, clamped);
    },
    [onChange, setRate]
  );

  const fromClientX = useCallback(
    (clientX: number) => {
      const el = track.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      apply((clientX - rect.left) / rect.width);
    },
    [apply]
  );

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (dragging.current) fromClientX(e.clientX);
    };
    const up = () => (dragging.current = false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [fromClientX]);

  // Initialize the stream intensity on mount.
  useEffect(() => {
    apply(0.5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      apply(value + 0.04);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      apply(value - 0.04);
    }
  };

  return (
    <div
      ref={track}
      onPointerDown={(e) => {
        dragging.current = true;
        fromClientX(e.clientX);
      }}
      className="relative h-12 cursor-pointer touch-none select-none"
    >
      {/* track */}
      <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-cream/15" />
      {/* fill */}
      <div
        className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-gradient-to-r from-amber to-coral"
        style={{ width: `${value * 100}%` }}
      />
      {/* handle */}
      <div
        role="slider"
        tabIndex={0}
        aria-label="Per-second rate"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value * 100)}
        onKeyDown={onKey}
        className="absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-coral bg-ink shadow-[0_0_24px_rgba(255,107,87,0.5)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-cream/60 active:scale-110"
        style={{ left: `${value * 100}%` }}
      />
    </div>
  );
}
