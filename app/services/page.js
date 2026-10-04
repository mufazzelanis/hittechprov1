import Link from "next/link";
import { Briefcase, MessageSquareText, PenTool, PackageCheck } from "lucide-react";
import SiteShell from "@/components/SiteShell";
import StoreCard from "@/components/StoreCard";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { usdOf, images, parsePackages } from "@/lib/catalog";
import { ogFallback } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const s = await getSettings();
  const title = `Design, Landing Page & Digital Marketing Services | ${s.siteName}`;
  const description = "Hire a software engineer and designer: logo & branding, social media design, landing pages, websites and digital marketing. Clear packages, fixed prices, pay by card or Payoneer.";
  return { title, description, alternates: { canonical: "/services" }, openGraph: { title, description, url: "/services", images: [ogFallback(s)] } };
}

const STEPS = [
  [PenTool, "Pick a package", "Clear scope, fixed price and delivery time - no surprises."],
  [MessageSquareText, "Send your brief", "After payment, answer a few quick questions in your Client Area."],
  [PackageCheck, "Get your delivery", "Finished files land in your account, with revisions included."],
];

export default async function ServicesPage({ searchParams }) {
  const s = await getSettings();
  const all = await prisma.service.findMany({ where: { active: true }, orderBy: [{ featured: "desc" }, { sort: "asc" }, { createdAt: "desc" }] });
  const kinds = [...new Set(all.map((x) => x.kind))];
  const kind = typeof searchParams?.kind === "string" && kinds.includes(searchParams.kind) ? searchParams.kind : "";
  const list = (kind ? all.filter((x) => x.kind === kind) : all)
    .map((x) => ({ ...x, pk: parsePackages(x.packages) }))
    .filter((x) => x.pk.length);

  return (
    <SiteShell>
      <section className="relative pt-32 pb-10 bg-grain overflow-hidden">
        <div className="orb absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand/15 blur-[100px] pointer-events-none" />
        <div className="container-x relative">
          <span className="inline-flex items-center gap-2 text-xs px-3.5 py-2 rounded-full border border-brand/40 text-brand bg-brand/10"><Briefcase size={13} /> Services</span>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mt-5 max-w-3xl leading-tight">Design & growth, <span className="text-brand">done for you</span></h1>
          <p className="text-mist text-lg mt-4 max-w-2xl">Branding, social media design, landing pages and digital marketing - from a software engineer who designs. Fixed packages, clear delivery times.</p>
          <div className="grid sm:grid-cols-3 gap-4 mt-8 max-w-4xl">
            {STEPS.map(([Icon, t, d], i) => (
              <div key={t} className="rounded-xl border border-line bg-panel/70 p-4">
                <span className="flex items-center gap-2 text-sm font-semibold"><span className="w-7 h-7 rounded-full bg-brand/15 text-brand flex items-center justify-center text-xs font-bold">{i + 1}</span> {t}</span>
                <p className="text-xs text-mist mt-2 leading-relaxed flex gap-2"><Icon size={14} className="shrink-0 text-brand mt-px" /> {d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x pb-24">
        {kinds.length > 1 && (
          <nav aria-label="Filter by type" className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-6">
            {["", ...kinds].map((k) => (
              <Link key={k || "all"} href={k ? `/services?kind=${encodeURIComponent(k)}` : "/services"} scroll={false}
                className={`shrink-0 rounded-full px-4 py-2 text-sm border transition-colors ${kind === k ? "bg-brand border-brand text-white" : "border-line text-mist hover:text-fg hover:border-mist"}`}>
                {k || "All"}
              </Link>
            ))}
          </nav>
        )}
        {list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line p-16 text-center">
            <Briefcase size={36} className="mx-auto text-mist" />
            <p className="font-display font-semibold text-lg mt-4">Services are being added</p>
            <p className="text-mist text-sm mt-1">Want something specific? Message us from the chat button - we'll quote it.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {list.map((x) => {
              const cheapest = x.pk.reduce((a, b) => (b.price < a.price ? b : a));
              return <StoreCard key={x.id} href={`/services/${x.slug}`} name={x.name} kind={x.kind} tagline={x.tagline} image={x.image || images(x.gallery)[0]} usd={usdOf(cheapest.priceUsd, cheapest.price, s.usdRate)} taka={cheapest.price} from={x.pk.length > 1} featured={x.featured} />;
            })}
          </div>
        )}
      </section>
    </SiteShell>
  );
}
