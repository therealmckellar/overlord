import type { NextConfig } from "next";

import nextPWA from 'next-pwa';

const withPWA = nextPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  // Hardcoded port — Overlord NEVER uses 3000 (that's Documenso)
  allowedDevOrigins: ['100.105.191.123', 'localhost'],
  turbopack: {},
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default withPWA(nextConfig);
