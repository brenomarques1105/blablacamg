import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel expects the standard .next output. Keep local production builds separate.
  distDir: process.env.NODE_ENV === "production" && process.env.VERCEL !== "1"
    ? ".next-production"
    : ".next",
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "DENY" },
    ] }];
  },
};

export default nextConfig;
