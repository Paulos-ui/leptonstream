"use client";

import { useEffect, useRef, useState } from "react";

// Default public HLS test stream (overridable via ?src=). The stream is freely
// visible — LeptonStream is a SUPPORT layer, not pay-to-unlock — and metering
// runs alongside playback.
const DEFAULT_SRC = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

function youTubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|live\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  return m ? m[1] : null;
}

export default function VideoStream({
  src = DEFAULT_SRC,
  playing,
  quality,
  color,
  onQuality,
  onActive,
}: {
  src?: string;
  playing: boolean;
  quality: number;
  color: string;
  onQuality?: (q: number) => void;
  onActive?: (active: boolean) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [muted, setMuted] = useState(true);
  const [failed, setFailed] = useState(false);
  const low = playing && quality <= 0.5;
  const yt = youTubeId(src);

  // Attach the source (hls.js where needed, native HLS / direct otherwise).
  useEffect(() => {
    if (yt) return; // YouTube renders via iframe below
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
          } else setFailed(true);
        })
        .catch(() => setFailed(true));
    } else {
      video.src = src;
    }
    // The stream plays as soon as it's ready — visibility is not gated on payment.
    video.play().catch(() => { /* autoplay rejection is fine; user can tap */ });

    return () => {
      cancelled = true;
      hls?.destroy();
    };
  }, [src, yt]);

  // Real quality signal from playback (buffering / stalls / tab-hidden).
  useEffect(() => {
    if (yt) return;
    const video = videoRef.current;
    if (!video) return;
    const good = () => { onQuality?.(document.hidden ? 0.3 : 1); onActive?.(!document.hidden && !video.paused); };
    const bad = () => { onQuality?.(0.3); onActive?.(false); };
    const onPause = () => onActive?.(false);
    const onPlay = () => onActive?.(!document.hidden);
    const vis = () => { onQuality?.(document.hidden ? 0.3 : 1); onActive?.(!document.hidden && !video.paused); };
    video.addEventListener("playing", good);
    video.addEventListener("canplay", good);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onPause);
    video.addEventListener("waiting", bad);
    video.addEventListener("stalled", bad);
    document.addEventListener("visibilitychange", vis);
    return () => {
      video.removeEventListener("playing", good);
      video.removeEventListener("canplay", good);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onPause);
      video.removeEventListener("waiting", bad);
      video.removeEventListener("stalled", bad);
      document.removeEventListener("visibilitychange", vis);
    };
  }, [onQuality, onActive, yt]);

  // YouTube: can't read iframe playback, but still gate metering on tab focus
  // so a hidden tab never accrues.
  useEffect(() => {
    if (!yt) return;
    const vis = () => onActive?.(!document.hidden);
    onActive?.(!document.hidden);
    document.addEventListener("visibilitychange", vis);
    return () => document.removeEventListener("visibilitychange", vis);
  }, [yt, onActive]);

  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl border border-ink/15 bg-ink">
      {yt ? (
        <iframe
          className="h-full w-full"
          src={`https://www.youtube.com/embed/${yt}?autoplay=1&mute=1&playsinline=1&rel=0`}
          title="stream"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <video
          ref={videoRef}
          muted={muted}
          autoPlay
          loop
          playsInline
          className="h-full w-full object-cover transition-[filter] duration-500"
          style={{ filter: low ? "blur(6px) saturate(0.6) brightness(0.8)" : "none", opacity: failed ? 0 : 1 }}
        />
      )}

      {/* Fallback only when a non-YouTube stream fails to load */}
      {!yt && failed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-ink/80">
          <Equalizer color={color} />
          <span className="font-mono text-[11px] uppercase tracking-eyebrow text-cream/40">stream offline — demo visual</span>
        </div>
      )}

      {/* Status badge — reflects support state, not video visibility */}
      <div className="absolute left-4 top-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-eyebrow text-cream/80">
        <span className="inline-block h-2 w-2 rounded-full" style={{ background: playing ? "#FF6B57" : "#5F5E5A", animation: playing ? "pulseDot 1.6s ease-in-out infinite" : "none" }} />
        {playing ? "live · supporting" : "live"}
      </div>

      {low && (
        <div className="absolute right-4 top-4 rounded-full bg-ink/70 px-2.5 py-1 font-mono text-[11px] uppercase tracking-eyebrow text-coral">
          agent throttled · quality reduced
        </div>
      )}

      {!yt && !failed && (
        <button onClick={() => setMuted((m) => !m)} className="absolute bottom-4 right-4 rounded-full bg-ink/70 px-3 py-1.5 font-mono text-[11px] text-cream/80 hover:text-cream">
          {muted ? "🔇 unmute" : "🔊 mute"}
        </button>
      )}

      <style>{`@keyframes pulseDot{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  );
}

function Equalizer({ color }: { color: string }) {
  return (
    <div className="flex items-end gap-1.5" aria-hidden="true">
      {Array.from({ length: 9 }).map((_, i) => (
        <span key={i} className="w-2 rounded-full" style={{ height: `${14 + ((i * 37) % 44)}px`, background: color, opacity: 0.4 }} />
      ))}
    </div>
  );
}
