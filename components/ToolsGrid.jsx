"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, ArrowRight, Clock } from "lucide-react";
import { useCheckout } from "./CheckoutProvider";
import Reveal from "./Reveal";
import RichText from "./RichText";
import Link from "next/link";
import { spotMove } from "@/lib/spot";
import { openTool } from "@/lib/soon";
import RequestTool from "./RequestTool";

export function ToolCover({ tool, small = false }) {
  if (tool.image) return <img src={tool.image} alt={tool.name} className="w-full h-full object-cover" loading="lazy" />;
  const c = tool.accent || "#E8352B";
  return (
    <div className="relative w-full h-full overflow-hidden flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${c}, #0b0b12 120%)` }}>
      <span className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
      <span className="absolute -bottom-10 -left-6 w-32 h-32 rounded-full bg-black/25" />
      <span className={`relative font-display font-extrabold text-white drop-shadow text-center leading-tight ${small ? "text-lg" : "text-xl md:text-2xl xl:text-3xl px-2 sm:px-3 break-words"}`}>{small ? tool.name[0] : tool.name}</span>
    </div>
  );
}

function ToolCard({ t, label, soonLabel, soonBadge }) {
  const long = t.description.length > 70 || (t.feats || []).length > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      onMouseMove={spotMove}
      className="spot group rounded-2xl border border-line bg-panel overflow-hidden hover:border-brand/50 transition-colors flex flex-col"
    >
      <div className="p-2 sm:p-3 pb-0">
        <Link href={`/tool/${t.slug}`} className="relative block aspect-[16/10] rounded-xl overflow-hidden"><ToolCover tool={t} />{t.soon && <span className="absolute top-2 left-2 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold tracking-wide text-black shadow-lg">{soonBadge}</span>}</Link>
      </div>
      <div className="p-3 sm:p-4 flex-1 flex flex-col">
        <div className="flex flex-col-reverse items-start gap-1.5 xl:flex-row xl:justify-between xl:gap-2">
          <h3 className="font-semibold leading-snug text-sm sm:text-base"><Link href={`/tool/${t.slug}`} className="hover:text-brand transition-colors">{t.name}</Link></h3>
          {t.category && <span className="shrink-0 text-[10px] px-2 py-1 rounded-full border border-line text-mist">{t.category}</span>}
        </div>
        <p className="text-mist text-xs mt-3 leading-relaxed line-clamp-2">{t.description}</p>
        {long && (
          <button onClick={() => openTool(t)} className="self-start text-[11px] text-brand mt-1 py-2 hover:underline">
            Read more
          </button>
        )}
        <p className="mt-auto pt-3 sm:pt-4 font-display font-bold text-brand text-base sm:text-lg">
          ৳{t.price.toLocaleString()} <span className="text-mist text-xs font-normal">/{t.duration}</span>
        </p>
        <Link href={`/tool/${t.slug}`} className="mt-3 w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand hover:bg-brand-dark text-sm font-semibold transition-colors">
          {t.soon ? <><Clock size={14} className="animate-pulse" /> {soonLabel}</> : <><ShoppingCart size={14} /> {label} <ArrowRight size={13} /></>}
        </Link>
      </div>
    </motion.div>
  );
}

export default function ToolsGrid({ tools, categories, startingPrice, s, channels = [] }) {
  const [active, setActive] = useState("All");
  const shown = active === "All" ? tools : tools.filter((t) => t.category === active);

  return (
    <section id="tools" className="py-24 border-t border-line">
      <div className="container-x">
        <Reveal className="text-center max-w-2xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl font-bold">
            <RichText text={s.toolsTitle} vars={{ price: `৳${startingPrice}` }} />
          </h2>
          <p className="text-mist mt-3"><RichText text={s.toolsSubtitle} /></p>
        </Reveal>

        <div className="flex flex-wrap justify-center gap-2 mt-10 mb-10">
          {["All", ...categories].map((c) => (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                active === c ? "bg-brand border-brand text-white" : "border-line text-mist hover:border-mist hover:text-fg"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <motion.div layout className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          <AnimatePresence mode="popLayout">
            {shown.map((t) => <ToolCard key={t.id} t={t} label={s.toolCardBtn} soonLabel={s.soonBtn} soonBadge={s.soonBadge} />)}
          </AnimatePresence>
        </motion.div>
        {shown.length === 0 && <p className="text-center text-mist py-10">No tools in this category yet.</p>}

        <Reveal className="mt-14 text-center">
          <p className="text-sm text-mist">{s.toolsRequestText}</p>
          <div className="flex flex-wrap justify-center gap-3 mt-5">
            <Link href="/tools" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-line hover:border-mist text-sm text-brand">{s.toolsViewAllBtn} <ArrowRight size={14} /></Link>
            <RequestTool channels={channels} s={s} className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-brand to-brand-light text-sm font-semibold">{s.toolsRequestBtn}</RequestTool>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
