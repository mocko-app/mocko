import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/docs",
  output: "export",
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.codetunnel.net",
      },
    ],
  },
};

export default nextConfig;
