import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: true,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Everything except the public booking widget refuses to be framed. The widget
      // (/stay/[slug]) must stay embeddable on hotels' own websites; its portal sub-route
      // (/stay/[slug]/account) holds guest data, so it is not.
      {
        source: "/:path((?!stay/[^/]+/?$).*)",
        headers: [{ key: "X-Frame-Options", value: "DENY" }],
      },
    ];
  },
};

export default nextConfig;
