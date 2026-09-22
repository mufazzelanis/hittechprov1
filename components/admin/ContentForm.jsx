"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Loader2, Check, Search, RotateCcw, Home, LayoutGrid, Users, Gift, Gauge, ShoppingBag, ChevronDown, ExternalLink,
  Monitor, Smartphone, RefreshCw, Star, Download, Upload, Undo2, Sparkles, X, AlertCircle, PanelRight, Layers, Wand2,
} from "lucide-react";
import { CONTENT_PAGES, CONTENT_KEYS } from "@/lib/content";
import { ImageInput } from "./ResourceManager";
import RichText from "../RichText";

/* ------------------------------------------------------------------ meta */
const META = {
  home: { icon: Home, url: "/", note: "Everything on the front page, from the hero to the FAQ." },
  tools: { icon: LayoutGrid, url: "/tools", note: "The full catalogue page." },
  prompts: { icon: Wand2, url: "/prompts", note: "AI Prompt Vault page and popup." },
  affiliate: { icon: Users, url: "/affiliate", note: "The affiliate program page." },
  offers: { icon: Gift, url: "/free-offers", note: "Free Offers page and claim popup." },
  limits: { icon: Gauge, url: "/limits", note: "Live tool status and limits page." },
  other: { icon: ShoppingBag, url: "/checkout", note: "Checkout, popups, chat, WhatsApp and footer." },
};
// where a section lives on the public page (used by "View on site")
const ANCHOR = [["Hero (", "#home"], ["Single tools", "#tools"], ["Bundles", "#bundles"], ["Custom pack", "#custom"], ["Reviews", "#reviews"], ["FAQ", "#faq"], ["Footer", "#contact"]];
const anchorOf = (title) => ANCHOR.find(([t]) => title.startsWith(t))?.[1] || "";
const SAMPLE = { price: "৳239", count: "12", commission: "30%", tool: "Canva Pro", items: "Canva Pro, Ahrefs", total: "৳1,299", name: "HiT Tech Pro", offer: "Canva Pro", days: "30" };
const NL = String.fromCharCode(10);
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const placeholders = (def, hint) => [...new Set([...(String(def).match(/\{(\w+)\}/g) || []), ...(String(hint || "").match(/\{(\w+)\}/g) || [])])];

/* ----------------------------------------------------------------- field */
function ContentField({ f, value, onChange, dirty, siteName, single }) {
  const [key, label, def, type, hint] = f;
  const el = useRef(null);
  const val = value ?? "";
  const custom = val !== "" && val !== def;
  const chips = placeholders(def, hint);
  const rich = /\*[^*]+\*|\{\w+\}/.test(val);

  const edit = (fn) => {
    const t = el.current; if (!t) return;
    const a = t.selectionStart ?? val.length, b = t.selectionEnd ?? val.length;
    const [next, caret] = fn(val, a, b);
    onChange(next);
    requestAnimationFrame(() => { t.focus(); t.setSelectionRange(caret, caret); });
  };
  const insert = (tag) => edit((s, a, b) => [s.slice(0, a) + tag + s.slice(b), a + tag.length]);
  const highlight = () => edit((s, a, b) => (a === b ? [s.slice(0, a) + "**" + s.slice(b), a + 1] : [s.slice(0, a) + "*" + s.slice(a, b) + "*" + s.slice(b), b + 2]));

  const common = { id: "f-" + key, ref: el, value: val, className: "input", onChange: (e) => onChange(e.target.value) };
  return (
    <div className={`group min-w-0 ${!single && (type === "textarea" || type === "image") ? "sm:col-span-2" : ""}`} id={"field-" + key}>
      <div className="flex items-center justify-between gap-3 mb-1.5 min-h-[20px]">
        <label htmlFor={"f-" + key} className="flex items-center gap-2 text-xs text-mist min-w-0">
          <span className="truncate">{label}</span>
          {dirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" title="Unsaved change" />}
          {custom && !dirty && <span className="shrink-0 rounded-full bg-brand/15 text-brand px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide">Custom</span>}
        </label>
        <span className="flex items-center gap-3 shrink-0">
          {type === "textarea" && <span className="text-[11px] tabular-nums text-mist">{val.length}</span>}
          {custom && (
            <button type="button" onClick={() => onChange(def)} className="flex items-center gap-1 text-[11px] text-mist hover:text-fg" title="Back to the original text"><RotateCcw size={11} /> Default</button>
          )}
        </span>
      </div>

      {type === "image" ? <ImageInput value={val} onChange={onChange} />
        : type === "textarea" ? <textarea {...common} rows={Math.min(9, Math.max(3, Math.ceil(val.length / 75) + val.split(NL).length - 1))} />
        : <input {...common} />}

      {type !== "image" && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 h-0 overflow-hidden opacity-0 group-focus-within:h-auto group-focus-within:opacity-100 transition-opacity">
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={highlight} className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-[11px] text-mist hover:text-fg hover:border-brand/60" title="Wrap the selected words in *stars* to colour them"><Star size={11} className="text-brand" /> Highlight</button>
          {chips.map((c) => (
            <button key={c} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insert(c)} className="rounded-md border border-line px-2 py-1 font-mono text-[11px] text-mist hover:text-fg hover:border-brand/60" title="Insert this placeholder at the cursor">{c}</button>
          ))}
        </div>
      )}

      {hint && <p className="text-[11px] text-mist mt-1.5 leading-relaxed">{hint}</p>}
      {rich && type !== "image" && (
        <p className="mt-2 rounded-lg bg-panel2/50 border border-line px-3 py-2 text-xs leading-relaxed"><span className="text-mist mr-1.5">Preview</span><RichText text={val} vars={{ ...SAMPLE, name: siteName || SAMPLE.name }} /></p>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- preview */
function PreviewDrawer({ open, onClose, url, version }) {
  const [device, setDevice] = useState("phone");
  const box = useRef(null);
  const [w, setW] = useState(420);
  useEffect(() => {
    if (!open || !box.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(box.current);
    return () => ro.disconnect();
  }, [open]);
  const DESK = 1280;
  const scale = Math.min(1, w / DESK);
  return (
    <AnimatePresence>
      {open && (
        <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 280, damping: 32 }} className="fixed z-[45] top-0 right-0 bottom-0 w-full sm:w-[440px] flex flex-col border-l border-line bg-panel shadow-[-20px_0_60px_-20px_rgba(0,0,0,0.7)]" aria-label="Live preview">
          <div className="flex items-center gap-2 px-4 h-14 border-b border-line shrink-0">
            <PanelRight size={16} className="text-brand" />
            <span className="font-display font-semibold text-sm">Live preview</span>
            <span className="flex-1" />
            <div className="flex rounded-lg border border-line overflow-hidden">
              {[["phone", Smartphone], ["desktop", Monitor]].map(([k, I]) => (
                <button key={k} type="button" onClick={() => setDevice(k)} aria-label={k} className={`px-2.5 py-1.5 ${device === k ? "bg-brand text-white" : "text-mist hover:text-fg"}`}><I size={15} /></button>
              ))}
            </div>
            <a href={url} target="_blank" rel="noreferrer" className="p-2 text-mist hover:text-fg" aria-label="Open in a new tab"><ExternalLink size={15} /></a>
            <button type="button" onClick={onClose} aria-label="Close preview" className="p-2 text-mist hover:text-fg"><X size={17} /></button>
          </div>
          <div ref={box} className="flex-1 min-h-0 overflow-hidden bg-black/40 relative">
            {device === "phone" ? (
              <iframe key={url + version} src={url} title="Preview" className="w-full h-full bg-ink" />
            ) : (
              <iframe key={url + version + "d"} src={url} title="Preview" className="bg-ink origin-top-left absolute top-0 left-0" style={{ width: DESK, height: `${100 / scale}%`, transform: `scale(${scale})` }} />
            )}
          </div>
          <p className="px-4 py-2 text-[11px] text-mist border-t border-line shrink-0">Shows the saved website. It refreshes after you press Save.</p>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ main */
export default function ContentForm({ initial, initialPage = "", focus = "", nonce = "" }) {
  const [v, setV] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [tab, setTab] = useState(CONTENT_PAGES.some((p) => p.id === initialPage) ? initialPage : CONTENT_PAGES[0].id);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [closed, setClosed] = useState(() => new Set());
  const [preview, setPreview] = useState(false);
  const [pv, setPv] = useState(0);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [active, setActive] = useState("");
  const [resetAsk, setResetAsk] = useState("");
  const fileRef = useRef(null);
  const set = (k, x) => setV((p) => ({ ...p, [k]: x }));
  const flash = (ok, text) => { setToast({ ok, text }); setTimeout(() => setToast(null), 3000); };

  const dirtySet = useMemo(() => new Set(CONTENT_KEYS.filter((k) => (v[k] ?? "") !== (saved[k] ?? ""))), [v, saved]);
  const defOf = useMemo(() => Object.fromEntries(CONTENT_PAGES.flatMap((p) => p.groups.flatMap((g) => g.fields.map((x) => [x[0], x[2]])))), []);
  const isCustom = (k) => (v[k] ?? "") !== "" && (v[k] ?? "") !== defOf[k];
  const totalCustom = CONTENT_KEYS.filter(isCustom).length;

  async function save() {
    if (!dirtySet.size || busy) return;
    setBusy(true);
    const body = Object.fromEntries([...dirtySet].map((k) => [k, v[k] ?? ""]));
    const r = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    if (r.ok) { setSaved((s) => ({ ...s, ...body })); setPv((n) => n + 1); flash(true, "Saved. The website is updated."); } else flash(false, "Could not save");
  }
  const saveRef = useRef(save); saveRef.current = save;

  // arriving from the global search: open the right page, then scroll to the text and flash it
  useEffect(() => {
    if (initialPage && CONTENT_PAGES.some((p) => p.id === initialPage)) { setTab(initialPage); setQ(""); setFilter("all"); }
    if (!focus) return;
    const go = setTimeout(() => {
      const wrap = document.getElementById("field-" + focus);
      if (!wrap) return;
      wrap.scrollIntoView({ behavior: "smooth", block: "center" });
      wrap.classList.add("flash-target");
      setTimeout(() => wrap.classList.remove("flash-target"), 2600);
      wrap.querySelector("input,textarea")?.focus({ preventScroll: true });
    }, 600);
    return () => clearTimeout(go);
  }, [initialPage, focus, nonce]);
  useEffect(() => {
    const key = (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); saveRef.current(); } };
    const leave = (e) => { if (dirtySet.size) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("keydown", key); window.addEventListener("beforeunload", leave);
    return () => { window.removeEventListener("keydown", key); window.removeEventListener("beforeunload", leave); };
  }, [dirtySet.size]);

  const needle = q.trim().toLowerCase();
  const passes = (f) => {
    const [key, label, def] = f;
    if (filter === "custom" && !isCustom(key)) return false;
    if (filter === "unsaved" && !dirtySet.has(key)) return false;
    return !needle || label.toLowerCase().includes(needle) || key.toLowerCase().includes(needle) || String(v[key] ?? "").toLowerCase().includes(needle) || String(def).toLowerCase().includes(needle);
  };

  const page = CONTENT_PAGES.find((p) => p.id === tab);
  const pages = needle || filter !== "all" ? (filter !== "all" && !needle ? [page] : CONTENT_PAGES) : [page];
  const sections = pages.flatMap((pg) => pg.groups.map((g, gi) => ({ pg, g, id: `sec-${pg.id}-${gi}-${slug(g.title)}`, fields: g.fields.filter(passes) }))).filter((s) => s.fields.length);

  // scroll-spy for the "On this page" list
  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter(Boolean);
    if (!els.length) return;
    const io = new IntersectionObserver((es) => { const hit = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]; if (hit) setActive(hit.target.id); }, { rootMargin: "-15% 0px -70% 0px" });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [tab, needle, filter, sections.length]);

  const toggle = (id) => setClosed((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const go = (id) => { setClosed((s) => { const n = new Set(s); n.delete(id); return n; }); setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 30); };
  const resetSection = (fields) => { setV((p) => ({ ...p, ...Object.fromEntries(fields.map((x) => [x[0], x[2]])) })); setResetAsk(""); };

  function exportJson() {
    const out = Object.fromEntries(CONTENT_KEYS.map((k) => [k, v[k] ?? ""]));
    const url = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = `htp-page-content-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url);
  }
  async function importJson(file) {
    if (!file) return;
    try {
      const j = JSON.parse(await file.text()); const next = { ...v }; let n = 0;
      for (const k of CONTENT_KEYS) if (k in j && String(j[k]) !== (v[k] ?? "")) { next[k] = String(j[k]); n++; }
      setV(next); flash(true, n ? `${n} text${n > 1 ? "s" : ""} loaded. Press Save to publish.` : "Nothing to change in that file");
    } catch { flash(false, "That is not a valid content file"); }
    if (fileRef.current) fileRef.current.value = "";
  }

  const pageStats = (pg) => { const keys = pg.groups.flatMap((g) => g.fields.map((x) => x[0])); return { total: keys.length, custom: keys.filter(isCustom).length, unsaved: keys.filter((k) => dirtySet.has(k)).length }; };
  const previewUrl = META[tab].url;
  const resultCount = sections.reduce((n, s) => n + s.fields.length, 0);

  return (
    <div className={`max-w-6xl pb-28 transition-[padding] ${preview ? "xl:pr-[460px]" : ""}`}>
      {/* intro + toolbar */}
      <div className="rounded-2xl border border-line bg-panel p-4 sm:p-5 mb-5 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 rounded-xl bg-brand/15 text-brand flex items-center justify-center shrink-0"><Sparkles size={18} /></span>
          <div className="min-w-0">
            <p className="font-display font-semibold leading-tight">Website text editor</p>
            <p className="text-xs text-mist mt-0.5">Change any heading, button or paragraph. <b className="text-fg">{totalCustom}</b> of {CONTENT_KEYS.length} texts are customised.</p>
          </div>
        </div>
        <span className="flex-1" />
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setPreview((o) => !o)} className={`btn-ghost !py-2 ${preview ? "!border-brand !text-fg" : ""}`}><PanelRight size={15} /> Live preview</button>
          <button type="button" onClick={exportJson} className="btn-ghost !py-2" title="Download all texts as a backup file"><Download size={15} /> <span className="hidden sm:inline">Backup</span></button>
          <button type="button" onClick={() => fileRef.current?.click()} className="btn-ghost !py-2" title="Load texts from a backup file"><Upload size={15} /> <span className="hidden sm:inline">Restore</span></button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => importJson(e.target.files?.[0])} />
        </div>
        <p className="basis-full text-[11px] text-mist leading-relaxed">Tip: put <b className="text-fg">*stars*</b> around words to colour them, and use <b className="text-fg">{"{price}"}</b>-style placeholders where a field shows them. Click a field to see quick-insert buttons. An empty field goes back to the original text.</p>
      </div>

      {/* search + filters */}
      <div className="sticky top-16 z-20 -mx-4 sm:-mx-8 px-4 sm:px-8 py-3 bg-ink/90 backdrop-blur border-b border-line mb-5 space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mist" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search any text on the site: heading, button, paragraph…" className="input pl-10 pr-10" />
            {q && <button type="button" onClick={() => setQ("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-mist hover:text-fg"><X size={16} /></button>}
          </div>
          <div className="flex rounded-lg border border-line overflow-hidden text-xs">
            {[["all", "All"], ["custom", `Customised ${totalCustom}`], ["unsaved", `Unsaved ${dirtySet.size}`]].map(([k, l]) => (
              <button key={k} type="button" onClick={() => setFilter(k)} className={`px-3.5 py-2.5 transition-colors ${filter === k ? "bg-brand text-white" : "text-mist hover:text-fg"}`}>{l}</button>
            ))}
          </div>
        </div>
        {(needle || filter !== "all") && <p className="text-xs text-mist">{resultCount} matching text{resultCount === 1 ? "" : "s"} across {CONTENT_PAGES.length} pages</p>}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[230px_minmax(0,1fr)] gap-6 items-start">
        {/* left: pages + on this page */}
        <nav className="lg:sticky lg:top-40 space-y-4" aria-label="Pages">
          <div className="flex lg:flex-col gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0 pb-1">
            {CONTENT_PAGES.map((p) => {
              const m = META[p.id], st = pageStats(p), on = tab === p.id && !needle && filter === "all";
              return (
                <button key={p.id} type="button" onClick={() => { setQ(""); setFilter("all"); setTab(p.id); window.scrollTo({ top: 0, behavior: "smooth" }); }} className={`shrink-0 lg:w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm border transition-colors ${on ? "bg-brand/15 border-brand/40 text-fg" : "border-transparent text-mist hover:text-fg hover:bg-panel"}`}>
                  <m.icon size={17} className={`shrink-0 ${on ? "text-brand" : ""}`} />
                  <span className="min-w-0 flex-1 whitespace-nowrap lg:whitespace-normal"><span className="block font-medium leading-tight">{p.label}</span><span className="hidden lg:block text-[11px] text-mist mt-0.5">{st.total} texts{st.custom ? ` · ${st.custom} custom` : ""}</span></span>
                  {st.unsaved > 0 && <span className="shrink-0 min-w-[18px] h-[18px] rounded-full bg-amber-400 text-black text-[10px] font-bold flex items-center justify-center px-1">{st.unsaved}</span>}
                </button>
              );
            })}
          </div>

          {!needle && filter === "all" && (
            <div className="hidden lg:block rounded-xl border border-line bg-panel p-3">
              <p className="px-2 pb-2 text-[11px] uppercase tracking-wider text-mist flex items-center gap-1.5"><Layers size={12} /> On this page</p>
              <ul className="max-h-[42vh] overflow-y-auto no-scrollbar">
                {sections.map((s) => (
                  <li key={s.id}><button type="button" onClick={() => go(s.id)} className={`w-full text-left rounded-lg px-2.5 py-1.5 text-xs leading-snug transition-colors ${active === s.id ? "bg-brand/15 text-fg" : "text-mist hover:text-fg"}`}>{s.g.title}</button></li>
                ))}
              </ul>
            </div>
          )}
        </nav>

        {/* right: sections */}
        <div className="min-w-0 space-y-5">
          {!needle && filter === "all" && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-0"><h1 className="font-display font-bold text-xl">{page.label}</h1><p className="text-xs text-mist">{META[tab].note}</p></div>
              <span className="flex-1" />
              <button type="button" onClick={() => setClosed(new Set(sections.map((s) => s.id)))} className="text-xs text-mist hover:text-fg">Collapse all</button>
              <button type="button" onClick={() => setClosed(new Set())} className="text-xs text-mist hover:text-fg">Expand all</button>
              <a href={META[tab].url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-brand hover:underline">View page <ExternalLink size={12} /></a>
            </div>
          )}

          {sections.length === 0 && (
            <div className="rounded-2xl border border-line bg-panel py-16 text-center">
              <Search size={26} className="mx-auto text-mist" />
              <p className="mt-3 text-sm text-mist">{filter === "unsaved" ? "No unsaved changes." : filter === "custom" ? "Nothing customised yet." : `Nothing matches “${q}”.`}</p>
            </div>
          )}

          {sections.map((s) => {
            const open = !closed.has(s.id) || !!needle;
            const nCustom = s.fields.filter((x) => isCustom(x[0])).length, nDirty = s.fields.filter((x) => dirtySet.has(x[0])).length;
            const anchor = anchorOf(s.g.title);
            return (
              <section key={s.id} id={s.id} className="scroll-mt-44 rounded-2xl border border-line bg-panel overflow-hidden">
                <div className="flex items-center gap-3 px-5 sm:px-6 py-4">
                  <button type="button" onClick={() => toggle(s.id)} aria-expanded={open} className="flex-1 min-w-0 flex items-center gap-3 text-left">
                    <ChevronDown size={17} className={`shrink-0 text-mist transition-transform ${open ? "" : "-rotate-90"}`} />
                    <span className="min-w-0"><span className="block font-display font-semibold truncate">{s.g.title}</span>
                      {(needle || filter !== "all") && <span className="block text-[11px] text-mist">{s.pg.label}</span>}</span>
                  </button>
                  <span className="hidden sm:flex items-center gap-2 shrink-0 text-[11px]">
                    <span className="text-mist">{s.fields.length} texts</span>
                    {nCustom > 0 && <span className="rounded-full bg-brand/15 text-brand px-2 py-0.5 font-semibold">{nCustom} custom</span>}
                    {nDirty > 0 && <span className="rounded-full bg-amber-400/20 text-amber-300 px-2 py-0.5 font-semibold">{nDirty} unsaved</span>}
                  </span>
                  {anchor && <a href={META[s.pg.id].url + anchor} target="_blank" rel="noreferrer" className="shrink-0 p-1.5 text-mist hover:text-fg" title="View this section on the site"><ExternalLink size={14} /></a>}
                  {nCustom > 0 && (resetAsk === s.id ? (
                    <span className="flex items-center gap-2 shrink-0 text-[11px]"><button type="button" onClick={() => resetSection(s.g.fields)} className="rounded-md bg-red-500/20 text-red-300 px-2 py-1 font-semibold">Reset all</button><button type="button" onClick={() => setResetAsk("")} className="text-mist hover:text-fg">Cancel</button></span>
                  ) : (
                    <button type="button" onClick={() => setResetAsk(s.id)} className="shrink-0 p-1.5 text-mist hover:text-fg" title="Restore every text in this section to the original"><RotateCcw size={14} /></button>
                  ))}
                </div>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <div className={`grid grid-cols-[minmax(0,1fr)] ${preview ? "" : "sm:grid-cols-2"} gap-x-5 gap-y-5 px-5 sm:px-6 pb-6 border-t border-line/60 pt-5`}>
                        {s.fields.map((f) => <ContentField key={f[0]} f={f} value={v[f[0]]} onChange={(x) => set(f[0], x)} dirty={dirtySet.has(f[0])} siteName={v.siteName} single={preview} />)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            );
          })}
        </div>
      </div>

      <PreviewDrawer open={preview} onClose={() => setPreview(false)} url={previewUrl} version={pv} />

      {/* save bar */}
      <AnimatePresence>
        {dirtySet.size > 0 && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} transition={{ type: "spring", stiffness: 320, damping: 30 }} className={`fixed z-40 left-4 right-4 bottom-20 lg:bottom-6 lg:left-auto ${preview ? "lg:right-[460px]" : "lg:right-8"} lg:w-[460px] flex items-center gap-3 rounded-2xl border border-amber-400/40 bg-panel/95 backdrop-blur px-4 py-3 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]`}>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <span className="text-sm flex-1 min-w-0 truncate">{dirtySet.size} unsaved change{dirtySet.size > 1 ? "s" : ""}<span className="hidden sm:inline text-mist text-xs"> · Ctrl+S</span></span>
            <button type="button" onClick={() => setV(saved)} className="btn-ghost !py-2 !px-3 text-xs"><Undo2 size={13} /> Discard</button>
            <button type="button" onClick={save} disabled={busy} className="btn-primary !py-2 !px-4 text-sm">{busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Publish</button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`fixed z-50 top-5 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm shadow-glow bg-panel2 ${toast.ok ? "border-emerald-500/40" : "border-red-500/40"}`}>
            {toast.ok ? <Check size={16} className="text-emerald-400" /> : <AlertCircle size={16} className="text-red-400" />} {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
