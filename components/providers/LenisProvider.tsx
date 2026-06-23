"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import { scrollSignal } from "@/lib/scrollSignal";

export default function LenisProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const lenis = new Lenis({
      lerp: reduce ? 1 : 0.1,
      smoothWheel: !reduce,
      wheelMultiplier: 1,
    });

    let raf = 0;
    const frame = (time: number) => {
      lenis.raf(time);
      // Decay velocity each frame so the "pump" fades when scrolling stops.
      scrollSignal.velocity *= 0.92;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    lenis.on(
      "scroll",
      (e: { scroll: number; limit: number; velocity: number }) => {
        const limit = e.limit || 1;
        scrollSignal.progress = e.scroll / limit;
        scrollSignal.velocity = Math.min(Math.abs(e.velocity) / 30, 1);
      }
    );

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
