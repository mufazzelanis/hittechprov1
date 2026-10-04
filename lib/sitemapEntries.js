import { prisma } from "./db";
import { siteUrl } from "./seo";

// Every page worth indexing: home, catalog pages, legal pages and one URL per active tool. Shared by
// app/sitemap.js (what Google/Bing crawl on their own schedule) and the IndexNow "resubmit everything"
// admin action (which pushes the same list immediately instead of waiting for the next crawl).
export async function sitemapEntries(s) {
  const base = siteUrl(s);
  const now = new Date();
  const fixed = [
    ["", 1, "daily"],
    ["/tools", 0.9, "daily"],
    ["/templates", 0.9, "daily"],
    ["/services", 0.9, "weekly"],
    ["/limits", 0.7, "daily"],
    ...(s.freeOffersOn === "true" ? [["/free-offers", 0.6, "weekly"]] : []),
    ...(s.promptVaultOn === "true" ? [["/prompts", 0.6, "weekly"]] : []),
    ...(s.smmPanelOn === "true" ? [["/smm-panel", 0.8, "daily"]] : []),
    ...(s.affiliateOn === "true" ? [["/affiliate", 0.6, "monthly"]] : []),
    ["/privacy", 0.3, "yearly"],
    ["/terms", 0.3, "yearly"],
    ["/refund", 0.3, "yearly"],
  ].map(([p, priority, changeFrequency]) => ({ url: base + p, lastModified: now, changeFrequency, priority }));

  let tools = [];
  try {
    tools = (await prisma.tool.findMany({ where: { active: true }, select: { slug: true, createdAt: true } })).map((t) => ({
      url: `${base}/tool/${t.slug}`,
      lastModified: t.createdAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch {}

  let store = [];
  try {
    const [products, services] = await Promise.all([
      prisma.product.findMany({ where: { active: true }, select: { slug: true, createdAt: true } }),
      prisma.service.findMany({ where: { active: true }, select: { slug: true, createdAt: true } }),
    ]);
    store = [
      ...products.map((p) => ({ url: `${base}/templates/${p.slug}`, lastModified: p.createdAt, changeFrequency: "weekly", priority: 0.8 })),
      ...services.map((x) => ({ url: `${base}/services/${x.slug}`, lastModified: x.createdAt, changeFrequency: "weekly", priority: 0.8 })),
    ];
  } catch {}
  return [...fixed, ...tools, ...store];
}
