"use client";

import { useScroll, useMotionValueEvent, motion } from "framer-motion";
import { useRef, useState } from "react";

const SECTIONS = [
  { id: "vision", label: "Vision" },
  { id: "how", label: "How it works" },
  { id: "use", label: "How to use it" },
  { id: "features", label: "Features" },
] as const;

export default function About() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const [active, setActive] = useState(0);
  const fillRef = useRef<HTMLDivElement>(null);

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (fillRef.current) fillRef.current.style.height = `${(p * 100).toFixed(1)}%`;
    const i = Math.min(SECTIONS.length - 1, Math.floor(p * SECTIONS.length));
    setActive(i);
  });

  return (
    <div ref={ref} className="relative">
      {/* Legibility scrim for the dense text. */}
      <div className="pointer-events-none absolute inset-0 bg-ink/55" />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 py-32 sm:px-10 lg:grid-cols-[260px_1fr] lg:gap-20 lg:px-16">
        {/* Sticky flow-gauge + contents */}
        <div className="hidden lg:block">
          <div className="sticky top-1/3">
            <span className="mb-8 block font-mono text-[11px] uppercase tracking-eyebrow text-cream/40">
              about the project
            </span>
            <div className="flex gap-5">
              {/* gauge */}
              <div className="relative w-px bg-cream/15">
                <div
                  ref={fillRef}
                  className="absolute left-0 top-0 w-px bg-gradient-to-b from-amber to-coral"
                  style={{ height: "0%" }}
                />
              </div>
              {/* contents */}
              <nav className="flex flex-col gap-4">
                {SECTIONS.map((s, i) => {
                  const settled = i < active;
                  const current = i === active;
                  const color = settled
                    ? "#5E8F86"
                    : current
                      ? "#F6A92B"
                      : "rgba(244,236,221,0.4)";
                  return (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className="font-mono text-sm transition-colors duration-300"
                      style={{ color }}
                    >
                      {settled ? "✓ " : current ? "▸ " : "  "}
                      {s.label}
                    </a>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-2xl">
          <h2 className="font-serif text-[clamp(2.25rem,6vw,4.5rem)] leading-[1.02] text-cream">
            What we built, and why.
          </h2>

          <Block id="vision" index={0} active={active}>
            <Kicker>Vision</Kicker>
            <p>
              Subscriptions are a blunt instrument. You pay a flat fee whether
              you watch one minute or a hundred hours — and creators wait weeks
              to be paid. LeptonStream makes the smallest unit of value, a
              single second of a stream, actually transactable.
            </p>
            <p>
              The name comes from the <em>lepton</em>, the smallest coin ever
              minted. We bring that idea into the age of AI agents: value flows
              continuously, you pay for exactly the seconds you watch, and
              creators are paid in real time.
            </p>
          </Block>

          <Block id="how" index={1} active={active}>
            <Kicker>How it works</Kicker>
            <p>
              Four moving parts turn a flat subscription into a living stream:
            </p>
            <ol className="mt-4 space-y-3">
              <Step n="1" title="Set your ceiling">
                Before you press play you set a maximum spend — a hard limit the
                system never crosses.
              </Step>
              <Step n="2" title="The agent takes over">
                An autonomous agent watches the stream second by second, decides
                the rate, and signs each nanopayment.
              </Step>
              <Step n="3" title="Value streams per second">
                USDC flows as a continuous stream of nanopayments, batched and
                routed through Circle&apos;s Arc and Gateway, settled via the
                x402 protocol — thousands of tiny, exact payments that feel like
                one smooth flow.
              </Step>
              <Step n="4" title="Quality-aware throttling">
                If quality drops, the agent throttles or pauses — you never pay
                full price for a degraded stream. When it recovers, it resumes.
                Always within your ceiling.
              </Step>
            </ol>
          </Block>

          <Block id="use" index={2} active={active}>
            <Kicker>How to use it</Kicker>
            <ol className="space-y-3">
              <Step n="→" title="Connect a wallet">
                Fund it with USDC. Non-custodial — your keys, your limits.
              </Step>
              <Step n="→" title="Pick a stream, set your rate">
                Choose what to watch and set your per-second ceiling.
              </Step>
              <Step n="→" title="Press play">
                The agent starts the meter. Watch the live readout: rate, total
                spent, and every decision it makes.
              </Step>
              <Step n="→" title="Stop anytime">
                You&apos;re only ever charged for the seconds you watched.
                Settlement finalizes on-chain.
              </Step>
            </ol>
          </Block>

          <Block id="features" index={3} active={active}>
            <Kicker>Features &amp; benefits</Kicker>
            <ul className="space-y-3">
              <Feature title="Pay per second, not per month">
                Value matches attention — never a wasted cent.
              </Feature>
              <Feature title="A ceiling you control">
                The agent can never spend past the limit you set.
              </Feature>
              <Feature title="Real-time settlement">
                Creators are paid as they&apos;re watched, not weeks later.
              </Feature>
              <Feature title="Quality-aware">
                Degraded streams cost less, automatically.
              </Feature>
              <Feature title="Production rails">
                Built on Circle Arc, Gateway, and the x402 protocol.
              </Feature>
            </ul>
          </Block>
        </div>
      </div>
    </div>
  );
}

function Block({
  id,
  index,
  active,
  children,
}: {
  id: string;
  index: number;
  active: number;
  children: React.ReactNode;
}) {
  const settled = index < active;
  const current = index === active;
  return (
    <section
      id={id}
      className="mt-16 scroll-mt-24 border-l-2 pl-6 transition-colors duration-500 [&_p]:mt-4 [&_p]:text-base [&_p]:leading-relaxed [&_p]:text-cream/70 sm:[&_p]:text-lg [&_em]:text-amber [&_em]:not-italic"
      style={{
        borderColor: settled
          ? "#5E8F86"
          : current
            ? "rgba(246,169,43,0.6)"
            : "rgba(244,236,221,0.12)",
      }}
    >
      {children}
    </section>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span className="block font-mono text-[11px] uppercase tracking-eyebrow text-amber/70">
      {children}
    </span>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-4">
      <span className="mt-0.5 font-mono text-sm text-periwinkle/80">{n}</span>
      <span className="text-base leading-relaxed text-cream/70 sm:text-lg">
        <span className="font-medium text-cream">{title}.</span> {children}
      </span>
    </li>
  );
}

function Feature({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-4">
      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-verdigris" />
      <span className="text-base leading-relaxed text-cream/70 sm:text-lg">
        <span className="font-medium text-cream">{title}.</span> {children}
      </span>
    </li>
  );
}
