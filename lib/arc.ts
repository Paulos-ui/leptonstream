// Arc testnet constants. Values mirror CHAIN_CONFIGS.arcTestnet from
// @circle-fin/x402-batching — hardcoded here so client code can import Arc
// metadata without pulling the (Node-oriented) SDK into the browser bundle.
export const ARC = {
  chainName: "arcTestnet" as const,
  chainId: 5042002,
  caip2: "eip155:5042002",
  rpcUrl: "https://rpc.testnet.arc.network",
  explorer: "https://testnet.arcscan.app",
  faucet: "https://faucet.circle.com",
  usdc: "0x3600000000000000000000000000000000000000",
  gatewayWallet: "0x0077777d7EBA4688BDeF3E311b846F25870A19B9",
  facilitatorUrl:
    process.env.FACILITATOR_URL ?? "https://gateway-api-testnet.circle.com",
};

export const txUrl = (hash: string) => `${ARC.explorer}/tx/${hash}`;
export const addrUrl = (addr: string) => `${ARC.explorer}/address/${addr}`;
