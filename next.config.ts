import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["images.microcms-assets.io"], // microCMSの画像を許可
  },
};

export default nextConfig;
