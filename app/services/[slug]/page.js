import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ShieldCheck, Globe, MessageSquareText, PackageCheck } from "lucide-react";
import SiteShell from "@/components/SiteShell";
import StoreCard from "@/components/StoreCard";
import JsonLd from "@/components/JsonLd";
import RichDescription from "@/components/RichDescription";
import ServicePackages from "@/components/ServicePackages";
import { PinButton, Gallery } from "@/components/StoreBits";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { usdOf, images, parsePackages, fmtUsd } from "@/lib/catalog";
import { absUrl, clipText, ogFallback, siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

const getService = (slug) => prisma.service.findFirst({ where: { slug, active: true } });
const plain = (t) => String(t || "").replace(/^\s*-\s*/gm, "").replace(/\s+/g, " ").trim();

export async function generateMetadata({ params }) {
  const x = await getService(params.slug);
  if (!x) return { title: "Service not found", robots: { index: false } };
  const s = await getSettings();
  const pk = parsePackages(x.packages);
  const low = pk.length ? Math.min(...pk.map((p) => usdOf(p.priceUsd, p.price, s.usdRate) || Infinity)) : null;
  const title = `${x.name}${Number.isFinite(low) ? ` — from ${fmtUsd(low)}` : ""} | ${s.siteName}`;
  const description = clipText(`${x.tagline ? x.tagline + ". " : ""}${plain(x.description)}`, 158);
  const cover = x.image || images(x.gallery)[0];
  const image = cover ? absUrl(s, cover) : ogFallback(s);
  return {
    title,
    description,
    alternates: { canonical: `/services/${x.slug}` },
    openGraph: { type: "website", siteName: s.siteName, title, description, url: `/services/${x.slug}`, images: [{ url: image, alt: x.name }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function ServicePage({ params }) {
  const x = await getService(params.slug);
  if (!x) notFound();
  const s = await getSettings();
  const packages = parsePackages(x.packages).map((p) => ({ ...p, usd: usdOf(p.priceUsd, p.price, s.usdRate) }));
  if (!packages.length) notFound();
  const pics = [x.image, ...images(x.gallery)].filter(Boolean);
  const url = `${siteUrl(s)}/services/${x.slug}`;
  const others = await prisma.service.findMany({ where: { active: true, NOT: { id: x.id } }, orderBy: [{ featured: "desc" }, { sort: "asc" }], take: 4 });

  const ld = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: x.name,
    serviceType: x.kind,
    description: clipText(plain(x.description), 500),
    image: pics.map((u) => absUrl(s, u)),
    provider: { "@type": "Organization", name: s.siteName, url: siteUrl(s) },
    areaServed: "Worldwide",
    offers: packages.map((p) => ({ "@type": "Offer", name: p.name, url, price: p.usd ? p.usd.toFixed(2) : String(p.price), priceCurrency: p.usd ? "USD" : "BDT", availability: "https://schema.org/InStock" })),
  };

  return (
    <SiteShell>
      <JsonLd data={ld} />
      <div className="container-x pt-28 pb-24">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-mist mb-6">
          <Link href="/" className="hover:text-fg">Home</Link><ChevronRight size={12} />
          <Link href="/services" className="hover:text-fg">Services</Link><ChevronRight size={12} />
          <Link href={`/services?kind=${encodeURIComponent(x.kind)}`} className="hover:text-fg">{x.kind}</Link>
        </nav>

        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-8 lg:gap-12 items-start">
          <div className="space-y-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand">{x.kind}</p>
              <h1 className="font-display text-3xl sm:text-4xl font-bold mt-2 leading-tight">{x.name}</h1>
              {x.tagline && <p className="text-mist text-lg mt-3">{x.tagline}</p>}
            </div>
            <Gallery images={pics} name={x.name} />
            <section>
              <h2 className="font-display text-xl font-semibold mb-4">About this service</h2>
              <RichDescription text={x.description} />
            </section>
            <section>
              <h2 className="font-display text-xl font-semibold mb-4">How it works</h2>
              <ol className="space-y-3">
                {[
                  [Globe, "Choose a package and pay", "Card / Payoneer (USD) or bKash, Nagad, Rocket."],
                  [MessageSquareText, "Send your brief", "Answer a few quick questions in your Client Area - takes 2 minutes."],
                  [PackageCheck, "Receive your files", "Delivered to your account by the date shown, revisions included."],
                ].map(([Icon, t, d], i) => (
                  <li key={t} className="flex gap-4 rounded-xl border border-line bg-panel p-4">
                    <span className="w-9 h-9 rounded-full bg-brand/15 text-brand flex items-center justify-center shrink-0 font-bold text-sm">{i + 1}</span>
                    <span><b className="flex items-center gap-2"><Icon size={15} className="text-brand" /> {t}</b><span className="block text-sm text-mist mt-0.5">{d}</span></span>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <div className="lg:sticky lg:top-24 space-y-4">
            <ServicePackages service={{ id: x.id, name: x.name, image: pics[0] || null }} packages={packages} />
            <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-panel px-4 py-3">
              <span className="flex items-center gap-2 text-xs text-mist"><ShieldCheck size={15} className="text-emerald-400" /> Not happy with the first draft? Revisions are included.</span>
              <PinButton url={url} image={pics[0] ? absUrl(s, pics[0]) : ""} description={`${x.name} — ${x.tagline || x.kind}`} />
            </div>
          </div>
        </div>

        {others.length > 0 && (
          <section className="mt-16">
            <div className="flex items-end justify-between mb-5">
              <h2 className="font-display text-2xl font-semibold">More services</h2>
              <Link href="/services" className="text-sm text-brand hover:underline">See all services</Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {others.map((o) => {
                const pk = parsePackages(o.packages);
                if (!pk.length) return null;
                const c = pk.reduce((a, b) => (b.price < a.price ? b : a));
                return <StoreCard key={o.id} href={`/services/${o.slug}`} name={o.name} kind={o.kind} tagline={o.tagline} image={o.image || images(o.gallery)[0]} usd={usdOf(c.priceUsd, c.price, s.usdRate)} taka={c.price} from={pk.length > 1} featured={o.featured} />;
              })}
            </div>
          </section>
        )}
      </div>
    </SiteShell>
  );
}
