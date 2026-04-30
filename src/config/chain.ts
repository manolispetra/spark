import { defineChain } from "viem";

/**
 * Pharos Pacific Ocean Mainnet — Chain ID 1672 (0x688).
 * Native currency: PROS (18 decimals).
 *
 * Notes:
 *   - eth_getLogs is rate-limited to a 100-block window (with fallback to 10k).
 *     Token Explorer paginates events accordingly.
 *   - Public RPC may rate-limit; bring your own (BYOR) endpoint in prod via
 *     NEXT_PUBLIC_PHAROS_RPC.
 */
export const pharosMainnet = defineChain({
  id: 1672,
  name: "Pharos",
  network: "pharos",
  nativeCurrency: { decimals: 18, name: "PROS", symbol: "PROS" },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_PHAROS_RPC ?? "https://rpc.pharos.xyz"],
    },
    public:  { http: ["https://rpc.pharos.xyz"] },
  },
  blockExplorers: {
    default: { name: "Pharosscan", url: "https://pharosscan.xyz" },
  },
  testnet: false,
});

/** Canonical USDC on Pharos. */
export const USDC_ADDRESS =
  "0xc879c018db60520f4355c26ed1a6d572cdac1815" as `0x${string}`;
