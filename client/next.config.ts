import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Point to monorepo root so Turbopack can resolve hoisted node_modules
    root: path.join(__dirname, ".."),
  },
};

export default nextConfig;
