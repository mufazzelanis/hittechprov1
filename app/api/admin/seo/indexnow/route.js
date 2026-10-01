export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiHelpers";
import { getSettings } from "@/lib/settings";
import { sitemapEntries } from "@/lib/sitemapEntries";
import { submitUrls } from "@/lib/indexnow";

const deny = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

// "Resubmit everything" button in Admin -> Settings -> SEO: pushes every indexable URL (the same list
// the sitemap already exposes) to IndexNow right now, instead of waiting for Bing/Yandex's next crawl.
export async function POST() {
  if (!requireAdmin()) return deny();
  if (!process.env.INDEXNOW_KEY) return NextResponse.json({ error: "INDEXNOW_KEY is not configured in .env" }, { status: 400 });

  const s = await getSettings();
  const entries = await sitemapEntries(s);
  const urls = entries.map((e) => e.url);
  const res = await submitUrls(s, urls);
  if (!res.ok) return NextResponse.json({ error: res.error || `IndexNow responded with status ${res.status}` }, { status: 502 });
  return NextResponse.json({ ok: true, count: urls.length });
}
