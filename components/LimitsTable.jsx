"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Lock, Users, ArrowUpDown, ChevronRight, ShoppingCart, ExternalLink } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { ToolCover } from "./ToolsGrid";

const SORTS = { "name-asc": (a, b) => a.name.localeCompare(b.name), "name-desc": (a, b) => b.name.localeCompare(a.name), "price-asc": (a, b) => a.price - b.price, "price-desc": (a, b) => b.price - a.price };

function TypePill({ access }) {
  if (access === "Private")
    return <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-300"><Lock size={11} /> Private</span>;
  if (access === "Shared")
    return <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/40 bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-300"><Users size={11} /> Shared</span>;
  return <span className="text-mist">—</span>;
}

function Desc({ x, t, labels }) {
  const [more, setMore] = useState(false);
  const text = [x.limit, x.description].filter(Boolean).join(" · ");
  const long = text.length > 110;
  return (
    <div className="max-w-md">
      {x.status !== "active" && <div className="mb-1.5"><StatusBadge status={x.status} label={labels[x.status]} /></div>}
      {x.limit && <p className="font-semibold text-[13px] text-fg">{x.limit}</p>}
      {x.description && <p className={`text-[13px] leading-relaxed text-fg/90 ${more ? "" : "line-clamp-2"}`}>{x.description}</p>}
      {x.note && <p className="text-[11px] text-mist mt-1">{x.note}</p>}
      {!x.limit && !x.description && <span className="text-mist text-[13px]">{t.noLimit}</span>}
      {long && (
        <button onClick={() => setMore((m) => !m)} className="mt-1 inline-flex items-center gap-0.5 text-[12px] font-semibold text-brand hover:underline">
          {more ? t.seeLess : t.seeMore} <ChevronRight size={12} className={`transition-transform ${more ? "-rotate-90" : ""}`} />
        </button>
      )}
    </div>
  );
}

const OrderBtn = ({ x, t, className = "" }) => x.soon ? (
  <Link href={`/tool/${x.slug}`} className={`inline-flex items-center gap-2 rounded-lg border border-amber-500/50 bg-amber-500/15 px-4 py-2.5 text-sm font-semibold text-amber-300 ${className}`}>{t.soonBtn}</Link>
) : (
  <Link href={`/tool/${x.slug}`} className={`inline-flex items-center gap-2 rounded-lg bg-brand hover:bg-brand-dark px-4 py-2.5 text-sm font-semibold transition-colors ${className}`}>
    <ShoppingCart size={14} /> {t.orderBtn} <ExternalLink size={13} className="opacity-80" />
  </Link>
);

export default function LimitsTable({ tools, labels, t }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [sort, setSort] = useState("");

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const out = tools.filter((x) => (!type || x.access === type) && (!s || `${x.name} ${x.category} ${x.description} ${x.limit}`.toLowerCase().includes(s)));
    return sort ? [...out].sort(SORTS[sort]) : out;
  }, [tools, q, type, sort]);

  const toggle = (key) => setSort((cur) => (cur === `${key}-asc` ? `${key}-desc` : `${key}-asc`));
  const pill = (on) => `rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${on ? "bg-brand text-white" : "bg-panel2 text-fg hover:bg-line"}`;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mist" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.search} className="input !pl-10 !rounded-xl" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setType("")} className={pill(type === "")}>{t.fAll}</button>
          <button onClick={() => setType(type === "Shared" ? "" : "Shared")} className={pill(type === "Shared")}>{t.fShared}</button>
          <button onClick={() => setType(type === "Private" ? "" : "Private")} className={`${pill(type === "Private")} inline-flex items-center gap-1.5`}><Lock size={12} /> {t.fPrivate}</button>
          <span className="hidden sm:block w-px h-6 bg-line mx-1" />
          <button onClick={() => setSort(sort === "name-asc" ? "" : "name-asc")} className={pill(sort === "name-asc")}>{t.sNameAsc}</button>
          <button onClick={() => setSort(sort === "name-desc" ? "" : "name-desc")} className={pill(sort === "name-desc")}>{t.sNameDesc}</button>
          <button onClick={() => setSort(sort === "price-asc" ? "" : "price-asc")} className={pill(sort === "price-asc")}>{t.sPriceAsc}</button>
          <button onClick={() => setSort(sort === "price-desc" ? "" : "price-desc")} className={pill(sort === "price-desc")}>{t.sPriceDesc}</button>
        </div>
      </div>

      <p className="text-sm text-fg/90 mt-5 mb-3">{t.showing.replace("{shown}", list.length).replace("{total}", tools.length)}</p>

      {/* tablet / desktop table */}
      <div className="hidden md:block rounded-2xl border border-line bg-panel overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-line text-fg font-semibold">
              <th className="px-5 py-4 w-14">{t.colNum}</th>
              <th className="px-3 py-4"><button onClick={() => toggle("name")} className="inline-flex items-center gap-1.5 font-semibold">{t.colTool} <ArrowUpDown size={13} className="text-mist" /></button></th>
              <th className="px-3 py-4">{t.colCategory}</th>
              <th className="px-3 py-4">{t.colType}</th>
              <th className="px-3 py-4"><button onClick={() => toggle("price")} className="inline-flex items-center gap-1.5 font-semibold">{t.colPrice} <ArrowUpDown size={13} className="text-mist" /></button></th>
              <th className="px-3 py-4">{t.colLimit}</th>
              <th className="px-5 py-4">{t.colBuy}</th>
            </tr>
          </thead>
          <tbody>
            {list.map((x, i) => (
              <tr key={x.id} className="border-b border-line/70 last:border-0 hover:bg-fg/[0.02] align-middle">
                <td className="px-5 py-4 text-fg/90">{i + 1}</td>
                <td className="px-3 py-4">
                  <Link href={`/tool/${x.slug}`} className="flex items-center gap-3.5 group">
                    <span className="w-9 h-9 rounded-lg overflow-hidden shrink-0"><ToolCover tool={x} small /></span>
                    <span className="font-semibold group-hover:text-brand transition-colors">{x.name}</span>
                  </Link>
                </td>
                <td className="px-3 py-4">{x.category && <span className="inline-block rounded-full bg-panel2 px-3 py-1.5 text-[12px] font-medium text-fg/90">{x.category}</span>}</td>
                <td className="px-3 py-4"><TypePill access={x.access} /></td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <p className="font-display font-bold text-brand text-lg leading-none">৳{x.price}</p>
                  <p className="text-[12px] text-fg/85 mt-1">{t.per} {x.duration}</p>
                </td>
                <td className="px-3 py-4"><Desc x={x} t={t} labels={labels} /></td>
                <td className="px-5 py-4"><OrderBtn x={x} t={t} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <p className="py-14 text-center text-sm text-mist">{t.none}</p>}
      </div>

      {/* phones: one card per tool */}
      <div className="md:hidden space-y-3">
        {list.length === 0 && <p className="rounded-2xl border border-line bg-panel py-10 text-center text-sm text-mist">{t.none}</p>}
        {list.map((x, i) => (
          <div key={x.id} className="rounded-2xl border border-line bg-panel p-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-mist w-5">{i + 1}</span>
              <span className="w-10 h-10 rounded-lg overflow-hidden shrink-0"><ToolCover tool={x} small /></span>
              <div className="min-w-0 flex-1">
                <Link href={`/tool/${x.slug}`} className="block font-semibold truncate">{x.name}</Link>
                {x.category && <span className="inline-block mt-1 rounded-full bg-panel2 px-2.5 py-0.5 text-[11px] text-fg/90">{x.category}</span>}
              </div>
              <TypePill access={x.access} />
            </div>
            <div className="mt-3"><Desc x={x} t={t} labels={labels} /></div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-display font-bold text-brand text-lg leading-none">৳{x.price}</p>
                <p className="text-[11px] text-fg/85 mt-1">{t.per} {x.duration}</p>
              </div>
              <OrderBtn x={x} t={t} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
