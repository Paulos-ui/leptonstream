# Deploying LeptonStream to Vercel

One Next.js 15 app: marketing site, viewer (`/watch/[creator]`), creator setup
(`/studio`), the x402 facilitator (`/api/pay/[stream]`), a public balance lookup
(`/api/balance/[addr]`), and the embeddable overlay (`/embed.js`).

Live by default — real gasless USDC settlement on Arc testnet, self-custody
wallets, no demo mode in the UI.

## 1. Push to GitHub

```bash
git init && git add . && git commit -m "LeptonStream"
git branch -M main
git remote add origin https://github.com/Paulos-ui/leptonstream.git
git push -u origin main
```

`.npmrc` sets `legacy-peer-deps=true`; `package.json` pins Node 22.

## 2. Import into Vercel

1. vercel.com → Add New → Project → import `Paulos-ui/leptonstream`.
2. Framework: Next.js (auto). Defaults are fine.
3. Settings → General → Node.js Version → **22.x**.
4. Deploy.

## 3. Environment variables

**None required.** Users connect their own wallets — no keys or secrets.
(`FACILITATOR_URL` is optional and already defaults to the testnet URL.)

## 4. Creator flow (Owncast)

1. Open `/studio`, **Connect wallet** (it adds/switches to Arc Testnet for you).
   Your wallet address is your payee.
2. Enter your Owncast server URL (optional but recommended — it powers the live
   feed + viewer count).
3. Add payments to your stream, either:
   - **Overlay snippet** — paste the generated `<script …>` into Owncast → Admin
     → Custom Content / Custom Javascript. A support pill appears on your page.
   - **Support link** — share the generated `/watch/…?server=…` link in your
     stream description or socials. No instance changes needed.
4. Watch earnings accrue; **Initiate withdrawal** → **Finalize → wallet** after
   the short on-chain delay.

## 5. Viewer flow

1. Open the support link / click the overlay → **Connect wallet** (your identity).
2. No test USDC? Use the **faucet** link (Arc Testnet, paste your address), refresh.
3. **Fund session** (e.g. $1.00) — one signature funds a capped session that
   streams autonomously. The Fund button stays disabled until your wallet has
   USDC, so you never fire a doomed transaction.
4. Set your ceiling, **Start supporting**. Batches settle on Arc (~$0.005 each)
   with explorer links. Buffering / tab-away makes the agent throttle for real.

## Why a "session", not a popup per second

Gasless per-second payment signs an authorization every few seconds — a human
can't approve a wallet prompt that often. So your real connected wallet (your
identity + funding source) authorizes a capped session key that signs
autonomously up to your ceiling. Production swap: Circle Developer-Controlled
(MPC) wallets behind the same module.

## Confirm on your first live run

Every Gateway call is built against the real SDK schema (EIP-712 signing + the
Gateway Wallet ABI extracted from the shipped package), but it hasn't been
executed against live Circle/Arc/MetaMask. On your first funded run, watch the
console for:

1. **CORS** — Owncast status/HLS reads (cross-origin) and the `/api/pay`
   round-trip. Owncast generally serves permissive CORS; the embed overlay runs
   on the creator's own page (same origin) so it's unaffected.
2. **The payment header** `client.pay()` sends. The facilitator reads
   `x-payment` / `payment-signature` / `payment`; adjust the one line in
   `app/api/pay/[stream]/route.ts` if a live 402 shows a different name.

Hidden stage fallback: `…/watch/<addr>?safe=1` runs the agent on a mock settler.
