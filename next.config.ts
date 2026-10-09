import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  devIndicators: false,
  env: {
    API_URL: process.env.API_URL,
  },
};

export default nextConfig;
