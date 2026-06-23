"use client";

import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  defineChain,
  parseUnits,
  formatUnits,
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

const ARC_HEX = `0x${ARC.chainId.toString(16)}` as const;

interface Eip1193 {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
}

function getEthereum(): Eip1193 {
  const eth = (globalThis as { ethereum?: Eip1193 }).ethereum;
  if (!eth) throw new Error("No wallet found. Install MetaMask or a compatible wallet.");
  return eth;
}

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
  // First line only, hard-capped — never dump a viem stack into the UI.
  return msg.split("\n")[0].slice(0, 140);
}

const publicClient = () =>
  createPublicClient({ chain: arcChain, transport: http(ARC.rpcUrl) });

const walletClientFor = (account: Address) =>
  createWalletClient({ account, chain: arcChain, transport: custom(getEthereum()) });

/** Connect the user's real wallet and make sure it's on Arc testnet. */
export async function connectWallet(): Promise<Address> {
  const eth = getEthereum();
  const accounts = (await eth.request({ method: "eth_requestAccounts" })) as Address[];
  await ensureArc();
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

// ---- Key-free reads (no signing) -----------------------------------------

export async function readWalletUsdc(addr: Address): Promise<string> {
  const v = (await publicClient().readContract({
    address: ARC.usdc as Address,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [addr],
  })) as bigint;
  return formatUnits(v, 6);
}

export async function readGatewayAvailable(addr: Address): Promise<string> {
  const v = (await publicClient().readContract({
    address: ARC.gatewayWallet as Address,
    abi: GATEWAY_WALLET_ABI,
    functionName: "availableBalance",
    args: [ARC.usdc as Address, addr],
  })) as bigint;
  return formatUnits(v, 6);
}

export async function readWithdrawable(addr: Address): Promise<string> {
  const v = (await publicClient().readContract({
    address: ARC.gatewayWallet as Address,
    abi: GATEWAY_WALLET_ABI,
    functionName: "withdrawableBalance",
    args: [ARC.usdc as Address, addr],
  })) as bigint;
  return formatUnits(v, 6);
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
  return walletClientFor(from).writeContract({
    address: ARC.usdc as Address,
    abi: ERC20_ABI,
    functionName: "transfer",
    args: [sessionAddr, parseUnits(amountUsd, 6)],
  });
}

/** Streamer: begin withdrawing earnings (becomes withdrawable after the delay). */
export async function initiateWithdraw(from: Address, amountUsd: string): Promise<Hex> {
  return walletClientFor(from).writeContract({
    address: ARC.gatewayWallet as Address,
    abi: GATEWAY_WALLET_ABI,
    functionName: "initiateWithdrawal",
    args: [ARC.usdc as Address, parseUnits(amountUsd, 6)],
  });
}

/** Streamer: finalize a matured withdrawal back to the wallet. */
export async function finalizeWithdraw(from: Address): Promise<Hex> {
  return walletClientFor(from).writeContract({
    address: ARC.gatewayWallet as Address,
    abi: GATEWAY_WALLET_ABI,
    functionName: "withdraw",
    args: [ARC.usdc as Address],
  });
}
