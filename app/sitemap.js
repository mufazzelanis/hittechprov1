import { getSettings } from "@/lib/settings";
import { sitemapEntries } from "@/lib/sitemapEntries";

export const dynamic = "force-dynamic";

// Lists every page worth indexing: home, catalog pages, legal pages and one URL per active tool.
export default async function sitemap() {
  return sitemapEntries(await getSettings());
}
