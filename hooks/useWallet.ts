"use client";

import { useCallback, useEffect, useState } from "react";
import type { Address } from "viem";
import { getProvider, connectWallet, ensureArc, isOnArc, walletError, ARC_HEX } from "@/lib/connect";

/**
 * One wallet connection for the whole session. It reconnects silently on load
 * if the wallet already authorized us (no popup), tracks account/chain changes
 * via provider events, and only prompts when the user explicitly connects.
 * Signing prompts happen on actual transactions, never on navigation/clicks.
 */
export function useWallet() {
  const [account, setAccount] = useState<Address | null>(null);
  const [chainOk, setChainOk] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");

  // Silent reconnect + live account/chain tracking.
  useEffect(() => {
    const p = getProvider();
    if (!p) return;

    let alive = true;
    (async () => {
      try {
        const accts = (await p.request({ method: "eth_accounts" })) as Address[]; // no prompt
        if (alive && accts?.[0]) setAccount(accts[0]);
        if (alive) setChainOk(await isOnArc());
      } catch {
        /* ignore */
      }
    })();

    const onAccounts = (...a: unknown[]) => {
      const accts = a[0] as Address[];
      setAccount(accts?.[0] ?? null);
    };
    const onChain = (...a: unknown[]) => {
      const id = a[0] as string;
      setChainOk(id?.toLowerCase?.() === ARC_HEX.toLowerCase());
    };
    p.on?.("accountsChanged", onAccounts);
    p.on?.("chainChanged", onChain);
    return () => {
      alive = false;
      p.removeListener?.("accountsChanged", onAccounts);
      p.removeListener?.("chainChanged", onChain);
    };
  }, []);

  const connect = useCallback(async () => {
    setError("");
    setConnecting(true);
    try {
      const addr = await connectWallet(); // prompts once, also ensures Arc
      setAccount(addr);
      setChainOk(true);
    } catch (e) {
      setError(walletError(e));
    } finally {
      setConnecting(false);
    }
  }, []);

  const switchToArc = useCallback(async () => {
    setError("");
    try {
      await ensureArc();
      setChainOk(true);
    } catch (e) {
      setError(walletError(e));
    }
  }, []);

  return { account, chainOk, connecting, error, connect, switchToArc };
}
