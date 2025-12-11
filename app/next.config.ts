import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "news.ycombinator.com",
      },
      {
        protocol: "https",
        hostname: "www.redditstatic.com",
      },
      {
        protocol: "https",
        hostname: "dev.to",
      },
      {
        protocol: "https",
        hostname: "www.producthunt.com",
      },
      {
        protocol: "https",
        hostname: "lobste.rs",
      },
      {
        protocol: "https",
        hostname: "github.com",
      },
    ],
  },
};

export default nextConfig;
