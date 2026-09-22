"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, Copy, Check, Sparkles, Wand2 } from "lucide-react";
import { spotMove } from "@/lib/spot";
import { track } from "@/lib/track";
import { ToolCover } from "./ToolsGrid";

const NEW_DAYS = 7;
const isNew = (createdAt) => Date.now() - new Date(createdAt).getTime() < NEW_DAYS * 86400000;

function Card({ p, t, onOpen, i }) {
  return (
    <motion.button
      type="button"
      onClick={() => onOpen(p)}
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
      whileHover={{ y: -4 }}
      onMouseMove={spotMove}
      className="spot group text-left rounded-2xl border border-line bg-panel overflow-hidden hover:border-brand/50 transition-colors flex flex-col"
    >
      <div className="p-2 sm:p-3 pb-0">
        <div className="relative aspect-[16/10] rounded-xl overflow-hidden">
          <ToolCover tool={{ name: p.title, image: p.image, accent: p.accent }} />
          <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
          {p.category && <span className="absolute top-2 left-2 rounded-full bg-black/55 backdrop-blur px-2.5 py-1 text-[10px] font-semibold text-white">{p.category}</span>}
          {isNew(p.createdAt) && <span className="absolute top-2 right-2 rounded-full bg-brand px-2.5 py-1 text-[10px] font-bold text-white">{t.newTag}</span>}
          <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
            <span className="w-11 h-11 rounded-full bg-white/90 text-ink flex items-center justify-center"><Wand2 size={18} /></span>
          </span>
        </div>
      </div>
      <div className="p-3 sm:p-4 flex-1 flex flex-col">
        <h3 className="font-semibold leading-snug text-sm sm:text-base line-clamp-2">{p.title}</h3>
        <p className="text-mist text-xs mt-2 leading-relaxed line-clamp-2 flex-1">{p.promptText}</p>
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand">
          <Sparkles size={13} /> {t.viewBtn}
        </p>
      </div>
    </motion.button>
  );
}

function PromptPopup({ p, t, onClose }) {
  const [copied, setCopied] = useState(false);
  const tags = String(p?.tags || "").split(",").map((x) => x.trim()).filter(Boolean);

  useEffect(() => {
    if (!p) return;
    const k = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [p, onClose]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(p.promptText);
    } catch {
      // clipboard API unavailable (very old browser / non-HTTPS): fall back to a hidden textarea + execCommand
      const ta = document.createElement("textarea");
      ta.value = p.promptText;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch {}
      document.body.removeChild(ta);
    }
    track("Lead", { content_name: `prompt-copy: ${p.title}` });
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <AnimatePresence>
      {p && (
        <motion.div className="fixed inset-0 z-[75] flex items-end sm:items-center justify-center sm:p-6 bg-black/70 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
          <motion.div
            role="dialog" aria-modal="true" aria-label={p.title}
            initial={{ y: 40, opacity: 0.6 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="relative w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-line bg-panel shadow-[0_-20px_80px_-20px_rgba(232,53,43,0.35)]"
          >
            <div className="sm:hidden flex justify-center pt-2.5 pb-1"><span className="h-1.5 w-12 rounded-full bg-fg/20" /></div>
            <button onClick={onClose} aria-label={t.closeBtn} className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white hover:bg-black/70"><X size={18} /></button>

            <div className="p-3 sm:p-4 pb-0">
              <div className="relative aspect-[16/8] rounded-2xl overflow-hidden">
                <ToolCover tool={{ name: p.title, image: p.image, accent: p.accent }} />
                <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                {p.category && <span className="absolute bottom-3 left-3 rounded-full bg-black/55 backdrop-blur px-3 py-1 text-[11px] text-white">{p.category}</span>}
              </div>
            </div>

            <div className="px-5 sm:px-6 pt-4 pb-6">
              <h3 className="font-display font-bold text-xl sm:text-2xl leading-tight">{p.title}</h3>

              <div className="mt-4 rounded-2xl border border-line bg-ink p-4">
                <p className="text-sm text-fg/90 leading-relaxed whitespace-pre-wrap font-mono">{p.promptText}</p>
              </div>

              {tags.length > 0 && (
                <div className="mt-4">
                  <p className="text-[11px] uppercase tracking-wider text-mist mb-2">{t.useWith}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((x) => <span key={x} className="rounded-full bg-panel2 px-2.5 py-1 text-[11px] text-mist">{x}</span>)}
                  </div>
                </div>
              )}

              <div className="mt-5 grid grid-cols-2 gap-2.5">
                <button type="button" onClick={copy} className={`inline-flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-colors ${copied ? "bg-emerald-500 text-white" : "btn-primary justify-center"}`}>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span key={copied ? "on" : "off"} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} className="inline-flex items-center gap-2">
                      {copied ? <><Check size={16} /> {t.copiedBtn}</> : <><Copy size={16} /> {t.copyBtn}</>}
                    </motion.span>
                  </AnimatePresence>
                </button>
                <button type="button" onClick={onClose} className="btn-ghost justify-center !py-3.5">{t.closeBtn}</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function PromptVaultGrid({ prompts, t }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [sel, setSel] = useState(null);
  const opened = useRef(false);

  const categories = useMemo(() => [...new Set(prompts.map((p) => p.category).filter(Boolean))], [prompts]);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return prompts.filter((p) => (!cat || p.category === cat) && (!s || p.title.toLowerCase().includes(s) || p.promptText.toLowerCase().includes(s) || (p.tags || "").toLowerCase().includes(s)));
  }, [prompts, q, cat]);

  // ?p=slug deep-links straight to a prompt's popup (used by share links / the admin search jump)
  useEffect(() => {
    if (opened.current) return;
    const slug = params.get("p");
    if (!slug) return;
    const found = prompts.find((p) => p.slug === slug);
    if (found) { setSel(found); opened.current = true; }
  }, [params, prompts]);

  function open(p) {
    setSel(p);
    router.replace(`/prompts?p=${p.slug}`, { scroll: false });
  }
  function close() {
    setSel(null);
    router.replace("/prompts", { scroll: false });
  }

  return (
    <div className="container-x pb-24">
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mist" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.searchPlaceholder} className="input pl-10" />
        </div>
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <button onClick={() => setCat("")} className={`px-3.5 py-2 rounded-full text-xs font-medium border transition-colors ${!cat ? "bg-brand border-brand text-white" : "border-line text-mist hover:text-fg"}`}>{t.allChip}</button>
            {categories.map((c) => (
              <button key={c} onClick={() => setCat(c)} className={`px-3.5 py-2 rounded-full text-xs font-medium border transition-colors ${cat === c ? "bg-brand border-brand text-white" : "border-line text-mist hover:text-fg"}`}>{c}</button>
            ))}
          </div>
        )}
      </div>

      <motion.div layout className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <AnimatePresence mode="popLayout">
          {list.map((p, i) => <Card key={p.id} p={p} t={t} i={i} onOpen={open} />)}
        </AnimatePresence>
      </motion.div>
      {list.length === 0 && <p className="text-center text-mist py-16">{t.empty}</p>}

      <PromptPopup p={sel} t={t} onClose={close} />
    </div>
  );
}
