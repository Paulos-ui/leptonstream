"use client";

import dynamic from "next/dynamic";

// three.js touches `window`, so the canvas must never render on the server.
const StreamCanvas = dynamic(() => import("./StreamCanvas"), { ssr: false });

export default function StreamBackground() {
  return <StreamCanvas />;
}
