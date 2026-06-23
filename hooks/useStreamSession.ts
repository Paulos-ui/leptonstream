"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Hex } from "viem";
import { PaymentAgent } from "@/core/PaymentAgent";
import { MockAdapter } from "@/core/adapters/MockAdapter";
import { GatewayAdapter } from "@/core/adapters/GatewayAdapter";
import type { AgentState } from "@/core/types";
import { usdc } from "@/core/money";
import { makeClient } from "@/lib/wallet";

export interface SessionOpts {
  creator: string;
  ratePerSecUsd: number;
  ceilingUsd: number;
  demo: boolean;
  privateKey: Hex | null;
  quality: number; // current effective quality (real signal, possibly overridden)
}

export interface Settled {
  seq: number;
  units: number;
  tx?: string;
}

export function useStreamSession(opts: SessionOpts) {
  const [state, setState] = useState<AgentState>("idle");
  const [spentUnits, setSpent] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [reason, setReason] = useState("");
  const [log, setLog] = useState<{ t: number; line: string }[]>([]);
  const [settled, setSettled] = useState<Settled[]>([]);
  const [playing, setPlaying] = useState(false);

  const optsRef = useRef(opts);
  optsRef.current = opts;
  const agentRef = useRef<PaymentAgent | null>(null);
  const offRef = useRef<(() => void) | null>(null);

  const build = useCallback(async () => {
    const o = optsRef.current;
    const adapter = o.demo
      ? new MockAdapter({ latencyMs: 60, failEveryN: 6 })
      : new GatewayAdapter(
          await makeClient(o.privateKey as Hex),
          (units) => `${window.location.origin}/api/pay/${o.creator}?units=${units}`
        );
    const agent = new PaymentAgent(
      {
        sessionId: `${o.creator}-${Date.now()}`,
        payer: "viewer",
        payee: o.creator,
        rateUnitsPerSec: usdc(o.ratePerSecUsd),
        ceilingUnits: usdc(o.ceilingUsd),
        batchThresholdUnits: usdc(0.005),
      },
      adapter
    );
    offRef.current = agent.on((e) => {
      if (e.type === "state") {
        setState(e.state);
        setReason(e.reason);
        setLog((l) => [...l.slice(-6), { t: Math.round(agent.secondsMetered), line: e.reason }]);
      } else if (e.type === "tick") {
        setSpent(e.spentUnits);
        setSeconds(Math.round(e.seconds));
      } else if (e.type === "batch" && e.result.ok) {
        setSpent(agent.spentUnits);
        setSettled((s) => [...s, { seq: e.batch.seq, units: e.result.settledUnits, tx: e.result.txHash }]);
      } else if (e.type === "ceiling") {
        setSpent(e.spentUnits);
      }
    });
    agentRef.current = agent;
    return agent;
  }, []);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      void agentRef.current?.tick(1, optsRef.current.quality);
    }, 1000);
    return () => clearInterval(id);
  }, [playing]);

  useEffect(() => {
    return () => {
      offRef.current?.();
      void agentRef.current?.stop();
    };
  }, []);

  const start = useCallback(async () => {
    const agent = agentRef.current ?? (await build());
    agent.start();
    setPlaying(true);
  }, [build]);
  const pause = useCallback(() => {
    agentRef.current?.pause();
    setPlaying(false);
  }, []);
  const stop = useCallback(() => {
    void agentRef.current?.stop();
    setPlaying(false);
  }, []);

  return { state, spentUnits, seconds, reason, log, settled, playing, start, pause, stop };
}
