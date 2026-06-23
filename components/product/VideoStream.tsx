"use client";

import { useEffect, useRef, useState } from "react";

// Stable public HLS test stream (overridable via ?src=). Styled as a live feed;
// the product point is that playback is gated to — and metered by — payment.
const DEFAULT_SRC = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

export default function VideoStream({
  src = DEFAULT_SRC,
  playing,
  quality,
  color,
  onQuality,
}: {
  src?: string;
  playing: boolean;
  quality: number;
  color: string;
  onQuality?: (q: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [muted, setMuted] = useState(true);
  const [failed, setFailed] = useState(false);
  const low = playing && quality <= 0.5;

  // Attach the source (hls.js where needed, native HLS otherwise).
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let hls: { destroy: () => void } | null = null;
    let cancelled = false;
    setFailed(false);

    const isHls = src.endsWith(".m3u8");
    const nativeHls = video.canPlayType("application/vnd.apple.mpegurl");

    if (isHls && !nativeHls) {
      import("hls.js")
        .then(({ default: Hls }) => {
          if (cancelled) return;
          if (Hls.isSupported()) {
            const inst = new Hls({ enableWorker: true, lowLatencyMode: true });
            inst.loadSource(src);
            inst.attachMedia(video);
            inst.on(Hls.Events.ERROR, (_e, data) => {
              if (data.fatal) setFailed(true);
            });
            hls = inst;
          } else {
            setFailed(true);
          }
        })
        .catch(() => setFailed(true));
    } else {
      video.src = src;
    }

    return () => {
      cancelled = true;
      hls?.destroy();
    };
  }, [src]);

  // Playback follows the agent: video runs only while value is streaming.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (playing) {
      video.play().catch(() => {
        /* autoplay rejection — stays paused, no crash */
      });
    } else {
      video.pause();
    }
  }, [playing]);

  // Real quality signal: buffering / stalls / tab-hidden lower it; smooth
  // playback restores it. The agent throttles on THIS, not a fake value.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !onQuality) return;
    const good = () => onQuality(document.hidden ? 0.3 : 1);
    const bad = () => onQuality(0.3);
    const vis = () => onQuality(document.hidden ? 0.3 : video.paused ? 1 : 1);
    video.addEventListener("playing", good);
    video.addEventListener("canplay", good);
    video.addEventListener("waiting", bad);
    video.addEventListener("stalled", bad);
    document.addEventListener("visibilitychange", vis);
    return () => {
      video.removeEventListener("playing", good);
      video.removeEventListener("canplay", good);
      video.removeEventListener("waiting", bad);
      video.removeEventListener("stalled", bad);
      document.removeEventListener("visibilitychange", vis);
    };
  }, [onQuality]);

  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl border border-cream/10 bg-ink">
      <video
        ref={videoRef}
        muted={muted}
        loop
        playsInline
        className="h-full w-full object-cover transition-[filter] duration-500"
        style={{
          filter: low ? "blur(6px) saturate(0.6) brightness(0.8)" : "none",
          opacity: failed ? 0 : 1,
        }}
      />

      {/* Idle / fallback visual */}
      {(!playing || failed) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-ink/70">
          <Equalizer active={false} color={color} />
          <span className="font-mono text-[11px] uppercase tracking-eyebrow text-cream/40">
            {failed ? "stream offline — demo visual" : "press start to begin"}
          </span>
        </div>
      )}

      {/* LIVE badge */}
      <div className="absolute left-4 top-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-eyebrow text-cream/80">
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{
            background: playing ? "#FF6B57" : "#5F5E5A",
            animation: playing ? "pulseDot 1.6s ease-in-out infinite" : "none",
          }}
        />
        {playing ? "live" : "paused"}
      </div>

      {/* Throttle indicator */}
      {low && (
        <div className="absolute right-4 top-4 rounded-full bg-ink/70 px-2.5 py-1 font-mono text-[11px] uppercase tracking-eyebrow text-coral">
          agent throttled · quality reduced
        </div>
      )}

      {/* Mute toggle */}
      {playing && !failed && (
        <button
          onClick={() => setMuted((m) => !m)}
          className="absolute bottom-4 right-4 rounded-full bg-ink/70 px-3 py-1.5 font-mono text-[11px] text-cream/80 hover:text-cream"
        >
          {muted ? "🔇 unmute" : "🔊 mute"}
        </button>
      )}

      <style>{`@keyframes pulseDot{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  );
}

function Equalizer({ active, color }: { active: boolean; color: string }) {
  return (
    <div className="flex items-end gap-1.5" aria-hidden="true">
      {Array.from({ length: 9 }).map((_, i) => (
        <span
          key={i}
          className="w-2 rounded-full"
          style={{
            height: `${14 + ((i * 37) % 44)}px`,
            background: color,
            opacity: active ? 0.85 : 0.3,
          }}
        />
      ))}
    </div>
  );
}
