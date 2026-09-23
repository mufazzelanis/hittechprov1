"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X, BadgeCheck, ShoppingBag } from "lucide-react";
import { navStart } from "@/components/LoadingSystem";

const DISPLAY_MS = 5800;
const INITIAL_DELAY_MS = 7000;

// "Someone just bought this" trust popup - bottom-left (the chat FAB owns bottom-right), cycling through
// real, currently-buyable tools (weighted server-side towards ones actually getting views) paired with a
// name from a display-only name pool (lib/salesPopNames.js). Off entirely at the top of a page load; the
// first one appears after a short delay, then it repeats on a random cadence between minSec and maxSec.
export default function TrustPop({ enabled, minSec = 10, maxSec = 30 }) {
  const [data, setData] = useState(null);
  const [visible, setVisible] = useState(false);
  const path = usePathname();
  const router = useRouter();
  const onCheckout = path.startsWith("/checkout");
  const alive = useRef(true);
  const timers = useRef([]);

  useEffect(() => {
    if (!enabled || onCheckout) return undefined;
    alive.current = true;

    const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
    const after = (ms, fn) => { const id = setTimeout(fn, ms); timers.current.push(id); return id; };

    async function cycle() {
      if (!alive.current) return;
      try {
        const r = await fetch("/api/sales-pop", { cache: "no-store" });
        const j = await r.json();
        if (!alive.current) return;
        if (j.show) {
          setData(j);
          setVisible(true);
          after(DISPLAY_MS, () => setVisible(false));
        }
      } catch {}
      const gap = (minSec + Math.random() * Math.max(0, maxSec - minSec)) * 1000;
      after(DISPLAY_MS + gap, cycle);
    }

    after(INITIAL_DELAY_MS, cycle);
    return () => { alive.current = false; clearTimers(); };
  }, [enabled, onCheckout, minSec, maxSec, path]);

  const dismiss = (e) => { e.stopPropagation(); setVisible(false); };
  const open = () => {
    if (!data?.tool?.slug) return;
    setVisible(false);
    navStart();
    router.push(`/tool/${data.tool.slug}`);
  };

  if (!enabled || onCheckout) return null;

  return (
    <div className="fixed left-4 sm:left-5 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] nav:bottom-5 z-30 w-[19rem] max-w-[calc(100vw-2rem)]">
      <AnimatePresence>
        {visible && data && (
          <motion.div
            role="button"
            tabIndex={0}
            onClick={open}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } }}
            initial={{ opacity: 0, x: -60, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -40, scale: 0.96, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="group relative w-full text-left rounded-2xl border border-line bg-panel/95 backdrop-blur shadow-glow overflow-hidden hover:border-brand/50 transition-colors cursor-pointer"
          >
            <button type="button" onClick={dismiss} aria-label="Dismiss" className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full flex items-center justify-center text-mist hover:text-fg hover:bg-fg/10">
              <X size={13} />
            </button>

            <div className="flex items-start gap-3 p-3.5 pr-8">
              <span className="relative w-11 h-11 shrink-0 rounded-xl overflow-hidden flex items-center justify-center text-white font-bold" style={{ background: `linear-gradient(135deg, ${data.tool.accent}, #0b0b12 130%)` }}>
                {data.tool.image ? <img src={data.tool.image} alt="" className="w-full h-full object-cover" /> : <ShoppingBag size={18} />}
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-panel flex items-center justify-center">
                  <BadgeCheck size={11} className="text-white" />
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 flex-wrap text-sm leading-snug">
                  <span className="font-semibold">{data.name}</span>
                  <span className="text-mist text-xs">from {data.city}</span>
                </span>
                <span className="block text-sm text-mist leading-snug mt-0.5">
                  just purchased <span className="font-semibold text-fg group-hover:text-brand transition-colors">{data.tool.name}</span>
                </span>
                <span className="flex items-center gap-1.5 mt-1.5 text-[10px] text-mist">
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-medium"><BadgeCheck size={11} /> Verified order</span>
                  <span aria-hidden>·</span>
                  {data.timeLabel}
                </span>
              </span>
            </div>

            <motion.span
              key={data.name + data.tool.slug}
              className="absolute bottom-0 left-0 h-[3px] bg-brand/70"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: DISPLAY_MS / 1000, ease: "linear" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
