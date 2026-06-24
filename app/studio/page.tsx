"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  fetchBalances, fetchTransfers, initiateWithdraw, finalizeWithdraw, walletError,
  type Incoming,
} from "@/lib/connect";
import { useWallet } from "@/hooks/useWallet";
import { normalizeServer } from "@/lib/owncast";
import DashboardHeader from "@/components/studio/DashboardHeader";
import EarningsHero from "@/components/studio/EarningsHero";
import ValuePipeline from "@/components/studio/ValuePipeline";
import SupportFeed from "@/components/studio/SupportFeed";
import StreamSetup from "@/components/studio/StreamSetup";

export default function DashboardPage() {
  const { account, chainOk, connecting, connect, switchToArc, ready, error: connErr } = useWallet();
  const [origin, setOrigin] = useState("");
  const [server, setServer] = useState("");
  const [available, setAvailable] = useState(0);
  const [maturing, setMaturing] = useState(0);
  const [withdrawable, setWithdrawable] = useState(0);
  const [feed, setFeed] = useState<Incoming[]>([]);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState("");
  const [setupOpen, setSetupOpen] = useState(false);

  useEffect(() => setOrigin(window.location.origin), []);

  const srv = server.trim() ? normalizeServer(server) : "";
  const supportLink = account ? `${origin}/watch/${account}${srv ? `?server=${encodeURIComponent(srv)}` : ""}` : "";
  const snippet = account
    ? `<script src="${origin}/embed.js" data-payee="${account}"${srv ? ` data-server="${srv}"` : ""}></script>`
    : "";

  const refresh = useCallback(async () => {
    if (!account) return;
    try {
      const [b, t] = await Promise.all([fetchBalances(account), fetchTransfers(account)]);
      setAvailable(parseFloat(b.available));
      setMaturing(parseFloat(b.withdrawing));
      setWithdrawable(parseFloat(b.withdrawable));
      setFeed(t);
    } catch { /* non-fatal */ }
  }, [account]);

  useEffect(() => {
    if (!account) return;
    void refresh();
    const id = setInterval(() => void refresh(), 6000);
    return () => clearInterval(id);
  }, [account, refresh]);

  const onInitiate = async () => {
    if (!account || !(available > 0)) return;
    setBusy("initiate"); setErr("");
    try { await initiateWithdraw(account, available.toString()); await refresh(); }
    catch (e) { setErr(walletError(e)); } finally { setBusy(""); }
  };
  const onFinalize = async () => {
    if (!account) return;
    setBusy("finalize"); setErr("");
    try { await finalizeWithdraw(account); await refresh(); }
    catch (e) { setErr(walletError(e)); } finally { setBusy(""); }
  };
  const copy = async (text: string, which: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(which); setTimeout(() => setCopied(""), 1500);
  };

  const supporters = new Set(feed.map((t) => t.from.toLowerCase())).size;

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <motion.span
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          className="font-mono text-[11px] uppercase tracking-eyebrow text-cream/40"
        >
          restoring session…
        </motion.span>
      </main>
    );
  }

  if (!account) {
    return (
      <motion.main
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
        className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6"
      >
        <span className="font-mono text-[11px] uppercase tracking-eyebrow text-amber/80">creator dashboard</span>
        <h1 className="mt-3 font-serif text-5xl leading-tight text-cream">Get paid by the second on the stream you already run.</h1>
        <p className="mt-4 max-w-lg text-cream/55">Connect the wallet you want earnings to settle to. It becomes your payee address — self-custody, no account, no middleman.</p>
        <motion.button
          whileTap={{ scale: 0.97 }} onClick={() => void connect()} disabled={connecting}
          className="mt-8 w-fit rounded-full bg-amber px-7 py-3 font-mono text-sm text-ink disabled:opacity-50"
        >
          {connecting ? "connecting…" : "Connect wallet"}
        </motion.button>
        {connErr && <p className="mt-4 font-mono text-[11px] text-coral/80">{connErr}</p>}
      </motion.main>
    );
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="min-h-screen px-5 pb-24 pt-24 sm:px-8 lg:px-16"
    >
      <div className="mx-auto max-w-5xl">
        <DashboardHeader account={account} chainOk={chainOk} onSwitch={() => void switchToArc()} />
        <EarningsHero available={available} totalInGateway={available + maturing + withdrawable} supporters={supporters} />
        <ValuePipeline
          available={available} maturing={maturing} withdrawable={withdrawable}
          busy={busy} onInitiate={onInitiate} onFinalize={onFinalize} error={err}
        />
        <SupportFeed feed={feed} />
        <StreamSetup
          origin={origin} server={server} setServer={setServer}
          snippet={snippet} supportLink={supportLink}
          copy={copy} copied={copied} open={setupOpen} setOpen={setSetupOpen}
        />
      </div>
    </motion.main>
  );
}
