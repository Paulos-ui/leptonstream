"use client";

import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import type { GatewayClient } from "@circle-fin/x402-batching/client";
import type { Hex } from "viem";
import { ARC } from "./arc";

// CAPPED SESSION SIGNER (testnet). Gateway's buyer flow signs an authorization
// every few seconds; a human can't approve a wallet popup that often, so the
// stream is driven by a session key that signs autonomously up to the user's
// ceiling. The user's REAL connected wallet is their identity and funds this
// session — so it's a delegated spending session, not a throwaway identity.
// Production: swap for Circle Developer-Controlled (MPC) wallets behind this
// same module. The SDK is dynamically imported so it never enters the
// synchronous browser bundle.
const KEY = "lepton.session.pk";

export function loadOrCreateKey(): Hex {
  if (typeof window === "undefined") return generatePrivateKey();
  let pk = window.localStorage.getItem(KEY) as Hex | null;
  if (!pk) {
    pk = generatePrivateKey();
    window.localStorage.setItem(KEY, pk);
  }
  return pk;
}

export function addressOf(pk: Hex): string {
  return privateKeyToAccount(pk).address;
}

export async function makeClient(pk: Hex): Promise<GatewayClient> {
  const { GatewayClient } = await import("@circle-fin/x402-batching/client");
  return new GatewayClient({
    chain: ARC.chainName,
    privateKey: pk,
    rpcUrl: ARC.rpcUrl,
  });
}

export interface Funds {
  walletUsdc: string;
  gatewayAvailable: string;
}

export async function getFunds(client: GatewayClient): Promise<Funds> {
  const b = await client.getBalances();
  return {
    walletUsdc: b.wallet.formatted,
    gatewayAvailable: b.gateway.formattedAvailable,
  };
}

export async function depositToGateway(client: GatewayClient, amount: string) {
  return client.deposit(amount);
}
