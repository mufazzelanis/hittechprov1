"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, Copy, Check, Sparkles, Wand2, Link2, Star, Hash } from "lucide-react";
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
        {/* Square: admin covers here are almost always portrait/square photos (4x6 or 4x4), not the
            wide landscape shots Tools covers use - a 16:10 box was cropping straight through faces. */}
        <div className="relative aspect-square rounded-xl overflow-hidden">
          <ToolCover tool={{ name: p.title, image: p.image, accent: p.accent }} position="top" />
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
  const [shared, setShared] = useState(false);
  const tags = String(p?.tags || "").split(",").map((x) => x.trim()).filter(Boolean);

  useEffect(() => {
    if (!p) return;
    const k = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [p, onClose]);

  async function copyText(text, onDone) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // clipboard API unavailable (very old browser / non-HTTPS): fall back to a hidden textarea + execCommand
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch {}
      document.body.removeChild(ta);
    }
    onDone();
  }

  function copy() {
    copyText(p.promptText, () => {
      track("Lead", { content_name: `prompt-copy: ${p.title}` });
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  function share() {
    copyText(`${window.location.origin}/prompts?p=${p.slug}`, () => {
      setShared(true);
      setTimeout(() => setShared(false), 1800);
    });
  }

  return (
    <AnimatePresence>
      {p && (
        <motion.div className="fixed inset-0 z-[75] flex items-end sm:items-center justify-center sm:p-6 bg-black/70 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
          <motion.div
            role="dialog" aria-modal="true" aria-label={p.title}
            initial={{ y: 40, scale: 0.97, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 30, scale: 0.97, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="relative w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-line bg-panel shadow-[0_-20px_80px_-20px_rgba(232,53,43,0.35)]"
          >
            <div className="sm:hidden flex justify-center pt-2.5 pb-1 sticky top-0 z-10"><span className="h-1.5 w-12 rounded-full bg-fg/20" /></div>

            {/* Poster-style header: the cover fills the top, title/category/tags sit on it, so the
                photo the admin uploaded is the star of the popup instead of a small thumbnail. */}
            <div className="relative aspect-square sm:rounded-t-3xl overflow-hidden -mt-2 sm:mt-0">
              <ToolCover tool={{ name: p.title, image: p.image, accent: p.accent }} position="top" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/10" />

              <div className="absolute top-3 left-3 right-14 flex items-center gap-2">
                {p.category && <span className="rounded-full bg-white/15 backdrop-blur px-3 py-1 text-[11px] font-medium text-white">{p.category}</span>}
                {p.featured && <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/90 px-2.5 py-1 text-[10px] font-bold text-black"><Star size={10} className="fill-black" /> Featured</span>}
              </div>
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button type="button" onClick={share} aria-label="Copy link to this prompt" title="Copy link" className="w-9 h-9 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white hover:bg-black/70">
                  {shared ? <Check size={16} className="text-emerald-400" /> : <Link2 size={16} />}
                </button>
                <button onClick={onClose} aria-label={t.closeBtn} className="w-9 h-9 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white hover:bg-black/70"><X size={18} /></button>
              </div>

              <div className="absolute bottom-0 inset-x-0 p-5">
                <h3 className="font-display font-bold text-2xl sm:text-[1.7rem] leading-tight text-white drop-shadow-sm">{p.title}</h3>
              </div>
            </div>

            <div className="px-5 sm:px-6 pt-5 pb-6">
              <div className="rounded-2xl border border-line bg-ink overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-line/80 bg-panel2/40">
                  <span className="flex gap-1.5" aria-hidden><span className="w-2.5 h-2.5 rounded-full bg-red-500/70" /><span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" /><span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" /></span>
                  <span className="ml-1.5 text-[11px] font-semibold uppercase tracking-wider text-mist">Prompt</span>
                  <span className="ml-auto text-[10px] text-mist tabular-nums">{p.promptText.length} chars</span>
                </div>
                <p className="p-4 text-sm text-fg/90 leading-relaxed whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">{p.promptText}</p>
              </div>

              {tags.length > 0 && (
                <div className="mt-4">
                  <p className="text-[11px] uppercase tracking-wider text-mist mb-2 flex items-center gap-1.5"><Hash size={11} /> {t.useWith}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((x) => <span key={x} className="rounded-full bg-panel2 border border-line px-2.5 py-1 text-[11px] text-mist">{x}</span>)}
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
