"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, ArrowUp, Search, ArrowUpRight } from "lucide-react";
import BrandLogo from "./BrandLogo";
import { withText } from "@/lib/wa";
import { track } from "@/lib/track";

const COLOR = { whatsapp: "#25D366", telegram: "#229ED9", messenger: "#0084FF", instagram: "#E4405F", phone: "#E8352B", email: "#6B7280" };
const external = (href) => /^https?:/i.test(href);

const RING_R = 17;
const RING_C = 2 * Math.PI * RING_R;

// Back-to-top FAB: stays hidden until there's real scroll to undo, then shows how far down the page
// you are as a ring around the arrow - a small, familiar touch (Medium, most reading apps) that turns
// a plain jump-to-top link into a passive scroll-progress indicator too.
function BackToTop() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const ticking = useRef(false);

  useEffect(() => {
    const measure = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const y = window.scrollY || doc.scrollTop;
      setProgress(max > 0 ? Math.min(1, Math.max(0, y / max)) : 0);
      setVisible(y > 480);
      ticking.current = false;
    };
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
          initial={{ opacity: 0, scale: 0.5, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 12 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 420, damping: 24 }}
          className="relative w-11 h-11 rounded-full border border-line bg-panel/90 backdrop-blur flex items-center justify-center text-mist hover:text-brand hover:border-brand/50 shadow-glow transition-colors"
        >
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 40 40" aria-hidden>
            <circle cx="20" cy="20" r={RING_R} fill="none" stroke="rgb(var(--line))" strokeWidth="2" />
            <circle
              cx="20" cy="20" r={RING_R} fill="none" stroke="rgb(var(--brand))" strokeWidth="2" strokeLinecap="round"
              strokeDasharray={RING_C} strokeDashoffset={RING_C * (1 - progress)}
              style={{ transition: "stroke-dashoffset 120ms linear" }}
            />
          </svg>
          <ArrowUp size={16} strokeWidth={2.4} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

// Floating contact button. The popup lists only the channel names (numbers/usernames stay hidden) and offers
// quick topics; the chosen topic pre-fills the WhatsApp / email message.
export default function ChatWidget({ channels = [], t = {} }) {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState(-1);
  const path = usePathname();
  const onCheckout = path.startsWith("/checkout");
  const single = channels.length === 1 ? channels[0] : null;
  const fab = `chan-tile ${onCheckout ? "w-12 h-12" : "w-14 h-14"} rounded-full bg-brand hover:bg-brand-dark shadow-glow flex items-center justify-center transition-colors`;
  const topics = (t.topics || []).filter((x) => x.label);
  const sel = topic >= 0 ? topics[topic] : null;

  const hrefFor = (c) => {
    if (!sel) return c.href;
    if (c.key === "whatsapp") return withText(c.href, sel.msg || sel.label);
    if (c.key === "email") return `${c.href}?subject=${encodeURIComponent(sel.label)}&body=${encodeURIComponent(sel.msg || "")}`;
    return c.href;
  };

  return (
    <div className="fixed right-4 sm:right-5 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] nav:bottom-5 z-40 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && !single && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            className="w-[19rem] rounded-2xl border border-line bg-panel p-4 shadow-glow"
          >
            <p className="font-semibold text-sm">{t.greeting}</p>
            <p className="text-xs text-mist flex items-center gap-1.5 mt-1">
              <span className="relative flex w-2 h-2"><span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75 animate-ping" /><span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-400" /></span>
              {t.online} · {t.reply}
            </p>

            {topics.length > 0 && (
              <div className="mt-3.5">
                <p className="text-[11px] text-mist mb-2">{t.topicsLabel}</p>
                <div className="flex flex-wrap gap-1.5">
                  {topics.map((x, i) => (
                    <button key={i} type="button" onClick={() => setTopic(topic === i ? -1 : i)} className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${topic === i ? "border-brand bg-brand text-white" : "border-line text-mist hover:text-fg hover:border-mist"}`}>
                      {x.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <ul className="mt-3.5 space-y-2">
              {channels.map((c, i) => (
                <motion.li key={c.key} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}>
                  <a
                    href={hrefFor(c)}
                    target={external(c.href) ? "_blank" : undefined}
                    rel="noreferrer"
                    onClick={() => track("Contact", { content_name: c.key })}
                    className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all hover:-translate-y-0.5 ${c.key === "whatsapp" ? "border-emerald-500/40 bg-emerald-500/[0.07] hover:border-emerald-400" : "border-line bg-panel2/60 hover:border-brand/60"}`}
                  >
                    <span className="w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0" style={{ background: COLOR[c.key] }}><BrandLogo name={c.key} size={17} mono /></span>
                    <span className="flex-1 text-sm font-semibold">{c.label}</span>
                    {c.key === "whatsapp" && t.fastTag && <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">{t.fastTag}</span>}
                    <ArrowUpRight size={15} className="text-mist group-hover:text-fg transition-colors" />
                  </a>
                </motion.li>
              ))}
            </ul>
            <a href="/tools" className="mt-3 flex items-center justify-center gap-2 rounded-full bg-panel2 py-2 text-xs text-mist hover:text-fg">
              <Search size={13} /> {t.browse}
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3">
        {!onCheckout && <BackToTop />}
        {channels.length === 0 ? null : single ? (
          <a href={single.href} target={external(single.href) ? "_blank" : undefined} rel="noreferrer" aria-label={`Contact us on ${single.label}`} className={fab} style={{ "--c": COLOR[single.key], background: COLOR[single.key] }}>
            <span className="chan-ring" />
            <span className="chan-logo"><BrandLogo name={single.key} size={24} mono /></span>
          </a>
        ) : (
          <button onClick={() => setOpen((o) => !o)} aria-label="Chat with us" aria-expanded={open} className={fab} style={{ "--c": "#E8352B" }}>
            {!open && <span className="chan-ring" />}
            <span className={open ? "" : "chan-logo"}>{open ? <X size={22} /> : <MessageSquare size={22} />}</span>
          </button>
        )}
      </div>
    </div>
  );
}
