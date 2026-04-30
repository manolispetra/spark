import { ADDRESSES } from "./addresses";
import { USDC_ADDRESS } from "./chain";

export type TokenInfo = {
  address: `0x${string}`;
  symbol:  string;
  name:    string;
  decimals: number;
  logoURI?: string;
  /** Marker used by the UI to render PROS as native rather than ERC-20. */
  isNative?: boolean;
};

export const NATIVE_PROS: TokenInfo = {
  address: "0x0000000000000000000000000000000000000000",
  symbol: "PROS",
  name: "Pharos",
  decimals: 18,
  isNative: true,
};

export const DEFAULT_TOKENS: TokenInfo[] = [
  NATIVE_PROS,
  {
    address: ADDRESSES.WPROS as `0x${string}`,
    symbol: "WPROS",
    name: "Wrapped PROS",
    decimals: 18,
  },
  {
    address: ADDRESSES.SparkToken as `0x${string}`,
    symbol: "SPARK",
    name: "Spark",
    decimals: 18,
  },
  {
    address: USDC_ADDRESS,
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
  },
];
