"use client";

import { useCallback, useEffect, useState } from "react";
import type { Address } from "viem";
import { getProvider, connectWallet, ensureArc, isOnArc, walletError, ARC_HEX } from "@/lib/connect";

/**
 * One stable wallet connection for the whole session.
 *
 * Wallet extensions (notably in Brave) inject window.ethereum *after* first
 * paint, so we wait for it (event + short poll) before reading state. Once the
 * provider appears we silently restore the session via eth_accounts (no popup),
 * track account/chain via provider events, and only prompt on explicit connect.
 * `ready` flips true once restore finishes (or no wallet is found), so the UI
 * shows a brief "restoring" state instead of flashing "Connect" then jumping in.
 */
export function useWallet() {
  const [account, setAccount] = useState<Address | null>(null);
  const [chainOk, setChainOk] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [hasProvider, setHasProvider] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    let detach = () => {};
    let stopWaiting = () => {};

    const start = async (p: NonNullable<ReturnType<typeof getProvider>>) => {
      if (!alive) return;
      setHasProvider(true);

      const onAccounts = (...a: unknown[]) => {
        if (alive) setAccount(((a[0] as Address[]) ?? [])[0] ?? null);
      };
      const onChain = (...a: unknown[]) => {
        if (alive) setChainOk((a[0] as string)?.toLowerCase?.() === ARC_HEX.toLowerCase());
      };
      p.on?.("accountsChanged", onAccounts);
      p.on?.("chainChanged", onChain);
      detach = () => {
        p.removeListener?.("accountsChanged", onAccounts);
        p.removeListener?.("chainChanged", onChain);
      };

      try {
        const accts = (await p.request({ method: "eth_accounts" })) as Address[]; // no prompt
        if (alive && accts?.[0]) setAccount(accts[0]);
        if (alive) setChainOk(await isOnArc());
      } catch {
        /* ignore */
      } finally {
        if (alive) setReady(true);
      }
    };

    const existing = getProvider();
    if (existing) {
      void start(existing);
    } else {
      let tries = 0;
      const tick = () => {
        const p = getProvider();
        if (p) {
          stopWaiting();
          void start(p);
        } else if (++tries > 30) {
          // ~3s with no injected provider → genuinely no wallet
          stopWaiting();
          if (alive) setReady(true);
        }
      };
      const id = setInterval(tick, 100);
      const onInit = () => tick();
      window.addEventListener("ethereum#initialized", onInit);
      stopWaiting = () => {
        clearInterval(id);
        window.removeEventListener("ethereum#initialized", onInit);
      };
    }

    return () => {
      alive = false;
      stopWaiting();
      detach();
    };
  }, []);

  const connect = useCallback(async () => {
    setError("");
    setConnecting(true);
    try {
      const addr = await connectWallet();
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

  return { account, chainOk, connecting, hasProvider, ready, error, connect, switchToArc };
}
