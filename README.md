# LeptonStream — landing experience

> Value, in constant motion. A scroll-driven landing page for LeptonStream:
> per-second payments for live streams, run by an autonomous agent on Circle
> nanopayments, Arc, and x402.

Built as a single living instrument you scroll *through* — not a stack of
sections. One persistent WebGL stream lives behind the entire page and changes
meaning as you descend through seven acts.

---

## The seven acts

| # | Act | What the stream does |
|---|-----|----------------------|
| 0 | **Hero** | Stream establishes; scroll velocity pumps emission. Live counter. |
| 1 | **Continuous → Discrete** | Scroll scrubs a camera dive; the smooth ribbon resolves into countable leptons, then re-forms. |
| 2 | **Instrument** | Flow channels into a measured beam (`uFocus`); a calibrated rail meters value per second. |
| 3 | **The agent wakes** | Periwinkle cools the field; a hysteresis loop throttles/dims the flow on a scroll-scrubbed quality drop; decisions flash. |
| 4 | **Under the hood** | Stream recedes behind a scrim; a pinned pipeline illuminates stage by stage (ceiling → agent → Circle Arc → x402). |
| 5 | **About** | Scroll-reactive docs; a sticky flow-gauge settles each section to verdigris as you pass it. |
| 6 | **Set your rate** | A draggable slider drives stream intensity (`uRate`) and a live counter — control hands to the user. |

Two global instrument touches: a fixed wordmark and a right-edge flow-gauge
tracking total scroll progress.

---

## Stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS** with the LeptonStream token system
- **Framer Motion** — `useScroll` / `useTransform` for scroll-linked motion
- **Lenis** — buttery virtual scroll
- **React Three Fiber + three.js** — the persistent particle stream
- **Zustand** — financial/sim state (kept separate from presentation state)

---

## Getting started

```bash
npm install --legacy-peer-deps   # R3F v9 / React 19 peer ranges
npm run dev                      # http://localhost:3000
```

```bash
npm run build
npm run typecheck
```

> Fonts load via `next/font` (Instrument Serif, JetBrains Mono) and the `geist`
> package (Geist Sans). `next build` fetches the Google-hosted faces, so the
> build machine needs network access to `fonts.googleapis.com` /
> `fonts.gstatic.com`.

---

## Deploy (Vercel)

Zero config — push to GitHub and import, or run `vercel`.

---

## Architecture

```
app/
  layout.tsx       Fonts · Lenis · StreamBackground · Wordmark · ProgressGauge · grain
  page.tsx         Composes the seven acts in order
  globals.css      Tokens, Lenis styles, base type

components/
  stream/
    StreamCanvas.tsx     R3F canvas + particle system (reads scrollSignal)
    StreamBackground.tsx Client wrapper, dynamic import ssr:false
    streamShader.ts      GLSL: flow · zoom · focus · agent · throttle · pulse · rate
  acts/
    Hero · QuantumZoom · Instrument · AgentLoop · Pipeline · About · CTA
  ui/
    Counter.tsx          60fps DOM-direct counter
    RateSlider.tsx       Draggable slider (pointer + keyboard)
    Wordmark.tsx         Fixed brand
    ProgressGauge.tsx    Right-edge flow gauge
  providers/
    LenisProvider.tsx    Smooth scroll, feeds scrollSignal

lib/
  scrollSignal.ts  Mutable presentation state, read by the canvas at 60fps
  store.ts         Zustand — financial/sim truth
```

### The one idea that holds it together

`lib/scrollSignal.ts` is a plain mutable object — **not** React state. The
canvas reads it every frame inside `useFrame`; writing React state 60×/sec would
thrash renders. Each act writes only the stream uniforms it owns
(`zoom`, `focus`, `agent`, `throttle`, `rate`, …) from its local scroll
progress, and each value returns to neutral at its act's edges. Financial truth
(Zustand) and presentation truth (`scrollSignal`) never mix.

---

## Design system — "Warm Value, Cold Intelligence"

| Token        | Hex       | Meaning                                     |
| ------------ | --------- | ------------------------------------------- |
| `ink`        | `#16100C` | deep warm espresso base                     |
| `amber`      | `#F6A92B` | value in flight (head of the stream)        |
| `coral`      | `#FF6B57` | value settling (tail of the stream)         |
| `periwinkle` | `#8B8BFA` | agent intelligence — cool against the warm  |
| `cream`      | `#F4ECDD` | editorial text / light surfaces             |
| `verdigris`  | `#5E8F86` | settled / confirmed (aqueduct copper)       |

**Type:** Instrument Serif (display) · Geist (body) · JetBrains Mono (data).

**Motion law:** value moves with a slightly viscous, liquid ease (it's a fluid);
the agent moves crisply, with anticipation (it thinks, then acts).

---

## Tuning knobs

- **Stream** (`components/stream/StreamCanvas.tsx`): `COUNT`, `WIDTH`/`HEIGHT`,
  `uSize`; shader `keep`/`scale` (continuous→discrete intensity).
- **Agent drama** (`components/acts/AgentLoop.tsx`): the `0.72` quality-dip depth
  and the `dt * 2.2` throttle ease in `StreamCanvas` most change how dramatic the
  throttle reads.
- **Finale** (`components/ui/RateSlider.tsx`): `MIN_RATE` / `MAX_RATE`.

## Placeholders to fill

- CTA action links (`Launch` / `View on GitHub`) point to `#`.
- The `geist` Geist Sans is the body face; swap in `globals` if you prefer.
