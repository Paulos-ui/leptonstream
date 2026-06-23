# Deploying LeptonStream to Vercel

LeptonStream is a single Next.js 15 app. The marketing site, the viewer
dashboard (`/watch/[creator]`), the streamer studio (`/studio`), and the
payment facilitator (`/api/pay/[stream]`) all deploy together.

It runs in two modes:

- **Demo mode** — payments are simulated by a deterministic MockAdapter. No
  wallet, no funds, never breaks. Perfect for the live demo / video.
- **Real mode** — actual gasless USDC settlement on Arc testnet via Circle
  Gateway nanopayments, with on-chain transactions you can open in the explorer.

---

## 1. Push to GitHub

```bash
git init
git add .
git commit -m "LeptonStream"
git branch -M main
git remote add origin https://github.com/Paulos-ui/leptonstream.git
git push -u origin main
```

`.npmrc` (already in the repo) sets `legacy-peer-deps=true` so the install
succeeds on React 19. `package.json` pins Node `22.x`.

## 2. Import into Vercel

1. vercel.com → **Add New → Project** → import `Paulos-ui/leptonstream`.
2. Framework preset: **Next.js** (auto-detected). Leave build/output defaults.
3. **Project Settings → General → Node.js Version → 22.x** (matches `engines`).
4. Deploy.

## 3. Environment variables (Project → Settings → Environment Variables)

| Variable | Value | Needed? |
|---|---|---|
| `NEXT_PUBLIC_DEMO` | `1` | Optional. Forces demo mode app-wide. Leave **unset** for real settlement. |
| `FACILITATOR_URL` | `https://gateway-api-testnet.circle.com` | Optional. Defaults to this already. |

Tip: deploy first with `NEXT_PUBLIC_DEMO=1` to confirm everything renders and
the agent loop runs, then remove it to go live on Arc.

## 4. Go live on real Arc testnet

Arc uses **USDC as its native gas token**, so funding a wallet from the faucet
covers both the deposit gas and the streaming balance.

**As a streamer:**
1. Open `https://<your-app>.vercel.app/studio`. A testnet burner wallet is
   created in your browser — its address is your payee address.
2. Copy your **shareable watch link** (`/watch/<your-address>`).

**As a viewer:**
1. Open the watch link (without `?demo=1`). A burner wallet is created for you.
2. Click **Get test USDC** → on faucet.circle.com pick **Arc Testnet**, paste
   your wallet address, drip USDC.
3. Click **Deposit $1 → Gateway** (one-time on-chain tx that moves USDC into
   your Gateway balance so it can stream gaslessly).
4. Set your ceiling and press **Start streaming**. The agent meters per second
   and settles a batch every ~$0.005; each settlement links to
   testnet.arcscan.app.

Back on `/studio`, earnings and the incoming-settlement feed update live, and
**Withdraw all** pulls your Gateway balance back out.

---

## Two things to confirm on your first real run

These are the only parts I could not verify end-to-end without a funded wallet
on a live browser:

1. **Browser ↔ Gateway/RPC CORS.** `client.deposit()` / `getBalances()` /
   `searchTransfers()` call the Gateway API and Arc RPC directly from the
   browser. If you see CORS errors in the console, move those three calls behind
   a thin server route (the burner key is testnet-only, so server-side is fine)
   — the settlement path itself goes through the same-origin `/api/pay` route
   and is unaffected.
2. **Payment header name.** The facilitator route reads the signed
   authorization from `x-payment`, `payment-signature`, or `payment`. The docs
   say `client.pay()` sends `PAYMENT-SIGNATURE`, which is covered — but if a live
   402 round-trip shows a different header, adjust the three `req.headers.get()`
   lines in `app/api/pay/[stream]/route.ts`.

If either bites during judging, flip `NEXT_PUBLIC_DEMO=1` and the demo is
instantly bulletproof while you debug.
