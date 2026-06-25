"use client";

import { useCallback, useEffect, useState } from "react";
import type { Address } from "viem";
import {
  getProvider, connectWallet, ensureArc, isOnArc, walletError,
  silentReconnect, ARC_HEX,
} from "@/lib/connect";

const WKEY = "lepton.wallet.addr";

/**
 * One stable wallet connection for the whole session.
 *
 * On load we optimistically restore the last address from localStorage (so a
 * refresh never flashes "Connect"), then silently reconcile against the live
 * provider — pinning whichever wallet actually holds the account so every later
 * transaction uses the same one. We treat an empty accountsChanged as a LOCK,
 * not a disconnect: the session is only cleared when the user explicitly
 * disconnects from this app, so a locked wallet doesn't kick them out.
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

    try {
      const remembered = localStorage.getItem(WKEY) as Address | null;
      if (remembered) { setAccount(remembered); setReady(true); }
    } catch { /* ignore */ }

    const start = async (p: NonNullable<ReturnType<typeof getProvider>>) => {
      if (!alive) return;
      setHasProvider(true);

      const onAccounts = (...a: unknown[]) => {
        if (!alive) return;
        const next = ((a[0] as Address[]) ?? [])[0] ?? null;
        // Empty = wallet locked or site-level event — keep the session.
        if (!next) return;
        setAccount(next);
        try { localStorage.setItem(WKEY, next); } catch { /* ignore */ }
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
        const addr = await silentReconnect(); // pins the provider holding the account
        if (alive && addr) {
          setAccount(addr);
          setError("");
          try { localStorage.setItem(WKEY, addr); } catch { /* ignore */ }
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
        if (p) { stopWaiting(); void start(p); }
        else if (++tries > 30) { stopWaiting(); if (alive) setReady(true); }
      };
      const id = setInterval(tick, 100);
      const onInit = () => tick();
      window.addEventListener("ethereum#initialized", onInit);
      stopWaiting = () => {
        clearInterval(id);
        window.removeEventListener("ethereum#initialized", onInit);
      };
    }

    return () => { alive = false; stopWaiting(); detach(); };
  }, []);

  const connect = useCallback(async () => {
    setError("");
    setConnecting(true);
    try {
      const addr = await connectWallet(); // pins the authorizing provider
      setAccount(addr);
      setError("");
      try { localStorage.setItem(WKEY, addr); } catch { /* ignore */ }
      try { await ensureArc(); setChainOk(true); }
      catch { setChainOk(await isOnArc()); }
    } catch (e) {
      setError(walletError(e));
    } finally {
      setConnecting(false);
    }
  }, []);

  const switchToArc = useCallback(async () => {
    setError("");
    try { await ensureArc(); setChainOk(true); }
    catch (e) { setError(walletError(e)); }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    setChainOk(false);
    try { localStorage.removeItem(WKEY); } catch { /* ignore */ }
  }, []);

  const visibleError = account ? "" : error;

  return { account, chainOk, connecting, hasProvider, ready, error: visibleError, connect, switchToArc, disconnect };
}
