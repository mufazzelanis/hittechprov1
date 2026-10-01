import Link from "next/link";
import { Share2, Layers, Zap, ShieldCheck, ChevronRight } from "lucide-react";
import SiteShell from "@/components/SiteShell";
import ComingSoon from "@/components/ComingSoon";
import SmmPanelClient from "@/components/SmmPanelClient";
import Reveal from "@/components/Reveal";
import JsonLd from "@/components/JsonLd";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { siteUrl, ogFallback } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const s = await getSettings();
  const on = s.smmPanelOn === "true";
  const title = `${on ? "SMM Panel - Facebook, Instagram, YouTube & TikTok Followers, Likes, Views" : "SMM Panel - Coming soon"} | ${s.siteName}`;
  const description = on
    ? "Buy Facebook, Instagram, YouTube and TikTok followers, likes, views and comments at wholesale reseller prices, with instant, automatic delivery and order tracking."
    : "SMM Panel is launching soon.";
  return {
    title,
    description,
    keywords: on ? ["smm panel", "smm panel bangladesh", "buy facebook followers", "buy instagram followers", "buy youtube views", "buy tiktok followers", "cheap smm panel", s.siteName] : undefined,
    alternates: { canonical: "/smm-panel" },
    robots: on ? undefined : { index: false },
    openGraph: on ? { type: "website", siteName: s.siteName, title, description, url: "/smm-panel", images: [ogFallback(s)] } : undefined,
    twitter: on ? { card: "summary_large_image", title, description, images: [ogFallback(s)] } : undefined,
  };
}

export default async function SmmPanelPage() {
  const s = await getSettings();
  if (s.smmPanelOn !== "true")
    return (
      <SiteShell>
        <ComingSoon s={s} variant="smm" />
      </SiteShell>
    );

  let services = [];
  try {
    services = await prisma.smmService.findMany({
      where: { active: true },
      orderBy: [{ category: "asc" }, { sort: "asc" }],
      select: { id: true, name: true, category: true, type: true, sellRate: true, min: true, max: true, refill: true, cancel: true },
    });
  } catch {}

  const categoryCount = new Set(services.map((s) => s.category)).size;
  const stats = [
    { Icon: Layers, v: services.length.toLocaleString() + "+", l: "Services" },
    { Icon: Share2, v: categoryCount.toLocaleString(), l: "Platforms" },
    { Icon: Zap, v: "Instant", l: "Order start" },
    { Icon: ShieldCheck, v: "Tracked", l: "Every order" },
  ];

  const byCategory = new Map();
  for (const svc of services) {
    if (!byCategory.has(svc.category)) byCategory.set(svc.category, []);
    byCategory.get(svc.category).push(svc);
  }
  const priceValues = services.map((svc) => svc.sellRate).filter((v) => v > 0);

  return (
    <SiteShell>
      {services.length > 0 && (
        <JsonLd data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Service",
              "@id": `${siteUrl(s)}/smm-panel#service`,
              name: "SMM Panel - Social Media Marketing Services",
              description: "Followers, likes, views, comments and more for Facebook, Instagram, YouTube, TikTok and other platforms, delivered automatically at wholesale prices.",
              provider: { "@id": `${siteUrl(s)}/#organization` },
              areaServed: "BD",
              url: `${siteUrl(s)}/smm-panel`,
              offers: priceValues.length ? { "@type": "AggregateOffer", priceCurrency: "BDT", lowPrice: Math.min(...priceValues), highPrice: Math.max(...priceValues), offerCount: services.length } : undefined,
              hasOfferCatalog: {
                "@type": "OfferCatalog",
                name: "SMM Services",
                itemListElement: [...byCategory.entries()].slice(0, 20).map(([category, list]) => ({
                  "@type": "OfferCatalog",
                  name: category,
                  itemListElement: list.slice(0, 5).map((svc) => ({
                    "@type": "Offer",
                    itemOffered: { "@type": "Service", name: svc.name },
                    priceCurrency: "BDT",
                    price: svc.sellRate,
                  })),
                })),
              },
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: siteUrl(s) },
                { "@type": "ListItem", position: 2, name: "SMM Panel", item: `${siteUrl(s)}/smm-panel` },
              ],
            },
          ],
        }} />
      )}
      <section className="relative pt-32 pb-8 bg-grain overflow-hidden">
        <div className="orb absolute -top-24 left-1/4 w-96 h-96 rounded-full bg-brand/15 blur-[110px] pointer-events-none" />
        <div className="orb absolute top-20 right-0 w-80 h-80 rounded-full bg-gold/10 blur-[110px] pointer-events-none" style={{ animationDelay: "-6s" }} />
        <div className="container-x max-w-6xl relative">
          <nav className="flex items-center gap-1.5 text-xs text-mist mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-fg">Home</Link><ChevronRight size={12} />
            <span className="text-fg">SMM Panel</span>
          </nav>
          <Reveal className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-flex items-center gap-2 text-xs px-3.5 py-1.5 rounded-full border border-brand/40 text-brand bg-brand/10 mb-5">
              <Share2 size={13} /> SMM Panel
            </span>
            <h1 className="font-display text-4xl sm:text-5xl font-bold">Grow your social media, instantly</h1>
            <p className="text-mist mt-4 leading-relaxed">Followers, likes, views and more — wholesale prices, real automatic delivery.</p>
          </Reveal>

          {services.length > 0 && (
            <Reveal delay={0.1} className="max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {stats.map(({ Icon, v, l }) => (
                <div key={l} className="rounded-xl border border-line bg-panel/70 backdrop-blur px-3 py-3.5 text-center">
                  <Icon size={16} className="mx-auto text-brand mb-1.5" />
                  <p className="font-display font-bold text-lg leading-none">{v}</p>
                  <p className="text-[11px] text-mist mt-1">{l}</p>
                </div>
              ))}
            </Reveal>
          )}
        </div>
      </section>
      <SmmPanelClient services={services} />
    </SiteShell>
  );
}
