import type { AgentState } from "@/core/types";

export const STATE_COLOR: Record<AgentState, string> = {
  idle: "#8A8378",
  streaming: "#5E8F86", // verdigris — healthy
  watching: "#F6A92B", // amber — alert
  throttled: "#FF6B57", // coral — acting
  recovering: "#8B8BFA", // periwinkle — deliberating
  paused: "#8B8BFA",
  ceiling_reached: "#FF6B57",
  stopped: "#8A8378",
};

export const STATE_LABEL: Record<AgentState, string> = {
  idle: "Idle",
  streaming: "Streaming",
  watching: "Watching",
  throttled: "Throttled",
  recovering: "Recovering",
  paused: "Paused",
  ceiling_reached: "Ceiling reached",
  stopped: "Stopped",
};

export const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
