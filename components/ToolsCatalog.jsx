"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Filter, ShoppingCart, Flame, ChevronRight, Check, Loader2, Clock } from "lucide-react";
import { useCheckout } from "./CheckoutProvider";
import { ToolCover } from "./ToolsGrid";
import Link from "next/link";
import { spotMove } from "@/lib/spot";
import { openSoon, openTool } from "@/lib/soon";
import RichText from "./RichText";

const PAGE = 15;

export default function ToolsCatalog({ tools, categories, initialCat = "", initialQ = "", s }) {
  const checkout = useCheckout();
  const [q, setQ] = useState(initialQ);
  const [cat, setCat] = useState(initialCat);
  const [count, setCount] = useState(PAGE);
  const sentinel = useRef(null);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return tools.filter((t) => (!cat || t.category === cat) && (!s || t.name.toLowerCase().includes(s)));
  }, [tools, q, cat]);

  useEffect(() => setCount(PAGE), [q, cat]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => e[0].isIntersecting && setCount((c) => c + PAGE), { rootMargin: "300px" });
    io.observe(el);
    return () => io.disconnect();
  }, [list.length]);

  const shown = list.slice(0, count);

  return (
    <div className="container-x pt-28 pb-24">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto">
        <span className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border border-brand/40 text-brand bg-brand/10 mb-6">
          <Flame size={12} /> {s.toolsPageBadge}
        </span>
        <h1 className="font-display text-4xl sm:text-5xl font-bold">{s.toolsPageTitle}</h1>
        <p className="text-mist mt-5 leading-relaxed">
          {s.toolsPageText}
        </p>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 mt-5 text-xs text-mist">
          {[s.toolsPageCheck1, s.toolsPageCheck2, s.toolsPageCheck3].map((x) => (
            <span key={x} className="flex items-center gap-1.5"><Check size={12} className="text-brand" /> {x}</span>
          ))}
        </div>
      </motion.div>

      <button
        onClick={() => { setCat("Personal"); window.scrollTo({ top: 420, behavior: "smooth" }); }}
        className="group mt-10 mx-auto max-w-2xl w-full flex items-center gap-3 rounded-2xl border border-brand/50 bg-gradient-to-r from-brand/15 to-transparent px-5 py-4 hover:border-brand transition-colors"
      >
        <Flame size={16} className="text-orange-400" />
        <span className="text-[11px] font-bold bg-brand px-2.5 py-1 rounded-full">{s.exclusiveTag}</span>
        <span className="font-semibold text-sm text-left"><RichText text={s.exclusiveText} /></span>
        <ChevronRight size={16} className="ml-auto text-brand group-hover:translate-x-1 transition-transform" />
      </button>

      <div className="flex flex-wrap items-center justify-end gap-3 mt-10 mb-6">
        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-mist" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={s.toolsSearchPlaceholder} className="input pr-9" />
        </div>
        <Filter size={15} className="text-mist" />
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="input !w-auto">
          <option value="">All Tags</option>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
        {shown.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i % PAGE, 10) * 0.03 }}
            whileHover={{ y: -4 }}
            onMouseMove={spotMove}
            className="spot rounded-2xl border border-line bg-panel overflow-hidden flex flex-col hover:border-brand/50 transition-colors"
          >
            <Link href={`/tool/${t.slug}`} className="relative block aspect-[4/3]"><ToolCover tool={t} />{t.soon && <span className="absolute top-2 left-2 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold tracking-wide text-black shadow-lg">{s.soonBadge}</span>}</Link>
            <div className="p-3 sm:p-4 flex-1 flex flex-col">
              {t.category && <span className="self-start text-[10px] px-2 py-1 rounded-full bg-panel2 text-mist">{t.category}</span>}
              <h3 className="font-semibold text-sm mt-2 leading-snug"><Link href={`/tool/${t.slug}`} className="hover:text-brand transition-colors">{t.name}</Link></h3>
              <button onClick={() => openTool(t)} className="self-start text-[11px] text-brand mt-1 py-1.5 hover:underline">Read more</button>
              <p className="mt-auto pt-1 font-display font-bold text-brand text-base sm:text-lg">
                ৳{t.price.toLocaleString()} <span className="text-mist text-[11px] font-normal">per {t.duration}</span>
              </p>
              <button
                onClick={() => t.soon ? openSoon(t.name) : checkout({ type: "tool", id: t.id, name: t.name, price: t.price, per: `/${t.duration}`, image: t.image || null, accent: t.accent || null })}
                className="mt-3 w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand hover:bg-brand-dark text-sm font-semibold transition-colors"
              >
                {t.soon ? <><Clock size={14} className="animate-pulse" /> {s.soonBtn}</> : <><ShoppingCart size={14} /> {s.orderBtn}</>}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {list.length === 0 && <p className="text-center text-mist py-16">No tools match your search.</p>}
      {count < list.length && (
        <div ref={sentinel} className="flex flex-col items-center gap-2 py-10 text-xs text-brand">
          <Loader2 className="animate-spin" size={20} /> Loading more tools...
        </div>
      )}
    </div>
  );
}
