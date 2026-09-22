"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ArrowRight, Headset, PenLine } from "lucide-react";
import BrandLogo from "./BrandLogo";
import LeadButton from "./LeadModal";
import { track } from "@/lib/track";

// Brand look + icon for every channel key (see lib/channels.js).
const Glyph = Object.fromEntries(["whatsapp", "telegram", "messenger", "instagram", "phone", "email"].map((k) => [k, ({ size }) => <BrandLogo name={k} size={size} mono />]));
const LOOK = {
  whatsapp: { from: "#2BE372", to: "#0E9F6E", glow: "#25D366" },
  telegram: { from: "#3DBBF5", to: "#1B7FC4", glow: "#229ED9" },
  messenger: { from: "#00C6FF", to: "#8A3FFC", glow: "#0084FF" },
  instagram: { from: "#F9B233", to: "#D6249F", glow: "#E4405F" },
  phone: { from: "#FF6A5E", to: "#C81E14", glow: "#E8352B" },
  email: { from: "#8B95A7", to: "#4B5567", glow: "#6B7280" },
};
const external = (h) => /^https?:/i.test(h);

// Adds ?text=... to a WhatsApp link so the chat opens with the message already typed.
function withText(href, text) {
  try {
    const u = new URL(href);
    u.searchParams.set("text", text);
    return u.toString();
  } catch {
    return href;
  }
}

const list = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.18 } } };
const rise = { hidden: { opacity: 0, y: 14, scale: 0.96 }, show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 320, damping: 24 } } };

// "Request new tool" (kind="tool") and "Quote for custom pack" (kind="quote") -> popup with big clickable
// channel icons (WhatsApp featured). Channels come from Admin -> Settings (only the ones switched on).
// With no channel configured it falls back to the request form.
export default function RequestTool({ channels = [], s, kind = "tool", className = "", children }) {
  const [open, setOpen] = useState(false);
  const [tool, setTool] = useState("");
  const cfg = kind === "quote"
    ? { title: s.quoteTitle, text: s.quoteText, ph: s.quotePlaceholder, msg: s.quoteMessage, lead: "custom-pack" }
    : { title: s.reqTitle, text: s.reqText, ph: s.reqPlaceholder, msg: s.reqMessage, lead: "tool-request" };

  useEffect(() => {
    if (!open) return;
    const k = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [open]);

  if (!channels.length) return <LeadButton type={cfg.lead} className={className}>{children}</LeadButton>;

  // With no tool name typed, drop the dangling ": {tool}" so the message still reads naturally.
  const message = String(cfg.msg).split("{tool}").join(tool.trim()).replace(/[\s:\-–]+$/, "");
  const ordered = [...channels].sort((a, b) => (b.key === "whatsapp") - (a.key === "whatsapp"));
  const link = (c) => (c.key === "whatsapp" ? withText(c.href, message) : c.href);
  const [main, ...others] = ordered;
  const ML = LOOK[main.key];
  const MG = Glyph[main.key];

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>{children}</button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={cfg.title}
              className="relative w-full max-w-md max-h-[94dvh] overflow-y-auto overflow-x-hidden rounded-3xl border border-line bg-panel shadow-[0_30px_80px_-20px_rgba(232,53,43,0.35)]"
              initial={{ y: 40, scale: 0.94, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 30, scale: 0.96, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
            >
              {/* glowing header */}
              <div className="relative px-6 pt-7 pb-5 text-center overflow-hidden">
                <motion.span className="absolute -top-16 -left-10 w-52 h-52 rounded-full bg-brand/25 blur-3xl" animate={{ x: [0, 24, 0], y: [0, 14, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
                <motion.span className="absolute -top-10 -right-12 w-44 h-44 rounded-full blur-3xl" style={{ background: ML.glow + "33" }} animate={{ x: [0, -20, 0], y: [0, 18, 0] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }} />
                <button onClick={() => setOpen(false)} aria-label="Close" className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center text-mist hover:text-fg hover:bg-fg/10 transition-colors"><X size={18} /></button>

                <motion.div
                  className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-white shadow-glow"
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0, y: [0, -5, 0] }}
                  transition={{ scale: { type: "spring", stiffness: 260, damping: 16, delay: 0.1 }, rotate: { duration: 0.4 }, y: { duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.6 } }}
                >
                  <Headset size={28} />
                  <motion.span className="absolute inset-0 rounded-2xl border-2 border-brand" animate={{ scale: [1, 1.5], opacity: [0.6, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }} />
                </motion.div>
                <h3 className="relative font-display font-bold text-2xl mt-4">{cfg.title}</h3>
                <p className="relative text-sm text-mist leading-relaxed mt-2 max-w-sm mx-auto">{cfg.text}</p>
              </div>

              <div className="px-6 pb-6">
                {/* what to ask for */}
                <div className="relative">
                  <PenLine size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mist pointer-events-none" />
                  <input value={tool} onChange={(e) => setTool(e.target.value)} placeholder={cfg.ph} maxLength={80} className="input !pl-10 !rounded-xl" />
                </div>

                <p className="text-[11px] uppercase tracking-[0.14em] text-mist text-center mt-5 mb-3">{s.reqChooseLabel}</p>

                <motion.div variants={list} initial="hidden" animate="show" className="space-y-3">
                  {/* featured channel */}
                  <motion.a
                    variants={rise}
                    href={link(main)}
                    onClick={() => track("Contact", { content_name: main.key })}
                    target={external(main.href) ? "_blank" : undefined}
                    rel="noreferrer"
                    whileHover={{ y: -3, scale: 1.015 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative flex items-center gap-3 sm:gap-4 rounded-2xl p-3.5 sm:p-4 text-white overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${ML.from}, ${ML.to})`, boxShadow: `0 14px 34px -14px ${ML.glow}` }}
                  >
                    <span className="absolute inset-0 bg-[radial-gradient(circle_at_85%_0%,rgba(255,255,255,0.28),transparent_55%)]" />
                    <span className="relative shrink-0">
                      <motion.span className="absolute inset-0 rounded-full bg-white/40" animate={{ scale: [1, 1.55], opacity: [0.55, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }} />
                      <span className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center ring-1 ring-white/40">
                        <MG size={28} />
                      </span>
                    </span>
                    <span className="relative min-w-0 flex-1 text-left">
                      <span className="block font-display font-bold text-base sm:text-lg leading-tight whitespace-nowrap">{main.key === "whatsapp" ? s.reqWhatsappBtn : main.label}</span>
                      {main.key !== "whatsapp" && <span className="block text-xs text-white/85 truncate mt-0.5">{main.sub}</span>}
                    </span>
                    <ArrowRight size={20} className="relative shrink-0 transition-transform group-hover:translate-x-1.5" />
                  </motion.a>

                  {/* other channels as clickable icon tiles */}
                  {others.length > 0 && (
                    <motion.div variants={rise}>
                      <p className="text-xs text-mist text-center mb-2.5">{s.reqOtherLabel}</p>
                      {/* up to 4 icons share one row; 5 wrap as 3 + 2 (centred), so no tile is left dangling */}
                      <div className="flex flex-wrap justify-center gap-2.5">
                        {others.map((c) => {
                          const cols = others.length <= 4 ? others.length : 3;
                          const L = LOOK[c.key];
                          const G = Glyph[c.key];
                          return (
                            <motion.a
                              key={c.key}
                              href={link(c)}
                              onClick={() => track("Contact", { content_name: c.key })}
                              target={external(c.href) ? "_blank" : undefined}
                              rel="noreferrer"
                              aria-label={c.label}
                              whileHover={{ y: -5, boxShadow: `0 16px 30px -14px ${L.glow}` }}
                              whileTap={{ scale: 0.95 }}
                              style={{ width: `calc((100% - ${(cols - 1) * 10}px) / ${cols})`, maxWidth: cols <= 2 ? "9.5rem" : undefined }}
                              className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-panel2/60 px-1.5 py-3.5 hover:border-white/25 transition-colors"
                            >
                              <motion.span
                                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white"
                                style={{ background: `linear-gradient(135deg, ${L.from}, ${L.to})` }}
                                whileHover={{ rotate: [0, -8, 8, 0], scale: 1.1 }}
                                transition={{ duration: 0.45 }}
                              >
                                <G size={24} />
                              </motion.span>
                              <span className="text-[11px] sm:text-xs font-semibold leading-none">{c.label}</span>
                            </motion.a>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </motion.div>

                {/* live preview of the message that will open in WhatsApp */}
                {main.key === "whatsapp" && (
                  <div className="mt-5">
                    <p className="text-[11px] text-mist mb-1.5 text-center">{s.reqPreviewLabel}</p>
                    <motion.div layout className="ml-auto max-w-[88%] rounded-2xl rounded-br-md bg-[#0b3d33] border border-emerald-500/20 px-3.5 py-2.5 text-[13px] leading-snug text-emerald-50">
                      {message}
                      <span className="block text-[10px] text-emerald-200/60 text-right mt-1">✓✓</span>
                    </motion.div>
                  </div>
                )}

                <div className="mt-5 pt-4 border-t border-line text-center" onClickCapture={() => setOpen(false)}>
                  <LeadButton type={cfg.lead} className="text-xs text-mist hover:text-fg underline underline-offset-4">{s.reqFormLink}</LeadButton>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
