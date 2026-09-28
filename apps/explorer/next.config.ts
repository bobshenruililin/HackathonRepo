import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@hackathon-atlas/catalog-index"],
  agentRules: false,
};

export default nextConfig;
