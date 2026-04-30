/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
  experimental: { optimizePackageImports: ["lucide-react"] },
};
export default config;
