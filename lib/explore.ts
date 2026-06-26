// The curated Explore wall. Pre-seeded with reliable public HLS test streams
// (they play in a <video> via hls.js — no API key, no embedding restrictions).
// Each carries a per-second price that showcases nanopayments: value as small
// as $0.000001, metered every second and settled in tiny batches on Arc.
//
// Payee = the platform/curator wallet (the publisher of the wall). Swap in your
// own via NEXT_PUBLIC_OWNER_ADDRESS. Later, a YouTube Data API key lets us
// replace this seed with live search — the page is built so that drops in.

export const OWNER_ADDRESS = (process.env.NEXT_PUBLIC_OWNER_ADDRESS ??
  "0xa6a3bd6fb4623f61917abcd13b4c6fde3438ea77") as `0x${string}`;

export interface ExploreStream {
  id: string;
  title: string;
  category: string;
  src: string;          // HLS / video URL
  pricePerSec: number;  // USD per second
  accent: string;
}

export const DEFAULT_WATCH_RATE = 0.00005; // $/sec for "bring your own"

export const SEED_STREAMS: ExploreStream[] = [
  { id: "bbb",   title: "Big Buck Bunny",    category: "Animation",   src: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",                 pricePerSec: 0.00005,  accent: "#5BA013" },
  { id: "tos",   title: "Tears of Steel",    category: "Sci-Fi Film", src: "https://test-streams.mux.dev/tos_ismc/main.m3u8",                   pricePerSec: 0.0001,   accent: "#7A5AF0" },
  { id: "bipbop",title: "Apple BipBop",      category: "Nano Floor",  src: "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8", pricePerSec: 0.000001, accent: "#C77D2E" },
  { id: "delta", title: "Deltatre Mix",      category: "Documentary", src: "https://test-streams.mux.dev/dai-discontinuity-deltatre/manifest.m3u8", pricePerSec: 0.0002, accent: "#3F8C8C" },
  { id: "shift", title: "Shift Ambient",     category: "Ambient",     src: "https://test-streams.mux.dev/pts_shift/master.m3u8",                pricePerSec: 0.00015,  accent: "#5E8F86" },
  { id: "t001",  title: "Test Channel 001",  category: "Lo-fi",       src: "https://test-streams.mux.dev/test_001/stream.m3u8",                 pricePerSec: 0.000075, accent: "#FF6B57" },
  { id: "live",  title: "Live Test Channel", category: "Live",        src: "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8", pricePerSec: 0.0003,  accent: "#16100C" },
];

export function watchHrefFor(src: string, price: number): string {
  return `/watch/${OWNER_ADDRESS}?src=${encodeURIComponent(src)}&rate=${price}`;
}
