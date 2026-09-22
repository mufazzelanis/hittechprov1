import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Search, User, ChevronRight, ShieldCheck } from "lucide-react";
import SiteShell from "@/components/SiteShell";
import Reveal from "@/components/Reveal";
import Basket from "@/components/Basket";
import ProductActions from "@/components/ProductActions";
import { ToolCover } from "@/components/ToolsGrid";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { splitDescription } from "@/lib/toolText";
import { getToolInfo, normalizeInfo, statusLabels } from "@/lib/limits";
import { absUrl, siteUrl, clipText, ogFallback } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import TrackEvent from "@/components/TrackEvent";
import { getChannels } from "@/lib/channels";
import { withText, fillMsg, waChannel } from "@/lib/wa";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

async function getTool(slug) {
  return prisma.tool.findFirst({ where: { slug, active: true }, include: { category: true } });
}

export async function generateMetadata({ params }) {
  const t = await getTool(params.slug);
  if (!t) return { title: "Tool not found", robots: { index: false } };
  const s = await getSettings();
  const { intro } = splitDescription(t.description);
  const title = `Buy ${t.name} at ৳${t.price.toLocaleString()} | ${s.siteName}`;
  const description = clipText(`${t.name} for ৳${t.price.toLocaleString()} per ${t.duration}. ${intro}`, 158);
  const image = t.image ? absUrl(s, t.image) : ogFallback(s);
  return {
    title,
    description,
    keywords: [t.name, `${t.name} price`, `buy ${t.name}`, `${t.name} group buy`, t.category?.name, s.siteName].filter(Boolean),
    alternates: { canonical: `/tool/${t.slug}` },
    openGraph: { type: "website", siteName: s.siteName, title, description, url: `/tool/${t.slug}`, images: image ? [{ url: image, alt: t.name }] : undefined },
    twitter: { card: "summary_large_image", title, description, images: image ? [image] : undefined },
  };
}

export default async function ToolPage({ params }) {
  const tool = await getTool(params.slug);
  if (!tool) notFound();

  const uid = getUserId();
  const st = await getSettings();
  const ti = normalizeInfo((await getToolInfo())[tool.id]);
  const [user, cats, related] = await Promise.all([
    uid ? prisma.user.findUnique({ where: { id: uid }, select: { name: true } }) : null,
    prisma.category.findMany({ where: { active: true }, orderBy: { sort: "asc" }, include: { _count: { select: { tools: { where: { active: true } } } } } }),
    prisma.tool.findMany({
      where: { active: true, categoryId: tool.categoryId, NOT: { id: tool.id } },
      take: 4,
      orderBy: { sort: "asc" },
    }),
  ]);

  const { intro, feats } = splitDescription(tool.description);
  const bullets = feats.length ? feats : [`Access for ${tool.duration}`, "Verified before delivery", "Support if access stops working"];
  const isNew = Date.now() - new Date(tool.createdAt).getTime() < 30 * 864e5;
  const wa = waChannel(getChannels(st));
  const waHref = wa ? withText(wa.href, fillMsg(st.waProductMsg, { tool: tool.name, price: tool.price.toLocaleString() })) : null;
  const view = { id: tool.id, name: tool.name, price: tool.price, duration: tool.duration, image: tool.image, accent: tool.accent };

  return (
    <SiteShell>
      <JsonLd data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Product",
            "@id": `${siteUrl(st)}/tool/${tool.slug}#product`,
            name: tool.name,
            description: clipText(intro || tool.name, 300),
            sku: tool.slug,
            category: tool.category?.name,
            image: tool.image ? [absUrl(st, tool.image)] : undefined,
            brand: { "@type": "Brand", name: tool.name },
            offers: {
              "@type": "Offer",
              url: `${siteUrl(st)}/tool/${tool.slug}`,
              priceCurrency: "BDT",
              price: tool.price,
              availability: ti.status === "down" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
              itemCondition: "https://schema.org/NewCondition",
              seller: { "@type": "Organization", name: st.siteName },
            },
          },
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: siteUrl(st) },
              { "@type": "ListItem", position: 2, name: "All Tools", item: `${siteUrl(st)}/tools` },
              { "@type": "ListItem", position: 3, name: tool.name, item: `${siteUrl(st)}/tool/${tool.slug}` },
            ],
          },
        ],
      }} />
      <TrackEvent name="ViewContent" data={{ content_ids: [tool.id], content_name: tool.name, content_type: "product", value: tool.price, currency: "BDT" }} />
      <div className="container-x pt-28 pb-24">
        <nav className="flex items-center gap-1.5 text-xs text-mist mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-fg">Home</Link><ChevronRight size={12} />
          <Link href="/tools" className="hover:text-fg">All Tools</Link><ChevronRight size={12} />
          <span className="text-fg">{tool.name}</span>
        </nav>

        <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
          <Reveal y={16}>
            <article className="rounded-2xl border border-line bg-panel p-5 sm:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-2xl sm:text-3xl font-bold">{tool.name}</h1>
                {isNew && <span className="text-[10px] font-bold bg-brand px-2 py-0.5 rounded">NEW</span>}
                {tool.category && <Link href={`/tools?cat=${encodeURIComponent(tool.category.name)}`} className="text-[11px] px-2.5 py-1 rounded-full border border-line text-mist hover:text-fg">{tool.category.name}</Link>}
              </div>

              <div className="mt-6 rounded-xl bg-panel2 p-4 sm:p-6 flex justify-center">
                {tool.image ? (
                  <img src={tool.image} alt={tool.name} className="max-w-full w-auto h-auto max-h-[70vh] object-contain rounded-lg shadow-glow" />
                ) : (
                  <div className="w-full max-w-md aspect-[16/10] rounded-lg overflow-hidden shadow-glow"><ToolCover tool={{ name: tool.name, image: tool.image, accent: tool.accent }} /></div>
                )}
              </div>

              {intro && <p className="text-mist leading-relaxed mt-6">{intro}</p>}
              <ul className="mt-5 space-y-2.5">
                {bullets.map((b) => (
                  <li key={b} className="flex gap-3 text-sm text-mist"><Check size={16} className="text-brand shrink-0 mt-0.5" /> {b}</li>
                ))}
              </ul>

              <div className="mt-8 rounded-xl border border-line bg-ink/50 p-5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-4 pb-4 border-b border-line text-sm">
                  <StatusBadge status={ti.status} label={statusLabels(st)[ti.status]} />
                  {ti.access && <span className="text-mist">{ti.access} access</span>}
                  <span className="text-mist">{ti.limit ? `Limit: ${ti.limit}` : st.limitsNoLimit}</span>
                  <Link href="/limits" className="ml-auto text-xs text-brand hover:underline">{st.limitsBadge}</Link>
                </div>
                <p className="font-display font-bold text-2xl">
                  <span className="text-brand">৳{tool.price.toLocaleString()}</span>
                  <span className="text-mist text-sm font-normal"> for each {tool.duration}</span>
                </p>
                <div className="mt-4"><ProductActions soon={ti.soon} soonLabel={st.soonBtn} tool={view} wa={waHref ? { href: waHref, label: st.waAskLabel } : null} /></div>
                <p className="flex items-center gap-2 text-xs text-mist mt-4"><ShieldCheck size={14} className="text-emerald-400" /> Refund if access does not work. Delivered after payment verification.</p>
              </div>

              <Link href="/tools" className="inline-block mt-6 text-sm text-brand hover:underline">← Back to shopping</Link>
            </article>
          </Reveal>

          <aside className="space-y-6 lg:sticky lg:top-24">
            <div>
              <h2 className="font-display font-semibold mb-3">Search Products</h2>
              <form action="/tools" className="flex gap-2">
                <input name="q" placeholder="Search tools..." className="input" aria-label="Search products" />
                <button className="btn-primary shrink-0"><Search size={15} /></button>
              </form>
            </div>
            <div>
              <h2 className="font-display font-semibold mb-3">Your Basket</h2>
              <Basket />
            </div>
            <div>
              <h2 className="font-display font-semibold mb-3">Account</h2>
              <div className="rounded-xl border border-line bg-panel p-4 text-sm">
                {user ? (
                  <>
                    <p className="flex items-center gap-2"><User size={15} className="text-brand" /> Signed in as <b>{user.name}</b></p>
                    <Link href="/account" className="btn-ghost w-full justify-center mt-3">Open Client Area</Link>
                  </>
                ) : (
                  <>
                    <p className="text-mist">{st.affiliateOn === "true" ? "Sign in to track orders and earn with our affiliate program." : "Sign in to track your orders."}</p>
                    <div className="flex gap-2 mt-3">
                      <Link href="/login" className="btn-primary flex-1 justify-center">Login</Link>
                      <Link href="/login?mode=register" className="btn-ghost flex-1 justify-center">Register</Link>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div>
              <h2 className="font-display font-semibold mb-3">Tags</h2>
              <div className="rounded-xl border border-line bg-panel p-3 flex flex-wrap gap-2">
                {cats.filter((c) => c._count.tools > 0).map((c) => (
                  <Link key={c.id} href={`/tools?cat=${encodeURIComponent(c.name)}`} className="text-xs px-2.5 py-1.5 rounded-md bg-panel2 text-mist hover:text-fg hover:bg-brand/20 transition-colors">
                    {c.name} <span className="text-brand ml-1">{c._count.tools}</span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display font-semibold text-xl mb-5">More in {tool.category?.name}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {related.map((r, i) => (
                <Reveal key={r.id} delay={i * 0.06}>
                  <Link href={`/tool/${r.slug}`} className="block rounded-xl border border-line bg-panel overflow-hidden hover:border-brand/50 hover:-translate-y-1 transition-all">
                    <div className="aspect-[16/10]"><ToolCover tool={{ name: r.name, image: r.image, accent: r.accent }} /></div>
                    <div className="p-3">
                      <p className="font-semibold text-sm truncate">{r.name}</p>
                      <p className="text-brand font-bold text-sm mt-1">৳{r.price.toLocaleString()} <span className="text-mist text-[11px] font-normal">/{r.duration}</span></p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </section>
        )}
      </div>
    </SiteShell>
  );
}
