import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Check, Download, ShieldCheck, Globe, Headphones, Eye, Sparkles } from "lucide-react";
import SiteShell from "@/components/SiteShell";
import StoreCard from "@/components/StoreCard";
import JsonLd from "@/components/JsonLd";
import RichDescription from "@/components/RichDescription";
import { BuyButtons, PinButton, Gallery } from "@/components/StoreBits";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { usdOf, images, lines, fmtUsd, fmtTaka, parseFiles } from "@/lib/catalog";
import { absUrl, clipText, ogFallback, siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

const getProduct = (slug) => prisma.product.findFirst({ where: { slug, active: true } });
const plain = (t) => String(t || "").replace(/^\s*-\s*/gm, "").replace(/\s+/g, " ").trim();

export async function generateMetadata({ params }) {
  const p = await getProduct(params.slug);
  if (!p) return { title: "Template not found", robots: { index: false } };
  const s = await getSettings();
  const usd = usdOf(p.priceUsd, p.price, s.usdRate);
  const title = `${p.name}${usd ? ` — ${fmtUsd(usd)}` : ""} | ${p.kind} | ${s.siteName}`;
  const description = clipText(`${p.tagline ? p.tagline + ". " : ""}${plain(p.description)}`, 158);
  const cover = p.image || images(p.gallery)[0];
  const image = cover ? absUrl(s, cover) : ogFallback(s);
  return {
    title,
    description,
    alternates: { canonical: `/templates/${p.slug}` },
    openGraph: { type: "website", siteName: s.siteName, title, description, url: `/templates/${p.slug}`, images: [{ url: image, alt: p.name }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function TemplatePage({ params }) {
  const p = await getProduct(params.slug);
  if (!p) notFound();
  const s = await getSettings();
  const usd = usdOf(p.priceUsd, p.price, s.usdRate);
  const pics = [p.image, ...images(p.gallery)].filter(Boolean);
  const included = lines(p.includes);
  const fileCount = parseFiles(p.files).length;
  const url = `${siteUrl(s)}/templates/${p.slug}`;
  const related = await prisma.product.findMany({ where: { active: true, NOT: { id: p.id } }, orderBy: [{ featured: "desc" }, { sort: "asc" }], take: 8 });
  const sameKind = [...related.filter((r) => r.kind === p.kind), ...related.filter((r) => r.kind !== p.kind)].slice(0, 4);
  const item = { type: "product", id: p.id, name: p.name, price: p.price, usd, image: pics[0] || null };

  // Product markup: Google shows price in search, Pinterest turns it into a Product Rich Pin.
  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: clipText(plain(p.description), 500),
    image: pics.map((x) => absUrl(s, x)),
    sku: p.id,
    category: p.kind,
    brand: { "@type": "Brand", name: s.siteName },
    offers: [
      ...(usd ? [{ "@type": "Offer", url, price: usd.toFixed(2), priceCurrency: "USD", availability: "https://schema.org/InStock", itemCondition: "https://schema.org/NewCondition" }] : []),
      { "@type": "Offer", url, price: String(p.price), priceCurrency: "BDT", availability: "https://schema.org/InStock", itemCondition: "https://schema.org/NewCondition" },
    ],
  };

  return (
    <SiteShell>
      <JsonLd data={ld} />
      <div className="container-x pt-28 pb-24">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-mist mb-6">
          <Link href="/" className="hover:text-fg">Home</Link><ChevronRight size={12} />
          <Link href="/templates" className="hover:text-fg">Templates</Link><ChevronRight size={12} />
          <Link href={`/templates?kind=${encodeURIComponent(p.kind)}`} className="hover:text-fg">{p.kind}</Link>
        </nav>

        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-8 lg:gap-12 items-start">
          <Gallery images={pics} name={p.name} />

          <div className="lg:sticky lg:top-24">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand">{p.kind}</p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold mt-2 leading-tight">{p.name}</h1>
            {p.tagline && <p className="text-mist text-lg mt-3">{p.tagline}</p>}

            <div className="mt-6 rounded-2xl border border-line bg-panel p-5">
              <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
                <span className="font-display text-4xl font-bold">{usd ? fmtUsd(usd) : fmtTaka(p.price)}</span>
                {usd && <span className="text-sm text-mist pb-1.5">or {fmtTaka(p.price)} with bKash / Nagad</span>}
              </div>
              <p className="text-xs text-emerald-400 mt-1.5 flex items-center gap-1.5"><Sparkles size={12} /> One-time payment · lifetime access to your files</p>
              <BuyButtons item={item} className="mt-5" />
              {p.previewUrl && /^https?:\/\//i.test(p.previewUrl) && (
                <a href={p.previewUrl} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-line py-2.5 text-sm font-medium hover:border-mist transition-colors"><Eye size={15} /> Live preview</a>
              )}
            </div>

            <ul className="mt-5 grid sm:grid-cols-2 gap-3 text-sm">
              <li className="flex items-start gap-2.5"><Download size={16} className="text-brand shrink-0 mt-0.5" /> <span><b className="block">Delivered to your account</b><span className="text-mist text-xs">{fileCount ? `${fileCount} file${fileCount > 1 ? "s" : ""}, ` : ""}download anytime from Client Area</span></span></li>
              <li className="flex items-start gap-2.5"><Globe size={16} className="text-brand shrink-0 mt-0.5" /> <span><b className="block">Pay your way</b><span className="text-mist text-xs">Card / Payoneer (USD) or bKash, Nagad</span></span></li>
              <li className="flex items-start gap-2.5"><ShieldCheck size={16} className="text-brand shrink-0 mt-0.5" /> <span><b className="block">Commercial use</b><span className="text-mist text-xs">Use it for your business and clients</span></span></li>
              <li className="flex items-start gap-2.5"><Headphones size={16} className="text-brand shrink-0 mt-0.5" /> <span><b className="block">Real support</b><span className="text-mist text-xs">Help from the designer who made it</span></span></li>
            </ul>

            <div className="mt-5 flex items-center gap-3">
              <PinButton url={url} image={pics[0] ? absUrl(s, pics[0]) : ""} description={`${p.name} — ${p.tagline || p.kind}`} />
              <span className="text-xs text-mist">Save it for later on Pinterest</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-8 lg:gap-12 mt-14">
          <section>
            <h2 className="font-display text-xl font-semibold mb-4">About this template</h2>
            <RichDescription text={p.description} />
          </section>
          {included.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-semibold mb-4">What's included</h2>
              <ul className="rounded-2xl border border-line bg-panel divide-y divide-line">
                {included.map((x) => <li key={x} className="flex items-start gap-3 px-4 py-3 text-sm"><Check size={16} className="text-emerald-400 shrink-0 mt-0.5" /> {x}</li>)}
              </ul>
            </section>
          )}
        </div>

        {sameKind.length > 0 && (
          <section className="mt-16">
            <div className="flex items-end justify-between mb-5">
              <h2 className="font-display text-2xl font-semibold">You may also like</h2>
              <Link href="/templates" className="text-sm text-brand hover:underline">See all templates</Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {sameKind.map((r) => <StoreCard key={r.id} href={`/templates/${r.slug}`} name={r.name} kind={r.kind} tagline={r.tagline} image={r.image || images(r.gallery)[0]} usd={usdOf(r.priceUsd, r.price, s.usdRate)} taka={r.price} featured={r.featured} />)}
            </div>
          </section>
        )}
      </div>
    </SiteShell>
  );
}
