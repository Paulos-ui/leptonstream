// Owncast exposes a public, unauthenticated API on every instance. We use it to
// show the streamer's real LIVE status + viewer count and to pull their HLS feed
// into our player — no changes to their server required.

export interface OwncastStatus {
  online: boolean;
  viewerCount: number;
  streamTitle?: string;
}

export function normalizeServer(server: string): string {
  let s = server.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  return s;
}

export function hlsUrl(server: string): string {
  return `${normalizeServer(server)}/hls/stream.m3u8`;
}

export async function getStatus(server: string): Promise<OwncastStatus> {
  const res = await fetch(`${normalizeServer(server)}/api/status`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`status ${res.status}`);
  const d = (await res.json()) as {
    online?: boolean;
    viewerCount?: number;
    streamTitle?: string;
  };
  return {
    online: !!d.online,
    viewerCount: d.viewerCount ?? 0,
    streamTitle: d.streamTitle,
  };
}

export async function getInstanceName(server: string): Promise<string | undefined> {
  try {
    const res = await fetch(`${normalizeServer(server)}/api/config`, {
      cache: "no-store",
    });
    if (!res.ok) return undefined;
    const d = (await res.json()) as { name?: string };
    return d.name;
  } catch {
    return undefined;
  }
}
