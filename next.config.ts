import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['10.182.132.142', 'localhost:3000'],
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@tsparticles/react",
      "@tsparticles/engine",
      "@tsparticles/slim"
    ]
  }
} as any;

export default nextConfig;
