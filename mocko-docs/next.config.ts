import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.codetunnel.net",
      },
    ],
  },
};

export default nextConfig;
