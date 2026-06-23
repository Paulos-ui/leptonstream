"use client";

import LenisProvider from "@/components/providers/LenisProvider";
import StreamBackground from "@/components/stream/StreamBackground";
import ProgressGauge from "@/components/ui/ProgressGauge";

export default function LandingShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <StreamBackground />
      <ProgressGauge />
      <LenisProvider>
        <div className="relative z-10">{children}</div>
      </LenisProvider>
    </>
  );
}
