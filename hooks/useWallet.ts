"use client";

import { useCallback, useEffect, useState } from "react";
import type { Address } from "viem";
import { getProvider, connectWallet, ensureArc, isOnArc, walletError, ARC_HEX } from "@/lib/connect";

const WKEY = "lepton.wallet.addr";

/**
 * One stable wallet connection for the whole session.
 *
 * On load we OPTIMISTICALLY restore the last connected address from
 * localStorage so a refresh never flashes back to "Connect" — then we reconcile
 * against the live provider (which injects after first paint, especially in
 * Brave). eth_accounts restores silently with no popup; we only drop the
 * session on an explicit disconnect event. Prompts happen on connect/sign only.
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

    // Optimistic restore — show the remembered account immediately.
    try {
      const remembered = localStorage.getItem(WKEY) as Address | null;
      if (remembered) {
        setAccount(remembered);
        setReady(true);
      }
    } catch {
      /* ignore */
    }

    const start = async (p: NonNullable<ReturnType<typeof getProvider>>) => {
      if (!alive) return;
      setHasProvider(true);

      const onAccounts = (...a: unknown[]) => {
        if (!alive) return;
        const a0 = ((a[0] as Address[]) ?? [])[0] ?? null;
        setAccount(a0);
        try {
          if (a0) localStorage.setItem(WKEY, a0);
          else localStorage.removeItem(WKEY); // explicit disconnect
        } catch {
          /* ignore */
        }
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
        const accts = (await p.request({ method: "eth_accounts" })) as Address[];
        if (alive && accts?.[0]) {
          setAccount(accts[0]);
          setError("");
          try { localStorage.setItem(WKEY, accts[0]); } catch { /* ignore */ }
        }
        if (alive) setChainOk(await isOnArc());
      } catch {
        /* keep optimistic */
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
      setError("");
      try { localStorage.setItem(WKEY, addr); } catch { /* ignore */ }
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

  // Never surface a connect error once we have an account.
  const visibleError = account ? "" : error;

  return { account, chainOk, connecting, hasProvider, ready, error: visibleError, connect, switchToArc };
}
