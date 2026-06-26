// Shared by the claim API (server, to verify) and the studio (client, to sign).
// Kept dependency-free so it can be imported on either side.
export const claimMessage = (username: string, address: string) =>
  `LeptonStream — claim the username @${username.trim().toLowerCase()} for ${address.toLowerCase()}`;

export const listingMessage = (address: string) =>
  `LeptonStream — update my discovery listing for ${address.toLowerCase()}`;
