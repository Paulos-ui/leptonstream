"use client";

import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import type { GatewayClient } from "@circle-fin/x402-batching/client";
import type { Hex } from "viem";
import { ARC } from "./arc";

// TESTNET BURNER ONLY. Gateway's buyer SDK needs an EOA private key (it uses
// ecrecover and does not support smart-contract wallets), so the lowest-friction
// path is a throwaway EOA generated in the browser. Never reuse for real funds.
// Production migration: Circle Developer-Controlled (MPC) wallets behind this
// same module, signing via Circle's Sign Typed Data API.
//
// The SDK is loaded dynamically (not statically imported) so it never lands in
// the synchronous browser bundle — it's pulled in only when a real session runs.
const KEY = "lepton.burner.pk";

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
