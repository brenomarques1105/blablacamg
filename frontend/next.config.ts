import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep production checks from overwriting files used by the open dev server.
  distDir: process.env.NODE_ENV === "production" ? ".next-production" : ".next",
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "DENY" },
    ] }];
  },
};

export default nextConfig;
