"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X, Check, ShoppingCart, Zap, Clock, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { useCart, useCheckout } from "./CheckoutProvider";
import { ToolCover } from "./ToolsGrid";
import { openSoon } from "@/lib/soon";
import { flyToCart } from "@/lib/flyToCart";

// Product quick view: opened from any "Read more" (event "htp-tool"). Rises from the bottom on phones, pops up centred on desktop.
export default function ToolQuickView({ t }) {
  const cart = useCart();
  const buyNow = useCheckout();
  const [tool, setTool] = useState(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const on = (e) => { setAdded(false); setTool(e.detail || null); };
    window.addEventListener("htp-tool", on);
    return () => window.removeEventListener("htp-tool", on);
  }, []);

  useEffect(() => {
    if (!tool) return;
    const k = (e) => e.key === "Escape" && setTool(null);
    document.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [tool]);

  const close = () => setTool(null);
  const item = tool && { type: "tool", id: tool.id, name: tool.name, price: tool.price, per: `/${tool.duration}`, image: tool.image || null, accent: tool.accent || null };
  const inCart = !!tool && cart.items.some((x) => x.type === "tool" && x.id === tool.id);
  const perks = tool ? (tool.feats?.length ? tool.feats : String(t.perks || "").replace(/\{duration\}/g, tool.duration).split(/\r?\n/).map((x) => x.trim()).filter(Boolean)) : [];

  return (
    <AnimatePresence>
      {tool && (
        <motion.div className="fixed inset-0 z-[85] flex items-end sm:items-center justify-center sm:p-6 bg-black/70 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && close()}>
          <motion.div
            role="dialog" aria-modal="true" aria-label={tool.name}
            initial={{ y: "100%", opacity: 0.6 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, i) => (i.offset.y > 110 || i.velocity.y > 600) && close()}
            className="relative w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-line bg-panel shadow-[0_-20px_80px_-20px_rgba(232,53,43,0.35)]"
          >
            <div className="sm:hidden flex justify-center pt-2.5 pb-1"><span className="h-1.5 w-12 rounded-full bg-white/20" /></div>
            <button onClick={close} aria-label="Close" className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white hover:bg-black/70"><X size={18} /></button>

            <div className="p-3 sm:p-4 pb-0">
              <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.12, duration: 0.35 }} className="relative aspect-[16/8] rounded-2xl overflow-hidden">
                <ToolCover tool={tool} />
                <span className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                {tool.soon && <span className="absolute top-3 left-3 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold tracking-wide text-black shadow-lg">{t.soonBadge}</span>}
                {tool.category && <span className="absolute bottom-3 left-3 rounded-full bg-black/55 backdrop-blur px-3 py-1 text-[11px] text-white">{tool.category}</span>}
              </motion.div>
            </div>

            <div className="px-5 sm:px-6 pt-4 pb-6">
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="flex items-start justify-between gap-4">
                <h3 className="font-display font-bold text-xl sm:text-2xl leading-tight">{tool.name}</h3>
                <p className="shrink-0 text-right font-display font-bold text-brand text-xl sm:text-2xl leading-none">৳{tool.price.toLocaleString()}<span className="block text-[11px] font-normal text-mist mt-1">/{tool.duration}</span></p>
              </motion.div>

              {tool.description && (
                <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} className="text-sm text-mist leading-relaxed mt-3">{tool.description}</motion.p>
              )}

              {perks.length > 0 && (
                <div className="mt-4 rounded-2xl border border-line bg-panel2/40 p-4">
                  <p className="flex items-center gap-2 text-xs font-semibold text-fg mb-2.5"><Sparkles size={14} className="text-brand" /> {t.included}</p>
                  <ul className="space-y-2">
                    {perks.map((p, i) => (
                      <motion.li key={p + i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.07 }} className="flex items-start gap-2.5 text-sm text-mist">
                        <span className="mt-0.5 w-4 h-4 shrink-0 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center"><Check size={11} /></span>{p}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-5 space-y-2.5">
                {tool.soon ? (
                  <button onClick={() => { close(); setTimeout(() => openSoon(tool.name), 250); }} className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/50 bg-amber-500/15 py-3.5 text-sm font-semibold text-amber-300 hover:bg-amber-500/25 transition-colors">
                    <Clock size={16} className="animate-pulse" /> {t.soonBtn}
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="relative">
                      {!inCart && (
                        <motion.span
                          aria-hidden
                          className="absolute -top-3 -right-2 text-xl select-none pointer-events-none drop-shadow-lg z-10"
                          animate={{ y: [0, 7, 0], rotate: [0, -12, 0] }}
                          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                        >
                          👆
                        </motion.span>
                      )}
                      <button
                        onClick={(e) => { if (inCart) { close(); cart.checkout(); } else { flyToCart({ from: e.currentTarget, image: item.image }); cart.add(item); setAdded(true); } }}
                        className={`w-full inline-flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-colors ${inCart ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "border border-line hover:border-mist"}`}
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.span key={inCart ? "in" : "add"} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} className="inline-flex items-center gap-2">
                            {inCart ? <><Check size={16} /> {added ? t.added : t.goBasket}</> : <><ShoppingCart size={16} /> {t.add}</>}
                          </motion.span>
                        </AnimatePresence>
                      </button>
                    </div>
                    <button onClick={() => { close(); buyNow(item); }} className="btn-primary justify-center !py-3.5"><Zap size={16} /> {t.buy}</button>
                  </div>
                )}
                <Link href={`/tool/${tool.slug}`} onClick={close} className="flex items-center justify-center gap-1.5 text-xs text-brand py-2 hover:underline">{t.full} <ArrowRight size={13} /></Link>
                <p className="flex items-center justify-center gap-2 text-[11px] text-mist"><ShieldCheck size={13} className="text-emerald-400" /> {t.trust}</p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
