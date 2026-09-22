/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets a verification build run without touching the running dev server's .next folder.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // The site uses plain <img> tags, so the /_next/image optimizer (and its remote-image proxy) is switched off.
  images: { unoptimized: true },
};

const SECURITY = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  ...(process.env.NODE_ENV === "production" ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }] : []),
];

nextConfig.poweredByHeader = false;
nextConfig.headers = async () => [
  { source: "/:path*", headers: SECURITY },
  { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Cache-Control", value: "no-store" }] },
  { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
];

module.exports = nextConfig;
