"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import LiveCard from "@/components/landing/LiveCard";
import { LandingNav, SectionMark } from "@/components/landing/LandingChrome";

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.div>
  );
}

const TICKER = [
  "per second", "hysteresis throttle", "circle gateway nanopayments", "x402",
  "self-custody", "arc testnet", "gasless settlement", "no llm in the spend loop",
];

const STEPS = [
  { n: "01", tag: "owncast", title: "Creator pastes one snippet.", body: "Drop the LeptonStream overlay on your Owncast page — or share a support link. Your payee address is your own connected wallet. No account. No platform." },
  { n: "02", tag: "session key", title: "Viewer funds a capped session.", body: "One signature. The real wallet delegates to a session key — autonomous, but unable to spend a cent past the ceiling the viewer chose." },
  { n: "03", tag: "agent", title: "The agent meters per second.", body: "It reads real playback health. Buffer, stall, or tab away — spending throttles. When playback recovers, it resumes. Deterministic code. Never an LLM." },
  { n: "04", tag: "settlement", title: "Tiny batches settle on Arc.", body: "≈ $0.005 per batch via Circle Gateway. Gasless for the viewer. Verifiable on testnet.arcscan.app. Creator withdraws their Gateway balance to their wallet." },
];

const FILES = [
  ["core/", "Payment agent: per-second metering, hysteresis throttle, hard ceiling, batched settlement. Engine-agnostic."],
  ["lib/connect.ts", "Connected (injected) wallet — identity, Arc add/switch, key-free balance reads, session funding, two-step withdrawal."],
  ["lib/wallet.ts", "The capped session signer. Signs autonomously, every few seconds, but never above ceiling."],
  ["lib/owncast.ts", "Reads the public status & HLS feed of any Owncast instance."],
  ["app/api/pay/[stream]", "x402 facilitator. Settles signed batches via Circle's BatchFacilitatorClient."],
  ["app/api/balance/[addr]", "Public CORS-enabled 'received' lookup for the overlay embed."],
  ["public/embed.js", "The drop-in Owncast overlay snippet."],
  ["app/studio", "Creator setup & earnings dashboard."],
];

const FAQS = [
  ["Do I have to move off Owncast?", "No. LeptonStream is a layer on top of the Owncast instance you already run. You paste a snippet or share a support link. Your stream, your server, your audience."],
  ["Can the agent drain a viewer's wallet?", "No. The real wallet only ever delegates to a session key with a hard ceiling. The agent signs autonomously below that ceiling and physically cannot sign above it."],
  ["What if the stream buffers or the viewer tabs away?", "The agent reads real playback health from the Owncast feed. Buffer, stall, or background — spending throttles. When playback recovers, it resumes from where it left off."],
  ["Why Arc and Circle Gateway?", "Gateway lets viewers transact gaslessly via nanopayments, and Arc finalizes fast and cheap enough to settle tiny ~$0.005 batches without the fees eating the value."],
  ["Where does the money land?", "Directly in your Gateway balance, payable to your own wallet address. You withdraw it back to your wallet whenever you want. Self-custody throughout."],
];

export default function Home() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <LandingNav />

      {/* HERO */}
      <header className="mx-auto max-w-6xl px-5 pt-16 sm:px-8 sm:pt-24">
        <SectionMark n="01" label="A per-second support layer for Owncast" />
        <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <h1 className="font-serif text-6xl leading-[0.95] tracking-tight sm:text-7xl lg:text-[5.5rem]">
              Get paid <em className="italic text-leaf">by the second</em> on the live stream you already run.
            </h1>
            <p className="mt-8 max-w-md text-lg leading-relaxed text-muted">
              Viewers stream value to you continuously while they watch — metered and settled in real time by an autonomous payment agent. Instead of the occasional lump-sum tip, it&apos;s a tiny, honest trickle. You keep your Owncast instance. There&apos;s no platform to move to.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/studio" className="rounded-lg bg-ink px-6 py-3 font-mono text-sm text-paper transition-transform hover:scale-[1.02]">Paste the snippet →</Link>
              <a href="#how" className="rounded-lg border border-ink/25 px-6 py-3 font-mono text-sm text-ink/80 hover:border-ink/60">See how a second pays</a>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
              <span>self-custody wallet</span><span className="text-leaf">·</span>
              <span>hard viewer ceiling</span><span className="text-leaf">·</span>
              <span>gasless settlement</span><span className="text-leaf">·</span>
              <span>no llm in the spend loop</span>
            </div>
          </div>
          <Reveal delay={0.15}><LiveCard /></Reveal>
        </div>
      </header>

      {/* MARQUEE */}
      <div className="mt-20 overflow-hidden border-y border-ink bg-ink py-5">
        <div className="flex w-max animate-[marquee_28s_linear_infinite] gap-8 whitespace-nowrap font-serif text-3xl text-paper sm:text-4xl">
          {[...TICKER, ...TICKER, ...TICKER].map((t, i) => (
            <span key={i} className="flex items-center gap-8">{t} <span className="text-leaf">·</span></span>
          ))}
        </div>
        <style>{`@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-33.33%)}}`}</style>
      </div>

      {/* TIP JAR IS BROKEN */}
      <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <div>
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">the tip jar is broken</span>
              <h2 className="mt-4 font-serif text-5xl leading-[1.02] sm:text-6xl">
                A tip is a <em className="italic">decision</em>. Attention is a <em className="italic text-leaf">flow</em>.
              </h2>
              <p className="mt-6 max-w-md leading-relaxed text-muted">
                Lump-sum tipping asks every viewer to interrupt themselves, decide on a number, and feel something about it. Most never do. The math punishes everyone who&apos;s simply enjoying the stream.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="grid grid-cols-2 border border-ink/15">
              <Cell label="tips" value="$0" sub="median per viewer / hour" />
              <Cell label="leptonstream" value="$0.0042/s" sub="≈ $15 / viewer / hour at this rate" green />
              <Cell label="friction" value="6 clicks" sub="open tipjar → amount → wallet → sign" border />
              <Cell label="friction" value="1 sig" sub="cap the session, then watch" green border />
            </div>
          </Reveal>
        </div>
      </section>

      {/* HOW A SECOND PAYS */}
      <section id="how" className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <Reveal>
          <SectionMark n="02" label="The flow, end to end" />
          <h2 className="mt-8 font-serif text-6xl sm:text-7xl">How a second pays</h2>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 border border-ink/15 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.08}>
              <div className="flex h-full flex-col border-ink/15 p-6 [&:not(:last-child)]:border-b lg:border-b-0 lg:[&:not(:last-child)]:border-r">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[12px] text-muted">{s.n}</span>
                  <span className="rounded-full border border-ink/25 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink/70">{s.tag}</span>
                </div>
                <h3 className="mt-10 font-serif text-2xl leading-tight">{s.title}</h3>
                <p className="mt-6 text-sm leading-relaxed text-muted">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* BUILT LIKE A LEDGER */}
      <section id="architecture" className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <Reveal>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">architecture, no hand-waving</span>
          <h2 className="mt-4 font-serif text-6xl leading-[1.0] sm:text-7xl">Built like a ledger. Read like one.</h2>
          <div className="mt-3"><SectionMark n="03" label="" /></div>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[1.3fr_0.7fr]">
          <Reveal>
            <div className="overflow-hidden rounded-2xl border border-ink bg-ink font-mono text-[12px] text-cream/90">
              <div className="flex items-center gap-2 border-b border-cream/10 px-5 py-3 text-cream/60">
                <span className="h-2 w-2 rounded-full bg-leaf" /> leptonstream/
              </div>
              <div>
                {FILES.map(([path, desc]) => (
                  <div key={path} className="grid grid-cols-1 gap-1 border-b border-cream/5 px-5 py-3 sm:grid-cols-[200px_1fr] sm:gap-4">
                    <span className="text-leaf">{path}</span>
                    <span className="text-cream/55">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <div className="space-y-8">
            {[
              ["EIP-712 schema, straight from the source", "The signing schema and Gateway Wallet ABI are derived directly from @circle-fin/x402-batching. Authorizations and contract calls match Circle's own client exactly."],
              ["Settles in batches of ~$0.005", "Tiny enough that a viewer barely registers them; large enough that the agent isn't writing to the chain every tick."],
              ["Verifiable, publicly", "Every batch lands on Arc and is inspectable at testnet.arcscan.app. The /api/balance/[addr] endpoint returns received totals over CORS."],
            ].map(([h, b], i) => (
              <Reveal key={i} delay={i * 0.08}>
                <div>
                  <div className="mb-3 h-px w-10 bg-leaf" />
                  <h3 className="font-serif text-2xl">{h}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{b}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* THE AGENT IS CODE (dark) */}
      <section id="safety" className="bg-ink py-24 text-cream">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Reveal><SectionMark2 n="04" label="The agent has no opinions" /></Reveal>
          <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-start">
            <Reveal>
              <div>
                <h2 className="font-serif text-6xl leading-[1.0] sm:text-7xl">The agent is <em className="italic text-leaf">code</em>, not a model.</h2>
                <p className="mt-7 max-w-md leading-relaxed text-cream/55">
                  Per-second metering, the throttle, and the ceiling are deterministic. There&apos;s no LLM anywhere in the spend loop, so there is nothing to jailbreak into overspending your money.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="overflow-hidden rounded-2xl border border-cream/15 font-mono text-[12px]">
                <div className="flex items-center justify-between border-b border-cream/10 px-5 py-3 text-cream/50 uppercase tracking-[0.12em] text-[10px]">
                  <span>install · paste into your owncast custom html</span><span>1 line</span>
                </div>
                <pre className="overflow-x-auto px-5 py-5 leading-relaxed text-cream/80">
<span className="text-cream/40">&lt;!— LeptonStream overlay —&gt;</span>{"\n"}
&lt;script src=<span className="text-leaf">&quot;https://leptonstream.app/embed.js&quot;</span>{"\n"}{"        "}data-payee=<span className="text-leaf">&quot;0xYourWallet…&quot;</span>{"\n"}{"        "}data-rate=<span className="text-leaf">&quot;0.0042&quot;</span> async&gt;&lt;/script&gt;
                </pre>
                <div className="flex items-center justify-between border-t border-cream/10 px-5 py-3 text-cream/50">
                  <span>self-custody · your wallet, your keys</span>
                  <Link href="/studio" className="text-leaf hover:underline">Copy →</Link>
                </div>
              </div>
            </Reveal>
          </div>

          <div className="mt-14 grid grid-cols-2 border border-cream/15 lg:grid-cols-4">
            <StatDark value="≈ $0.005" label="settlement batch" />
            <StatDark value="1 sig" label="to start watching" border />
            <StatDark value="0" label="llms in spend loop" border />
            <StatDark value="$5.00" label="default session cap" border />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <Reveal>
          <SectionMark n="05" label="questions, answered" />
          <h2 className="mt-8 font-serif text-6xl sm:text-7xl">answered.</h2>
        </Reveal>
        <div className="mt-12 border-t border-ink/15">
          {FAQS.map(([q, a], i) => (
            <div key={i} className="border-b border-ink/15">
              <button onClick={() => setOpen(open === i ? null : i)} className="grid w-full grid-cols-[24px_1fr] items-start gap-4 py-6 text-left lg:grid-cols-[24px_1fr_1fr]">
                <span className="font-mono text-muted">{open === i ? "–" : "+"}</span>
                <h3 className="font-serif text-2xl">{q}</h3>
                <motion.p
                  initial={false}
                  animate={{ opacity: open === i ? 1 : 0.0, height: open === i ? "auto" : 0 }}
                  className="overflow-hidden text-sm leading-relaxed text-muted lg:pt-1"
                >
                  {a}
                </motion.p>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-ink/15 px-5 pb-12 pt-16 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="font-serif text-[18vw] leading-none tracking-tight lg:text-[12rem]">
            leptonstream<span className="text-leaf">.</span>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 border-t border-ink/15 pt-8 font-mono text-[12px] sm:grid-cols-3">
            <div>
              <div className="uppercase tracking-[0.18em] text-muted">stack</div>
              <div className="mt-2 text-ink/70">Circle Gateway · x402 · Arc testnet · Owncast</div>
            </div>
            <div>
              <div className="uppercase tracking-[0.18em] text-muted">run locally</div>
              <div className="mt-2 text-ink/70">npm install --legacy-peer-deps<br />npm run dev</div>
            </div>
            <div className="sm:text-right">
              <div className="uppercase tracking-[0.18em] text-muted">status</div>
              <div className="mt-2 flex items-center gap-2 text-ink/70 sm:justify-end">
                <span className="h-1.5 w-1.5 rounded-full bg-leaf" /> live on arc testnet
              </div>
            </div>
          </div>
          <div className="mt-8 flex justify-between font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            <span>© 2026 leptonstream</span><span>get paid by the second</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Cell({ label, value, sub, green, border }: { label: string; value: string; sub: string; green?: boolean; border?: boolean }) {
  return (
    <div className={`p-6 ${border ? "border-t border-ink/15" : ""} [&:nth-child(odd)]:border-r [&:nth-child(odd)]:border-ink/15`}>
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{label}</div>
      <div className={`mt-2 font-serif text-4xl ${green ? "text-leaf" : "text-ink"}`}>{value}</div>
      <div className="mt-2 font-mono text-[11px] text-muted">{sub}</div>
    </div>
  );
}

function StatDark({ value, label, border }: { value: string; label: string; border?: boolean }) {
  return (
    <div className={`p-6 ${border ? "lg:border-l border-cream/15" : ""} [&:nth-child(3)]:border-t [&:nth-child(4)]:border-t lg:[&:nth-child(3)]:border-t-0 lg:[&:nth-child(4)]:border-t-0 [&:nth-child(2)]:border-cream/15`}>
      <div className="font-serif text-4xl text-cream">{value}</div>
      <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-cream/45">{label}</div>
    </div>
  );
}

function SectionMark2({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="font-mono text-[12px] text-leaf">§ {n}</span>
      <span className="h-px flex-1 bg-cream/15" />
      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-cream/45">{label}</span>
    </div>
  );
}
