import type { NextConfig } from "next";

const nextConfig = {
  allowedDevOrigins: ['172.22.41.95'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'peoples-treasure.storage.yandexcloud.net',
        pathname: '/**',
      },
    ],
  },
} as NextConfig;

export default nextConfig;