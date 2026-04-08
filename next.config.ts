import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Allow mobile devices on the local network to connect during dev
  allowedDevOrigins: [
    "192.168.1.101",
    "192.168.0.0/16",
    "10.0.0.0/8",
    "scores-bowl-worldwide-satisfy.trycloudflare.com",
  ],
  // Allow images from any source (for demo data)
  images: {
    remotePatterns: [],
    unoptimized: true,
  },
  // PWA headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;
