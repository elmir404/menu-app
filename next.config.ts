import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "pubzade.az",
      },
      {
        protocol: "https",
        hostname: "walvero.com",
      },
      {
        protocol: "https",
        hostname: "cdn.walvero.com",
      },
      {
        protocol: "https",
        hostname: "api.walvero.com",
      },
    ],
  },
};

export default nextConfig;
