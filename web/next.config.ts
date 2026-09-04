import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["yahoo-finance2"],
  transpilePackages: ["mermaid"],
};

export default nextConfig;
