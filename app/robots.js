import { getSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function robots() {
  const base = siteUrl(await getSettings());
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/account", "/checkout", "/login", "/api/"] }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
