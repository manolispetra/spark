/**
 * Deployed Spark DEX contract addresses on Pharos Mainnet.
 *
 * IMPORTANT: After you run `pnpm deploy:pharos` in /contracts, copy values
 * from `contracts/deployments/pharos.json` into the strings below.
 *
 * The DEPLOYER address is the wallet that ran the deployment. It is the only
 * wallet that can:
 *   • Withdraw raised PROS from the presale
 *   • Pause / start / end the presale
 *   • Adjust factory protocol fee
 *   • Adjust token-creation fee
 *
 * The frontend reads the on-chain `owner()` of each contract to gate the
 * admin menu — but we keep DEPLOYER here as a UX hint so the "Admin" link
 * is hidden for non-deployer wallets without a round-trip RPC call.
 */
export const ADDRESSES = {
  WPROS:          "0x0d2108b4a2fAe2fb4c47f939bb955ee447638e01",
  SparkToken:     "0xEA4Bc033b5e7cD00330D81188c9232D636D61d2F",
  SparkV2Factory: "0x3640cb44FA2840EcA7d57Ed1A4458F33d0aa8f6b",
  SparkV2Router:  "0xd443bCbDD9DA229FD3158c56CBAAf98DD2401c5e",
  SparkPresale:   "0x29DCfBDA008be74380Afc1289D5C68eC9540a304",
  TokenFactory:   "0x83B9EFD29cC3a868a727447ce6ef6d94D83Fb06D",
  /** init-code hash from `factory.pairCodeHash()` — used for off-chain pairFor() */
  PAIR_CODE_HASH: "0xdab61aba53b2b9981d3812071db46a5efda4da4eb80dbeb5d2f004600dbf8b92",
  /** Wallet that deployed the contracts (admin). */
  DEPLOYER:       "0xF0e864FBAB52a87E851d91C3f98966CEB78e5730",
} as const;

/** Block number at which Spark contracts were deployed (for log queries). */
export const DEPLOYMENT_BLOCK = 0n;
