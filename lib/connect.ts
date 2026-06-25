"use client";

import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  defineChain,
  parseUnits,
  type Hex,
  type Address,
} from "viem";
import { ARC } from "./arc";
import { GATEWAY_WALLET_ABI, ERC20_ABI } from "./gateway-abi";
import { BADGE_ABI } from "./badge-abi";

// Minimal viem chain for Arc testnet (USDC is the native gas token).
export const arcChain = defineChain({
  id: ARC.chainId,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: [ARC.rpcUrl] } },
  blockExplorers: { default: { name: "ArcScan", url: ARC.explorer } },
  testnet: true,
});


interface Eip1193 {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(event: string, handler: (...args: unknown[]) => void): void;
  removeListener?(event: string, handler: (...args: unknown[]) => void): void;
}

// ---- Provider discovery (EIP-6963 + legacy window.ethereum) ----------------
// Wallets announce themselves via EIP-6963; some (Brave, multi-wallet setups)
// don't reliably set window.ethereum. We collect announcements, and once a
// provider has authorized an account we PIN it so connect, network switch, and
// every later transaction (withdraw, fund) all use the exact same wallet.
let selectedProvider: Eip1193 | null = null;
const announced: { rdns: string; name: string; provider: Eip1193 }[] = [];

if (typeof window !== "undefined") {
  window.addEventListener("eip6963:announceProvider", (event: Event) => {
    const d = (event as CustomEvent).detail as {
      info?: { rdns?: string; name?: string };
      provider?: Eip1193;
    };
    if (d?.provider && d.info?.rdns && !announced.some((p) => p.rdns === d.info!.rdns)) {
      announced.push({ rdns: d.info.rdns, name: d.info.name ?? d.info.rdns, provider: d.provider });
    }
  });
  try { window.dispatchEvent(new Event("eip6963:requestProvider")); } catch { /* ignore */ }
}

function injected(): Eip1193 | null {
  return (globalThis as { ethereum?: Eip1193 }).ethereum ?? null;
}

function candidates(): Eip1193[] {
  if (typeof window !== "undefined") {
    try { window.dispatchEvent(new Event("eip6963:requestProvider")); } catch { /* ignore */ }
  }
  const list: Eip1193[] = [];
  if (selectedProvider) list.push(selectedProvider);
  const inj = injected();
  if (inj && !list.includes(inj)) list.push(inj);
  for (const a of announced) if (!list.includes(a.provider)) list.push(a.provider);
  return list;
}

function getEthereum(): Eip1193 {
  const p = getProvider();
  if (!p) throw new Error("No wallet found. Install MetaMask or a compatible wallet.");
  return p;
}

/** Provider accessor that never throws (returns the pinned/discovered provider). */
export function getProvider(): Eip1193 | null {
  return selectedProvider ?? injected() ?? announced[0]?.provider ?? null;
}

/** Reconnect silently after a reload: find a provider that already has an
 *  authorized account, pin it, and return the address. No popup. */
export async function silentReconnect(): Promise<Address | null> {
  for (const p of candidates()) {
    try {
      const accts = (await p.request({ method: "eth_accounts" })) as Address[];
      if (accts?.[0]) { selectedProvider = p; return accts[0]; }
    } catch { /* try next */ }
  }
  if (!selectedProvider) selectedProvider = candidates()[0] ?? null;
  return null;
}

export const ARC_HEX = `0x${ARC.chainId.toString(16)}` as const;

export function hasWallet(): boolean {
  return getProvider() !== null;
}

/**
 * Turn a thrown wallet/viem error into a short, safe line.
 * User rejections return "" (a person saying "no" is not an error).
 */
export function walletError(e: unknown): string {
  const err = e as { code?: number; name?: string; shortMessage?: string; message?: string };
  const code = err?.code;
  const msg = err?.shortMessage || err?.message || String(e);
  if (
    code === 4001 ||
    err?.name === "UserRejectedRequestError" ||
    /user rejected|user denied|denied request/i.test(msg)
  ) {
    return "";
  }
  // First line only, with any viem arg/contract dump stripped — never leak a
  // raw request blob into the UI.
  const clean = msg
    .split("\n")[0]
    .split("Request Arguments")[0]
    .split("Contract Call")[0]
    .trim();
  return (clean || "Something went wrong.").slice(0, 140);
}

const publicClient = () =>
  createPublicClient({ chain: arcChain, transport: http(ARC.rpcUrl) });

const walletClientFor = (account: Address) =>
  createWalletClient({ account, chain: arcChain, transport: custom(getEthereum()) });

/** Request account access. Tries each discovered wallet, pins the one that
 *  authorizes, so every later call uses the same provider. */
export async function connectWallet(): Promise<Address> {
  const list = candidates();
  if (!list.length) {
    throw new Error("No wallet found. Install MetaMask or a compatible wallet.");
  }
  let lastErr: unknown;
  for (const p of list) {
    try {
      const accounts = (await p.request({ method: "eth_requestAccounts" })) as Address[];
      if (accounts?.[0]) {
        selectedProvider = p;
        return accounts[0];
      }
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("No account was authorized.");
}

export async function ensureArc(): Promise<void> {
  const eth = getEthereum();
  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ARC_HEX }],
    });
  } catch (e) {
    // 4902 = chain not added yet
    if ((e as { code?: number })?.code === 4902) {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: ARC_HEX,
            chainName: "Arc Testnet",
            nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
            rpcUrls: [ARC.rpcUrl],
            blockExplorerUrls: [ARC.explorer],
          },
        ],
      });
    } else {
      throw e;
    }
  }
}

// ---- Reads via our server (authoritative Gateway API; no browser CORS) -----

export interface Balances {
  walletUsdc: string;
  available: string;
  withdrawing: string;
  withdrawable: string;
}

export async function fetchBalances(addr: string): Promise<Balances> {
  const r = await fetch(`/api/balance/${addr}`, { cache: "no-store" });
  const d = await r.json();
  return {
    walletUsdc: d.walletUsdc ?? "0",
    available: d.available ?? "0",
    withdrawing: d.withdrawing ?? "0",
    withdrawable: d.withdrawable ?? "0",
  };
}

export interface Incoming {
  id: string;
  status: string;
  from: string;
  amount: string;
  createdAt: string;
  tx?: string;
}

export async function fetchTransfers(addr: string): Promise<Incoming[]> {
  const r = await fetch(`/api/transfers/${addr}`, { cache: "no-store" });
  const d = await r.json();
  return d.transfers ?? [];
}

/** Read the wallet's current chain without prompting. */
export async function isOnArc(): Promise<boolean> {
  const p = getProvider();
  if (!p) return false;
  try {
    const id = (await p.request({ method: "eth_chainId" })) as string;
    return id?.toLowerCase() === ARC_HEX.toLowerCase();
  } catch {
    return false;
  }
}

/** Gate dependent steps on confirmation (e.g. funding before deposit). */
export async function waitForTx(hash: Hex) {
  return publicClient().waitForTransactionReceipt({ hash });
}

// ---- Connected-wallet transactions (one approval popup each) --------------

/** Send USDC from the connected wallet into the capped session signer. */
export async function fundSession(
  from: Address,
  sessionAddr: Address,
  amountUsd: string
): Promise<Hex> {
  await ensureArc();
  return walletClientFor(from).writeContract({
    address: ARC.usdc as Address,
    abi: ERC20_ABI,
    functionName: "transfer",
    args: [sessionAddr, parseUnits(amountUsd, 6)],
  });
}

/** Streamer: begin withdrawing earnings (becomes withdrawable after the delay). */
export async function initiateWithdraw(from: Address, amountUsd: string): Promise<Hex> {
  await ensureArc();
  return walletClientFor(from).writeContract({
    address: ARC.gatewayWallet as Address,
    abi: GATEWAY_WALLET_ABI,
    functionName: "initiateWithdrawal",
    args: [ARC.usdc as Address, parseUnits(amountUsd, 6)],
  });
}

/** Streamer: finalize a matured withdrawal back to the wallet. */
export async function finalizeWithdraw(from: Address): Promise<Hex> {
  await ensureArc();
  return walletClientFor(from).writeContract({
    address: ARC.gatewayWallet as Address,
    abi: GATEWAY_WALLET_ABI,
    functionName: "withdraw",
    args: [ARC.usdc as Address],
  });
}

/** Sign a plain message with the connected wallet (used to claim a username). */
export async function signMessage(address: Address, message: string): Promise<string> {
  return walletClientFor(address).signMessage({ account: address, message });
}

/** Mint/upgrade the on-chain badge using a server attestation signature. */
export async function claimBadge(
  from: Address,
  badgeAddress: Address,
  tier: number,
  sig: Hex
): Promise<Hex> {
  await ensureArc();
  return walletClientFor(from).writeContract({
    address: badgeAddress,
    abi: BADGE_ABI,
    functionName: "claim",
    args: [tier, sig],
  });
}
