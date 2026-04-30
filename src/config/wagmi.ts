"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { pharosMainnet } from "./chain";
import { http } from "viem";

export const wagmiConfig = getDefaultConfig({
  appName: "Spark DEX",
  // Replace with your own project ID at https://cloud.walletconnect.com
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? "00000000000000000000000000000000",
  chains: [pharosMainnet],
  transports: {
    [pharosMainnet.id]: http(process.env.NEXT_PUBLIC_PHAROS_RPC ?? "https://rpc.pharos.xyz"),
  },
  ssr: true,
});
