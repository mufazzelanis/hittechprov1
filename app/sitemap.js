import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

// Lists every page worth indexing: home, catalog pages, legal pages and one URL per active tool.
export default async function sitemap() {
  const s = await getSettings();
  const base = siteUrl(s);
  const now = new Date();
  const fixed = [
    ["", 1, "daily"],
    ["/tools", 0.9, "daily"],
    ["/limits", 0.7, "daily"],
    ...(s.freeOffersOn === "true" ? [["/free-offers", 0.6, "weekly"]] : []),
    ...(s.promptVaultOn === "true" ? [["/prompts", 0.6, "weekly"]] : []),
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
  return [...fixed, ...tools];
}
