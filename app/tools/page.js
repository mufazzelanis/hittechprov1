import SiteShell from "@/components/SiteShell";
import ToolsCatalog from "@/components/ToolsCatalog";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { ogFallback } from "@/lib/seo";
import { getToolInfo } from "@/lib/limits";
import { splitDescription } from "@/lib/toolText";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const s = await getSettings();
  const description = `Browse every premium tool at ${s.siteName}: SEO, design, AI, video and learning tools with prices, instant access and support.`;
  return {
    title: `All Premium Tools | ${s.siteName}`,
    description,
    alternates: { canonical: "/tools" },
    openGraph: { type: "website", siteName: s.siteName, title: `All Premium Tools | ${s.siteName}`, description, url: "/tools", images: [ogFallback(s)] },
  };
}

export default async function ToolsPage({ searchParams }) {
  const s = await getSettings();
  const info = await getToolInfo();
  const [tools, categories] = await Promise.all([
    prisma.tool.findMany({ where: { active: true }, include: { category: true }, orderBy: [{ sort: "asc" }, { createdAt: "desc" }] }),
    prisma.category.findMany({ where: { active: true }, orderBy: { sort: "asc" } }),
  ]);
  const view = tools.map((t) => ({
    soon: !!info[t.id]?.soon, description: splitDescription(t.description).intro, feats: splitDescription(t.description).feats, id: t.id, slug: t.slug, name: t.name, image: t.image, price: t.price, duration: t.duration, accent: t.accent,
    category: t.category?.name || null,
  }));
  const names = categories.map((c) => c.name);
  const cat = names.includes(searchParams?.cat) ? searchParams.cat : "";
  return (
    <SiteShell>
      <ToolsCatalog s={s} tools={view} categories={names} initialCat={cat} initialQ={String(searchParams?.q || "").slice(0, 60)} />
    </SiteShell>
  );
}
