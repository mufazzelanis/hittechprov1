export const dynamic = "force-static";

// Separate installable "HiT Admin" app that opens straight into the admin panel.
export function GET() {
  const body = {
    id: "/admin",
    name: "HiT Tech Pro Admin",
    short_name: "HiT Admin",
    start_url: "/admin",
    scope: "/admin",
    display: "standalone",
    background_color: "#0A0A0C",
    theme_color: "#0A0A0C",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
  return new Response(JSON.stringify(body), { headers: { "Content-Type": "application/manifest+json" } });
}
