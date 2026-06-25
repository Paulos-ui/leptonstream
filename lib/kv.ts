// Tiny KV layer. Uses Vercel KV / Upstash Redis over REST when configured
// (KV_REST_API_URL + KV_REST_API_TOKEN), otherwise falls back to an in-memory
// map so local dev works with zero setup. NOTE: the memory fallback resets on
// every serverless invocation — provision a KV store for production
// persistence (Vercel → Storage → KV is the one-click path; it sets the env
// vars automatically).

const URL = process.env.KV_REST_API_URL;
const TOKEN = process.env.KV_REST_API_TOKEN;
export const kvConfigured = !!(URL && TOKEN);

const mem = new Map<string, string>();

async function cmd<T = unknown>(args: (string | number)[]): Promise<T | null> {
  if (!kvConfigured) return memCmd<T>(args);
  const res = await fetch(URL!, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { result?: T };
  return data?.result ?? null;
}

function memCmd<T>(args: (string | number)[]): T | null {
  const [op, key, val] = args as [string, string, string];
  switch (op) {
    case "GET":
      return (mem.get(key) ?? null) as T | null;
    case "SET":
      mem.set(key, String(val));
      return "OK" as unknown as T;
    case "SETNX":
      if (mem.has(key)) return 0 as unknown as T;
      mem.set(key, String(val));
      return 1 as unknown as T;
    case "INCR": {
      const n = (parseInt(mem.get(key) ?? "0", 10) || 0) + 1;
      mem.set(key, String(n));
      return n as unknown as T;
    }
    default:
      return null;
  }
}

export const kv = {
  get: (key: string) => cmd<string>(["GET", key]),
  set: (key: string, value: string) => cmd(["SET", key, value]),
  setnx: (key: string, value: string) => cmd<number>(["SETNX", key, value]),
  incr: (key: string) => cmd<number>(["INCR", key]),
};
