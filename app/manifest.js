import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function manifest() {
  const s = await getSettings();
  return {
    id: "/",
    name: s.siteName,
    short_name: s.siteName.length > 12 ? s.siteName.split(" ").slice(0, 2).join(" ") : s.siteName,
    description: "Premium tools at real prices. Order, track and manage your access from your phone.",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0A0A0C",
    theme_color: "#0A0A0C",
    categories: ["business", "productivity", "shopping"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "All Tools", url: "/tools", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "My Orders", url: "/account", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Basket", url: "/checkout", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
