import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "192.168.1.5"],
  turbopack: {
    rules: {
      "*.glsl": { type: "raw" },
      "*.vert": { type: "raw" },
      "*.frag": { type: "raw" },
    },
  },
};

export default nextConfig;
