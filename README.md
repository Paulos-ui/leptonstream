# LeptonStream

**Get paid by the second on the live stream you already run.**

LeptonStream is a per-second support layer for [Owncast](https://owncast.online),
the open-source self-hosted live-streaming server. Viewers stream value to a
creator continuously while they watch — metered and settled in real time by an
autonomous payment agent — instead of dropping the occasional lump-sum tip.
Creators keep their existing Owncast instance; there's no platform to move to.

It's built on Circle Gateway nanopayments and x402 on Arc, but a creator never
has to care about that — they paste one snippet and start getting paid.

---

## How it works

1. **A creator adds LeptonStream to their Owncast page** — either a one-line
   overlay snippet, or by sharing a support link. Their payee address is their
   own connected wallet (self-custody; no account to create).
2. **A viewer connects their wallet** and funds a *capped session* with one
   signature. Because gasless per-second payment signs an authorization every
   few seconds — far too often for a human to approve each time — the real
   wallet delegates to a session key that signs autonomously, but can never
   spend past the ceiling the viewer sets.
3. **The payment agent meters per second** while the viewer watches. It reads
   real playback health: if the stream buffers, stalls, or the viewer tabs
   away, the agent throttles spending; when playback recovers, it resumes.
4. **Value settles on Arc in tiny batches** (~$0.005 each) via Circle Gateway —
   gasless for the viewer, verifiable on testnet.arcscan.app.
5. **The creator withdraws** their Gateway balance back to their wallet.

The agent's spending logic is deterministic code with a hard ceiling — never an
LLM — so it cannot overspend.

## Architecture

- `core/` — the payment agent (per-second metering, hysteresis throttle, hard
  ceiling, batched settlement) and settlement adapters. Engine-agnostic.
- `lib/connect.ts` — connected (injected) wallet: identity, Arc add/switch,
  key-free balance reads, session funding, two-step withdrawal.
- `lib/wallet.ts` — the capped session signer (autonomous per-second signing).
- `lib/owncast.ts` — reads an Owncast instance's public status / HLS feed.
- `app/api/pay/[stream]` — the x402 facilitator; settles signed batches via
  Circle's `BatchFacilitatorClient`.
- `app/api/balance/[addr]` — public, CORS-enabled "received" lookup for the embed.
- `public/embed.js` — the drop-in Owncast overlay.
- `app/watch/[creator]` — the viewer experience (embeds the creator's live feed).
- `app/studio` — the creator setup + earnings dashboard.

The EIP-712 signing schema and Gateway Wallet ABI are derived directly from the
`@circle-fin/x402-batching` SDK, so authorizations and contract calls match
Circle's own client exactly.

## Run locally

```bash
npm install --legacy-peer-deps
npm run dev
```

Deployment and the live testnet walkthrough are in **DEPLOY.md**.
