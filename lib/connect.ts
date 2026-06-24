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

function getEthereum(): Eip1193 {
  const eth = (globalThis as { ethereum?: Eip1193 }).ethereum;
  if (!eth) throw new Error("No wallet found. Install MetaMask or a compatible wallet.");
  return eth;
}

/** Provider accessor that never throws (returns null when absent). */
export function getProvider(): Eip1193 | null {
  return (globalThis as { ethereum?: Eip1193 }).ethereum ?? null;
}

export const ARC_HEX = `0x${ARC.chainId.toString(16)}` as const;

export function hasWallet(): boolean {
  return typeof window !== "undefined" && !!(window as { ethereum?: unknown }).ethereum;
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

/** Request account access only. Network selection is a separate, non-blocking step. */
export async function connectWallet(): Promise<Address> {
  const eth = getEthereum();
  const accounts = (await eth.request({ method: "eth_requestAccounts" })) as Address[];
  if (!accounts?.[0]) throw new Error("No account was authorized.");
  return accounts[0];
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
