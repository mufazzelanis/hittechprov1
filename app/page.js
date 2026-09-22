import Hero from "@/components/Hero";
import HeroPanels from "@/components/HeroPanels";
import ToolsGrid from "@/components/ToolsGrid";
import Bundles from "@/components/Bundles";
import CustomPack from "@/components/CustomPack";
import DemoStats from "@/components/DemoStats";
import TrustStats from "@/components/TrustStats";
import WhyChoose from "@/components/WhyChoose";
import Testimonials from "@/components/Testimonials";
import Guarantee from "@/components/Guarantee";
import FAQ from "@/components/FAQ";
import ToolMarquee from "@/components/ToolMarquee";
import SiteShell from "@/components/SiteShell";
import { prisma } from "@/lib/db";
import { splitDescription } from "@/lib/toolText";
import { getSettings } from "@/lib/settings";
import { getChannels } from "@/lib/channels";
import { getToolInfo } from "@/lib/limits";
import { ogFallback } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const s = await getSettings();
  return {
    title: { absolute: s.seoTitle },
    description: s.seoDescription,
    alternates: { canonical: "/" },
    openGraph: { type: "website", siteName: s.siteName, title: s.seoTitle, description: s.seoDescription, url: "/", images: [ogFallback(s)] },
    twitter: { card: "summary_large_image", title: s.seoTitle, description: s.seoDescription, images: [ogFallback(s)] },
  };
}

export default async function Home() {
  const [s, tools, categories, bundles, plans, reviews, faqs] = await Promise.all([
    getSettings(),
    prisma.tool.findMany({ where: { active: true }, include: { category: true }, orderBy: [{ sort: "asc" }, { createdAt: "desc" }] }),
    prisma.category.findMany({ where: { active: true }, orderBy: { sort: "asc" } }),
    prisma.bundle.findMany({ where: { active: true }, orderBy: { sort: "asc" } }),
    prisma.packPlan.findMany({ where: { active: true }, orderBy: { sort: "asc" } }),
    prisma.review.findMany({ where: { active: true }, orderBy: { sort: "asc" } }),
    prisma.faq.findMany({ where: { active: true }, orderBy: { sort: "asc" } }),
  ]);

  const info = await getToolInfo();
  const soon = (id) => !!info[id]?.soon;
  const toolsView = tools.map((t) => ({ soon: soon(t.id),
    id: t.id, slug: t.slug, name: t.name, description: splitDescription(t.description).intro, feats: splitDescription(t.description).feats, image: t.image, price: t.price,
    duration: t.duration, accent: t.accent, category: t.category?.name || null,
  }));
  const lowest = tools.length ? Math.min(...tools.map((t) => t.price)) : s.startingPrice;

  return (
    <SiteShell>
        <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.slice(0, 10).map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })) }} />
        <HeroPanels s={s} tools={toolsView} categories={categories.map((c) => c.name)} bundles={bundles.map((b) => ({ ...b, soon: soon(b.id) }))} plans={plans.map((p) => ({ ...p, soon: soon(p.id) }))} />
        <Hero s={{ ...s, startingPrice: lowest }} />
        <ToolMarquee names={tools.map((t) => t.name)} label={s.marqueeLabel} />
        <ToolsGrid tools={toolsView} categories={categories.map((c) => c.name)} startingPrice={lowest} s={s} channels={getChannels(s)} />
        <Bundles bundles={bundles.map((b) => ({ ...b, soon: soon(b.id) }))} s={s} />
        <CustomPack plans={plans.map((p) => ({ ...p, soon: soon(p.id) }))} s={s} channels={getChannels(s)} />
        <DemoStats s={s} />
        <TrustStats s={s} />
        <WhyChoose s={s} name={s.siteName} />
        <Testimonials reviews={reviews} s={s} />
        <Guarantee s={s} />
        <FAQ faqs={faqs} s={s} />
</SiteShell>
  );
}
