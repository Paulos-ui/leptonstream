"use client";

import { useEffect, useRef, useState } from "react";

/** Smoothly animates a displayed number toward a target (ease-out cubic). */
export function useCountUp(target: number, durationMs = 700) {
  const [val, setVal] = useState(target);
  const raf = useRef(0);
  const from = useRef(target);
  useEffect(() => {
    from.current = val;
    const t0 = performance.now();
    cancelAnimationFrame(raf.current);
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / durationMs);
      const e = 1 - Math.pow(1 - k, 3);
      setVal(from.current + (target - from.current) * e);
      if (k < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs]);
  return val;
}
