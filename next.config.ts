import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Prevent Next.js from auto-modifying tsconfig.json
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
