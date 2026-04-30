import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
  experimental: { optimizePackageImports: ["lucide-react"] },
};
export default config;
