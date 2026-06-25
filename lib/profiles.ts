import { kv } from "./kv";

export interface Profile {
  address: string; // lowercased
  username: string;
  createdAt: number;
  referredBy?: string; // referrer's address (lowercased)
}

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export function normalizeUsername(u: string): string {
  return u.trim().toLowerCase();
}
export function validUsername(u: string): boolean {
  return USERNAME_RE.test(u);
}

const pKey = (addr: string) => `profile:${addr.toLowerCase()}`;
const uKey = (uname: string) => `uname:${uname}`;
const rKey = (addr: string) => `refcount:${addr.toLowerCase()}`;

export async function getProfileByAddress(addr: string): Promise<Profile | null> {
  const raw = await kv.get(pKey(addr));
  return raw ? (JSON.parse(raw) as Profile) : null;
}

export async function getAddressByUsername(uname: string): Promise<string | null> {
  return kv.get(uKey(normalizeUsername(uname)));
}

export async function getReferralCount(addr: string): Promise<number> {
  const raw = await kv.get(rKey(addr));
  return raw ? parseInt(raw, 10) || 0 : 0;
}

/** Resolve a handle that may be a username or a 0x address → Profile (or null). */
export async function resolveProfile(handle: string): Promise<Profile | null> {
  if (/^0x[a-fA-F0-9]{40}$/.test(handle)) return getProfileByAddress(handle);
  const addr = await getAddressByUsername(handle);
  return addr ? getProfileByAddress(addr) : null;
}

export type ClaimResult =
  | { ok: true; profile: Profile }
  | { ok: false; error: string };

/**
 * Claim a username for an address. Username uniqueness is enforced atomically
 * via SETNX. `referrer` (if a known profile) is recorded once, on first claim.
 */
export async function claimUsername(
  address: string,
  username: string,
  referrer?: string | null
): Promise<ClaimResult> {
  const addr = address.toLowerCase();
  const uname = normalizeUsername(username);
  if (!validUsername(uname)) {
    return { ok: false, error: "3–20 chars, lowercase letters, numbers or underscore." };
  }

  const existing = await getProfileByAddress(addr);
  if (existing && existing.username === uname) {
    return { ok: true, profile: existing };
  }

  // Reserve the name atomically.
  const reserved = await kv.setnx(uKey(uname), addr);
  if (reserved === 0) {
    const owner = await getAddressByUsername(uname);
    if (owner !== addr) return { ok: false, error: "That username is taken." };
  }

  // Free the old name if this address is renaming.
  if (existing && existing.username !== uname) {
    await kv.set(uKey(existing.username), ""); // tombstone
  }

  let referredBy = existing?.referredBy;
  if (!existing && referrer) {
    const ref = referrer.toLowerCase();
    if (ref !== addr) {
      const refProfile = await getProfileByAddress(ref);
      if (refProfile) {
        referredBy = ref;
        await kv.incr(rKey(ref));
      }
    }
  }

  const profile: Profile = {
    address: addr,
    username: uname,
    createdAt: existing?.createdAt ?? Date.now(),
    referredBy,
  };
  await kv.set(pKey(addr), JSON.stringify(profile));
  return { ok: true, profile };
}
