import Link from "next/link";
import { LayoutTemplate, Download, ShieldCheck, Globe } from "lucide-react";
import SiteShell from "@/components/SiteShell";
import StoreCard from "@/components/StoreCard";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { usdOf, images } from "@/lib/catalog";
import { ogFallback } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const s = await getSettings();
  const title = `Canva Templates, Design Kits & Landing Pages | ${s.siteName}`;
  const description = "Ready-made Canva templates, social media kits, branding and landing page designs. Instant download after payment, commercial use, pay by card or Payoneer.";
  return { title, description, alternates: { canonical: "/templates" }, openGraph: { title, description, url: "/templates", images: [ogFallback(s)] } };
}

export default async function TemplatesPage({ searchParams }) {
  const s = await getSettings();
  const all = await prisma.product.findMany({ where: { active: true }, orderBy: [{ featured: "desc" }, { sort: "asc" }, { createdAt: "desc" }] });
  const kinds = [...new Set(all.map((p) => p.kind))];
  const kind = typeof searchParams?.kind === "string" && kinds.includes(searchParams.kind) ? searchParams.kind : "";
  const list = kind ? all.filter((p) => p.kind === kind) : all;

  return (
    <SiteShell>
      <section className="relative pt-32 pb-10 bg-grain overflow-hidden">
        <div className="orb absolute -top-24 -left-24 w-96 h-96 rounded-full bg-brand/15 blur-[100px] pointer-events-none" />
        <div className="container-x relative">
          <span className="inline-flex items-center gap-2 text-xs px-3.5 py-2 rounded-full border border-brand/40 text-brand bg-brand/10"><LayoutTemplate size={13} /> Templates & Designs</span>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mt-5 max-w-3xl leading-tight">Ready-made designs, <span className="text-brand">ready in minutes</span></h1>
          <p className="text-mist text-lg mt-4 max-w-2xl">Canva templates, social media kits, branding and landing page designs - crafted by a working designer and developer. Edit, publish, done.</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-6 text-sm text-mist">
            <span className="flex items-center gap-2"><Download size={15} className="text-brand" /> Download from your account</span>
            <span className="flex items-center gap-2"><Globe size={15} className="text-brand" /> Card & Payoneer (USD) or bKash/Nagad</span>
            <span className="flex items-center gap-2"><ShieldCheck size={15} className="text-brand" /> Commercial use</span>
          </div>
        </div>
      </section>

      <section className="container-x pb-24">
        {kinds.length > 1 && (
          <nav aria-label="Filter by type" className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-6">
            {["", ...kinds].map((k) => (
              <Link key={k || "all"} href={k ? `/templates?kind=${encodeURIComponent(k)}` : "/templates"} scroll={false}
                className={`shrink-0 rounded-full px-4 py-2 text-sm border transition-colors ${kind === k ? "bg-brand border-brand text-white" : "border-line text-mist hover:text-fg hover:border-mist"}`}>
                {k || "All"}
              </Link>
            ))}
          </nav>
        )}
        {list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line p-16 text-center">
            <LayoutTemplate size={36} className="mx-auto text-mist" />
            <p className="font-display font-semibold text-lg mt-4">New templates are on the way</p>
            <p className="text-mist text-sm mt-1">Need something custom right now? <Link href="/services" className="text-brand underline">Hire us for a design</Link>.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {list.map((p) => (
              <StoreCard key={p.id} href={`/templates/${p.slug}`} name={p.name} kind={p.kind} tagline={p.tagline} image={p.image || images(p.gallery)[0]} usd={usdOf(p.priceUsd, p.price, s.usdRate)} taka={p.price} featured={p.featured} />
            ))}
          </div>
        )}
      </section>
    </SiteShell>
  );
}
