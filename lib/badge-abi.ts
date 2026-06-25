// Minimal ABI for the LeptonBadge soulbound ERC-721 (see contracts/LeptonBadge.sol).
export const BADGE_ABI = [
  { type: "function", name: "nonces", stateMutability: "view", inputs: [{ name: "", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "tierOf", stateMutability: "view", inputs: [{ name: "", type: "address" }], outputs: [{ name: "", type: "uint8" }] },
  { type: "function", name: "tokenIdOf", stateMutability: "view", inputs: [{ name: "", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "claim", stateMutability: "nonpayable", inputs: [{ name: "tier", type: "uint8" }, { name: "sig", type: "bytes" }], outputs: [] },
] as const;
