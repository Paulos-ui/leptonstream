"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Hex } from "viem";
import { loadOrCreateKey, addressOf, makeClient, getFunds, type Funds } from "@/lib/wallet";
import { addrUrl, txUrl } from "@/lib/arc";
import { short } from "@/lib/format";

interface Incoming {
  id: string;
  from: string;
  amount: string;
  status: string;
  tx?: string;
}

export default function StudioPage() {
  const [pk, setPk] = useState<Hex | null>(null);
  const [address, setAddress] = useState("");
  const [funds, setFunds] = useState<Funds | null>(null);
  const [incoming, setIncoming] = useState<Incoming[]>([]);
  const [busy, setBusy] = useState("");
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    const key = loadOrCreateKey();
    setPk(key);
    setAddress(addressOf(key));
    setOrigin(window.location.origin);
  }, []);

  const shareLink = address ? `${origin}/watch/${address}` : "";

  const refresh = useMemo(
    () => async () => {
      if (!pk) return;
      setBusy("refresh");
      try {
        const client = await makeClient(pk);
        setFunds(await getFunds(client));
        try {
          const res = await client.searchTransfers({ to: addressOf(pk) as Hex });
          setIncoming(
            (res?.transfers ?? []).slice(0, 12).map((t) => ({
              id: t.id,
              from: t.fromAddress,
              amount: t.amount,
              status: String(t.status),
              tx: (t.transactionHash as string) ?? undefined,
            }))
          );
        } catch {
          /* transfer history optional */
        }
      } finally {
        setBusy("");
      }
    },
    [pk]
  );

  useEffect(() => {
    if (!pk) return;
    void refresh();
    const id = setInterval(() => void refresh(), 6000); // live earnings poll
    return () => clearInterval(id);
  }, [pk, refresh]);

  const onWithdraw = async () => {
    if (!pk || !funds) return;
    const amt = parseFloat(funds.gatewayAvailable);
    if (!(amt > 0)) return;
    setBusy("withdraw");
    try {
      const client = await makeClient(pk);
      await client.withdraw(funds.gatewayAvailable);
      await refresh();
    } finally {
      setBusy("");
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <main className="min-h-screen px-5 pb-24 pt-24 sm:px-8 lg:px-16">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10">
          <span className="font-mono text-[11px] uppercase tracking-eyebrow text-cream/40">
            studio
          </span>
          <h1 className="mt-2 font-serif text-4xl text-cream">Go live</h1>
          <p className="mt-2 max-w-lg text-cream/55">
            Your wallet is the address viewers stream value to. Share your link;
            payments settle to your Gateway balance in real time.
          </p>
        </header>

        {/* Stream link */}
        <section className="rounded-2xl border border-cream/10 bg-ink/40 p-6">
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-cream/40">
            your payee address (testnet burner)
          </div>
          <a
            href={address ? addrUrl(address) : "#"}
            target="_blank"
            rel="noreferrer"
            className="mt-1 block font-mono text-sm text-cream/80 hover:text-amber"
          >
            {address || "creating…"}
          </a>

          <div className="mt-5 font-mono text-[10px] uppercase tracking-eyebrow text-cream/40">
            shareable watch link
          </div>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
            <code className="flex-1 truncate rounded-lg border border-cream/10 bg-ink px-3 py-2.5 font-mono text-xs text-periwinkle/90">
              {shareLink || "…"}
            </code>
            <div className="flex gap-2">
              <button
                onClick={copy}
                className="rounded-full bg-amber px-5 py-2.5 font-mono text-xs text-ink transition-transform hover:scale-[1.03]"
              >
                {copied ? "copied ✓" : "copy link"}
              </button>
              {address && (
                <Link
                  href={`/watch/${address}?demo=1`}
                  className="rounded-full border border-cream/20 px-5 py-2.5 font-mono text-xs text-cream/80 hover:border-cream/50"
                >
                  preview ↗
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Earnings */}
        <section className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-verdigris/25 bg-ink/40 p-6">
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-cream/40">
              earnings · gateway available
            </div>
            <div className="mt-2 font-mono text-3xl tabular-nums text-verdigris">
              {funds ? `$${funds.gatewayAvailable}` : "—"}
            </div>
            <button
              onClick={onWithdraw}
              disabled={!!busy || !funds || !(parseFloat(funds.gatewayAvailable) > 0)}
              className="mt-4 rounded-full border border-verdigris/40 px-5 py-2 font-mono text-xs text-verdigris hover:border-verdigris disabled:opacity-40"
            >
              {busy === "withdraw" ? "withdrawing…" : "Withdraw all"}
            </button>
          </div>
          <div className="rounded-2xl border border-cream/10 bg-ink/40 p-6">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-eyebrow text-cream/40">
                wallet usdc
              </span>
              <button
                onClick={() => void refresh()}
                disabled={!!busy}
                className="font-mono text-[11px] text-cream/50 hover:text-cream/80 disabled:opacity-40"
              >
                {busy === "refresh" ? "…" : "refresh"}
              </button>
            </div>
            <div className="mt-2 font-mono text-3xl tabular-nums text-cream/80">
              {funds ? `$${funds.walletUsdc}` : "—"}
            </div>
            <p className="mt-4 font-mono text-[11px] text-cream/40">
              polling every 6s
            </p>
          </div>
        </section>

        {/* Settlement feed */}
        <section className="mt-6 rounded-2xl border border-cream/10 bg-ink/40 p-6">
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-cream/40">
            incoming settlements · on arc
          </div>
          <div className="mt-3 space-y-2">
            {incoming.length === 0 && (
              <p className="font-mono text-[11px] text-cream/30">
                no settlements yet — share your link and start a viewer session
              </p>
            )}
            {incoming.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between border-b border-cream/5 pb-2 font-mono text-[11px]"
              >
                <span className="text-cream/60">from {short(t.from)}</span>
                <span className="tabular-nums text-amber">
                  +${(Number(t.amount) / 1e6).toFixed(6)}
                </span>
                <span className="text-verdigris/80">{t.status}</span>
                {t.tx ? (
                  <a
                    href={txUrl(t.tx)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-periwinkle/70 hover:text-periwinkle"
                  >
                    ↗
                  </a>
                ) : (
                  <span className="text-cream/20">—</span>
                )}
              </div>
            ))}
          </div>
        </section>

        <p className="mt-8 font-mono text-[11px] text-cream/35">
          Testnet burner wallet, stored locally in this browser. For production,
          swap in a Circle Developer-Controlled wallet behind the same module.
        </p>
      </div>
    </main>
  );
}
