import { Gauge, Info } from "lucide-react";
import SiteShell from "@/components/SiteShell";
import LimitsTable from "@/components/LimitsTable";
import Reveal from "@/components/Reveal";
import RichText from "@/components/RichText";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getToolInfo, normalizeInfo, statusLabels } from "@/lib/limits";
import { splitDescription } from "@/lib/toolText";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const s = await getSettings();
  return { title: `${s.limitsPageTitleMeta} | ${s.siteName}`, description: s.limitsText, alternates: { canonical: "/limits" } };
}

export default async function LimitsPage() {
  const s = await getSettings();
  const [tools, info] = await Promise.all([
    prisma.tool.findMany({ where: { active: true }, include: { category: true }, orderBy: [{ sort: "asc" }, { createdAt: "desc" }] }),
    getToolInfo(),
  ]);
  const rows = tools.map((t) => ({
    id: t.id, slug: t.slug, name: t.name, image: t.image, accent: t.accent, price: t.price, duration: t.duration,
    category: t.category?.name || "", description: splitDescription(t.description).intro, ...normalizeInfo(info[t.id]),
  }));
  const last = Object.values(info).map((i) => i.updated).filter(Boolean).sort().pop();
  const t = {
    search: s.limitsSearch, showing: s.limitsShowing, fAll: s.limitsFilterAll, fShared: s.limitsFilterShared, fPrivate: s.limitsFilterPrivate,
    sNameAsc: s.limitsSortNameAsc, sNameDesc: s.limitsSortNameDesc, sPriceAsc: s.limitsSortPriceAsc, sPriceDesc: s.limitsSortPriceDesc,
    colNum: s.limitsColNum, colTool: s.limitsColTool, colCategory: s.limitsColCategory, colType: s.limitsColType, colPrice: s.limitsColPrice,
    colLimit: s.limitsColLimit, colBuy: s.limitsColBuy, per: s.limitsPer, seeMore: s.limitsSeeMore, seeLess: s.limitsSeeLess,
    soonBtn: s.soonBtn, noLimit: s.limitsNoLimit, none: s.limitsNone, orderBtn: s.limitsOrderBtn,
  };

  return (
    <SiteShell>
      <section className="relative pt-32 pb-24 bg-grain">
        <div className="container-x max-w-7xl">
          <Reveal className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-flex items-center gap-2 text-xs px-3.5 py-1.5 rounded-full border border-brand/40 text-brand bg-brand/10 mb-5"><Gauge size={13} /> {s.limitsBadge}</span>
            <h1 className="font-display text-4xl sm:text-5xl font-bold"><RichText text={s.limitsTitle} /></h1>
            <p className="text-mist mt-4 leading-relaxed">{s.limitsText}</p>
            {last && <p className="text-[11px] text-mist mt-3">{s.limitsUpdated} {new Date(last).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>}
          </Reveal>

          <LimitsTable tools={rows} labels={statusLabels(s)} t={t} />

          <div className="mt-8 flex gap-3 rounded-xl border border-line bg-panel p-4 text-xs text-mist leading-relaxed">
            <Info size={16} className="text-brand shrink-0 mt-0.5" />
            <p>{s.limitsFootnote}</p>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
