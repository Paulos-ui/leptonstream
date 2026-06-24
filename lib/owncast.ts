// Owncast public, unauthenticated endpoints. Lets LeptonStream ride alongside
// a streamer's existing Owncast instance without touching their server.
export interface OwncastStatus {
  online: boolean;
  viewerCount: number;
  name?: string;
  lastConnectTime?: string | null;
}

export function normalizeServer(server: string): string {
  let s = server.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  return s;
}

export function hlsUrl(server: string): string {
  return `${normalizeServer(server)}/hls/stream.m3u8`;
}

export async function getStatus(server: string): Promise<OwncastStatus | null> {
  const base = normalizeServer(server);
  try {
    const res = await fetch(`${base}/api/status`, { cache: "no-store" });
    if (!res.ok) return null;
    const s = await res.json();
    return {
      online: !!s.online,
      viewerCount: Number(s.viewerCount ?? 0),
      lastConnectTime: s.lastConnectTime ?? null,
    };
  } catch {
    return null;
  }
}

/** Instance display name from the public config endpoint (best-effort). */
export async function getInstanceName(server: string): Promise<string | null> {
  try {
    const res = await fetch(`${normalizeServer(server)}/api/config`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const c = await res.json();
    return c?.name ?? c?.instanceDetails?.name ?? null;
  } catch {
    return null;
  }
}
