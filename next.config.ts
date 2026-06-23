import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hardcoded port — Overlord NEVER uses 3000 (that's Documenso)
  allowedDevOrigins: ['100.105.191.123', 'localhost'],
};

export default nextConfig;
