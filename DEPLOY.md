# Deploying LeptonStream to Vercel

One Next.js 15 app: marketing site, viewer (`/watch/[creator]`), streamer
studio (`/studio`), and the payment facilitator (`/api/pay/[stream]`).

It is **live by default** — real gasless USDC settlement on Arc testnet via
Circle Gateway, with self-custody wallets. There is no "demo mode" in the UI.

## 1. Push to GitHub

```bash
git init && git add . && git commit -m "LeptonStream"
git branch -M main
git remote add origin https://github.com/Paulos-ui/leptonstream.git
git push -u origin main
```

`.npmrc` (in the repo) sets `legacy-peer-deps=true`; `package.json` pins Node 22.

## 2. Import into Vercel

1. vercel.com → Add New → Project → import `Paulos-ui/leptonstream`.
2. Framework: Next.js (auto). Leave build/output at defaults.
3. Settings → General → Node.js Version → **22.x**.
4. Deploy.

## 3. Environment variables

**None are required.** Users connect their own wallet, so there are no keys or
secrets. `FACILITATOR_URL` is optional and already defaults to the testnet URL.

(There is no `NEXT_PUBLIC_DEMO`. Live is the default. A hidden, unadvertised
stage fallback exists at `…/watch/<addr>?safe=1` that runs the agent on a mock
settler — use it only if the live path misbehaves in front of judges.)

## 4. Using it live on Arc testnet

Arc uses **USDC as its native gas token**, so a single faucet drip covers both
gas and the streaming balance.

**Streamer:**
1. Open `/studio`, click **Connect wallet** (MetaMask or any injected wallet).
   It will offer to add/switch to **Arc Testnet** automatically.
2. Your wallet address is your payee. Copy your **watch link** and share it.
3. Earnings (available + withdrawable) update live. **Initiate withdrawal**, then
   **Finalize → wallet** after the short on-chain delay.

**Viewer:**
1. Open the watch link, **Connect wallet** (this is your identity).
2. If your wallet has no test USDC, use the **Faucet** link → pick Arc Testnet →
   paste your address.
3. **Fund session** (e.g. $1.00). This is one signature: it moves USDC from your
   wallet into a capped session signer, which then deposits into Gateway and
   streams autonomously — no popup every second. The session can never spend
   past your ceiling.
4. Set the ceiling and press **Start streaming**. Each ~$0.005 batch settles on
   Arc with a link to testnet.arcscan.app.

## Why a "session", not a popup per second

Gasless per-second payment signs an authorization every few seconds — a human
can't approve a wallet prompt that often. So your real connected wallet (your
identity + funding source) authorizes a capped session key that signs
autonomously up to your ceiling. This is the standard pattern for streaming
payments; for full production, swap the session key for a Circle
Developer-Controlled (MPC) wallet behind the same module.

## Confirm on your first live run

I built every Gateway call against the real SDK schema (EIP-712 signing and the
Gateway Wallet ABI extracted from the shipped package), but I could not execute
against live Circle/Arc/MetaMask. On your first funded run, watch the browser
console for:

1. **CORS** on the `/api/pay` settlement round-trip or RPC reads. The settlement
   route is same-origin; RPC reads use the public Arc RPC. If a call is blocked,
   it will show clearly in the console.
2. **The payment header** `client.pay()` sends. The facilitator reads
   `x-payment` / `payment-signature` / `payment`; if a live 402 shows a different
   name, it is a one-line change in `app/api/pay/[stream]/route.ts`.

If anything fails mid-demo, `?safe=1` on the watch link is your instant fallback.
