"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search, X, Loader2, CornerDownLeft, ArrowUp, ArrowDown, Zap, FileText, Settings2, Type, Package, ShoppingCart, Users,
  Inbox, HelpCircle, ExternalLink, LogOut, Clock, History, Command, SearchX,
} from "lucide-react";
import { searchStatic, SUGGESTED, TYPES } from "@/lib/adminIndex";
import { navStart } from "@/components/LoadingSystem";

const ICON = { action: Zap, page: FileText, setting: Settings2, text: Type, product: Package, order: ShoppingCart, person: Users, lead: Inbox, content: HelpCircle };
const COLOR = { action: "text-amber-300 bg-amber-400/15", page: "text-sky-300 bg-sky-400/15", setting: "text-emerald-300 bg-emerald-400/15", text: "text-fuchsia-300 bg-fuchsia-400/15", product: "text-brand bg-brand/15", order: "text-orange-300 bg-orange-400/15", person: "text-indigo-300 bg-indigo-400/15", lead: "text-teal-300 bg-teal-400/15", content: "text-pink-300 bg-pink-400/15" };
const ORDER = ["action", "page", "setting", "product", "order", "person", "lead", "content", "text"];
const CHIPS = [["all", "All"], ["action", "Actions"], ["page", "Pages"], ["setting", "Settings"], ["text", "Website text"], ["product", "Products"], ["order", "Orders"], ["person", "People"], ["lead", "Leads"]];
const PER_GROUP = 6;
const RECENT_KEY = "htp_admin_recent";

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function Mark({ text, terms }) {
  if (!terms.length) return text;
  const parts = String(text).split(new RegExp(`(${terms.map(esc).join("|")})`, "ig"));
  return parts.map((p, i) => (i % 2 ? <mark key={i} className="bg-transparent text-brand font-semibold">{p}</mark> : p));
}

const readRecent = () => { try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; } };
const writeRecent = (list) => { try { localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 6))); } catch {} };

export default function AdminSearch({ onLogout }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [chip, setChip] = useState("all");
  const [remote, setRemote] = useState([]);
  const [busy, setBusy] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [recent, setRecent] = useState([]);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const seq = useRef(0);

  const show = useCallback(() => { setRecent(readRecent()); setOpen(true); }, []);
  const hide = useCallback(() => { setOpen(false); setQ(""); setChip("all"); setRemote([]); setCursor(0); }, []);

  // shortcuts: Ctrl/Cmd+K anywhere, "/" when not typing
  useEffect(() => {
    const k = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); open ? hide() : show(); return; }
      const tag = (e.target.tagName || "").toLowerCase();
      if (e.key === "Escape" && open) { e.preventDefault(); e.stopPropagation(); setQ((cur) => { if (cur) return ""; hide(); return cur; }); return; }
      if (e.key === "/" && !open && !["input", "textarea", "select"].includes(tag) && !e.target.isContentEditable) { e.preventDefault(); show(); }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, show, hide]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    setTimeout(() => inputRef.current?.focus(), 30);
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // records from the database (debounced, stale answers are dropped)
  useEffect(() => {
    const term = q.trim();
    if (!open || term.length < 2 && !/^#?\d+$/.test(term)) { setRemote([]); setBusy(false); return; }
    const my = ++seq.current;
    const ctl = new AbortController();
    setBusy(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/admin/search?q=${encodeURIComponent(term)}`, { signal: ctl.signal, cache: "no-store" });
        const j = r.ok ? await r.json() : { results: [] };
        if (my === seq.current) setRemote(j.results || []);
      } catch {}
      if (my === seq.current) setBusy(false);
    }, 180);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [q, open]);

  const terms = useMemo(() => q.trim().toLowerCase().split(/\s+/).filter(Boolean), [q]);

  const groups = useMemo(() => {
    const allow = chip === "all" ? null : [chip];
    let items;
    if (!terms.length) items = [];
    else {
      const stat = searchStatic(q, allow);
      const t0 = terms[0];
      const dbi = remote.filter((r) => !allow || allow.includes(r.type)).map((r) => { const ti = r.title.toLowerCase(); return { ...r, score: ti.startsWith(t0) || ti.includes("#" + t0.replace("#", "")) ? 110 : ti.includes(t0) ? 75 : 50 }; });
      // a customised text found by value replaces the same text found by label
      const seen = new Set(dbi.filter((r) => r.id.startsWith("textval:")).map((r) => r.id.slice(8)));
      items = [...stat.filter((s) => !(s.type === "text" && seen.has(s.id.slice(5)))), ...dbi];
    }
    // the group holding the best match comes first (an exact setting beats a loosely related page)
    return ORDER.map((type) => { const list = items.filter((i) => i.type === type).sort((a, b) => (b.score || 0) - (a.score || 0)); return { type, items: list.slice(0, PER_GROUP), top: list[0]?.score || 0 }; })
      .filter((g) => g.items.length)
      .sort((a, b) => b.top - a.top);
  }, [q, terms, remote, chip]);

  const flat = useMemo(() => {
    if (terms.length) return groups.flatMap((g) => g.items);
    return [...recent.map((r) => ({ ...r, recent: true })), ...SUGGESTED.filter((s) => !recent.some((r) => r.id === s.id))];
  }, [groups, terms, recent]);

  useEffect(() => setCursor(0), [q, chip]);
  useEffect(() => { listRef.current?.querySelector(`[data-i="${cursor}"]`)?.scrollIntoView({ block: "nearest" }); }, [cursor]);

  function choose(item) {
    if (!item) return;
    const list = [item, ...readRecent().filter((r) => r.id !== item.id)].map(({ id, type, title, sub, href, external, kind }) => ({ id, type, title, sub, href, external, kind }));
    writeRecent(list);
    hide();
    if (item.href === "#logout") return onLogout?.();
    if (item.external) return window.open(item.href, "_blank", "noopener");
    navStart();
    // the pages read ?t= to know a new jump was requested, even to the same place
    const sep = item.href.includes("?") ? "&" : "?";
    router.push(/focus=|new=|edit=|preset=/.test(item.href) ? `${item.href}${sep}t=${Date.now()}` : item.href);
  }

  function onKey(e) {
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(flat.length - 1, c + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => Math.max(0, c - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); choose(flat[cursor]); }
    else if (e.key === "Escape") { e.preventDefault(); q ? setQ("") : hide(); }
    else if (e.key === "Tab") { e.preventDefault(); const i = CHIPS.findIndex((c) => c[0] === chip); setChip(CHIPS[(i + (e.shiftKey ? CHIPS.length - 1 : 1)) % CHIPS.length][0]); }
  }

  function clearRecent() { writeRecent([]); setRecent([]); }

  const Row = ({ item, i }) => {
    const I = item.href === "#logout" ? LogOut : item.external ? ExternalLink : item.recent ? History : ICON[item.type] || FileText;
    const on = i === cursor;
    return (
      <li>
        <button type="button" data-i={i} onMouseMove={() => setCursor(i)} onClick={() => choose(item)} className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${on ? "bg-brand/15" : "hover:bg-panel2/60"}`}>
          <span className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center ${COLOR[item.type] || COLOR.page}`}><I size={16} /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium truncate"><Mark text={item.title} terms={terms} /></span>
            <span className="block text-[11px] text-mist truncate"><Mark text={item.sub || ""} terms={terms} /></span>
          </span>
          {item.kind && <span className="hidden sm:inline shrink-0 rounded-full border border-line px-2 py-0.5 text-[10px] text-mist">{item.kind}</span>}
          {on && <CornerDownLeft size={14} className="shrink-0 text-mist" />}
        </button>
      </li>
    );
  };

  let idx = -1;
  return (
    <>
      <button type="button" onClick={show} aria-label="Search the admin panel" className="hidden md:flex items-center gap-2.5 w-64 lg:w-72 rounded-xl border border-line bg-panel px-3.5 py-2 text-sm text-mist hover:border-mist hover:text-fg transition-colors">
        <Search size={15} /> <span className="flex-1 text-left truncate">Search anything…</span>
        <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded-md border border-line bg-panel2 px-1.5 py-0.5 text-[10px]"><Command size={10} />K</kbd>
      </button>
      <button type="button" onClick={show} aria-label="Search the admin panel" className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg border border-line text-mist hover:text-fg"><Search size={18} /></button>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[80] flex items-start justify-center sm:pt-[9vh] bg-black/70 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && hide()}>
            <motion.div role="dialog" aria-modal="true" aria-label="Search" initial={{ y: -16, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -10, opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 32 }} className="w-full sm:max-w-2xl max-h-[100dvh] sm:max-h-[78vh] flex flex-col sm:rounded-2xl border-0 sm:border border-line bg-panel shadow-[0_30px_100px_-20px_rgba(0,0,0,0.9)] overflow-hidden">
              <div className="flex items-center gap-3 px-4 h-14 border-b border-line shrink-0">
                {busy ? <Loader2 size={18} className="animate-spin text-brand shrink-0" /> : <Search size={18} className="text-mist shrink-0" />}
                <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} placeholder="Search settings, texts, tools, orders, people, actions…" className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-mist/70 min-w-0" autoComplete="off" spellCheck={false} aria-label="Search" />
                {q && <button type="button" onClick={() => { setQ(""); inputRef.current?.focus(); }} className="text-mist hover:text-fg p-1" aria-label="Clear"><X size={16} /></button>}
                <button type="button" onClick={hide} className="sm:hidden text-sm text-mist px-1">Cancel</button>
                <kbd className="hidden sm:block rounded-md border border-line bg-panel2 px-1.5 py-0.5 text-[10px] text-mist">Esc</kbd>
              </div>

              <div className="flex gap-1.5 overflow-x-auto no-scrollbar px-3 py-2 border-b border-line shrink-0" role="tablist" aria-label="Filter results">
                {CHIPS.map(([k, l]) => (
                  <button key={k} type="button" role="tab" aria-selected={chip === k} onClick={() => { setChip(k); inputRef.current?.focus(); }} className={`shrink-0 rounded-full px-3 py-1 text-xs border transition-colors ${chip === k ? "bg-brand border-brand text-white" : "border-line text-mist hover:text-fg"}`}>{l}</button>
                ))}
              </div>

              <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto p-2">
                {!terms.length ? (
                  <>
                    {recent.length > 0 && (
                      <div className="mb-2">
                        <div className="flex items-center justify-between px-3 pt-2 pb-1"><p className="text-[10px] uppercase tracking-wider text-mist flex items-center gap-1.5"><Clock size={11} /> Recent</p><button type="button" onClick={clearRecent} className="text-[11px] text-mist hover:text-fg">Clear</button></div>
                        <ul>{recent.map((r) => { idx++; return <Row key={"r" + r.id} item={{ ...r, recent: true }} i={idx} />; })}</ul>
                      </div>
                    )}
                    <p className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-mist">Suggested</p>
                    <ul>{SUGGESTED.filter((s) => !recent.some((r) => r.id === s.id)).map((s) => { idx++; return <Row key={s.id} item={s} i={idx} />; })}</ul>
                    <p className="px-3 py-3 text-[11px] text-mist leading-relaxed">Try: <b className="text-fg/80">whatsapp</b>, <b className="text-fg/80">pixel</b>, <b className="text-fg/80">coupon</b>, <b className="text-fg/80">#25</b> (order number), a customer’s email, a tool name or any text you see on the website.</p>
                  </>
                ) : groups.length === 0 ? (
                  <div className="py-14 text-center">
                    {busy ? <Loader2 size={24} className="mx-auto animate-spin text-mist" /> : <><SearchX size={28} className="mx-auto text-mist" /><p className="mt-3 text-sm">Nothing found for “{q}”</p><p className="text-xs text-mist mt-1">Try fewer words{chip !== "all" ? ", or switch the filter to All" : ""}. Website texts are found by their label or your saved wording.</p></>}
                  </div>
                ) : (
                  groups.map((g) => (
                    <div key={g.type} className="mb-1">
                      <p className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-mist">{TYPES[g.type]}</p>
                      <ul>{g.items.map((it) => { idx++; return <Row key={it.id} item={it} i={idx} />; })}</ul>
                    </div>
                  ))
                )}
              </div>

              <div className="hidden sm:flex items-center gap-4 px-4 py-2.5 border-t border-line text-[11px] text-mist shrink-0">
                <span className="flex items-center gap-1"><ArrowUp size={12} /><ArrowDown size={12} /> move</span>
                <span className="flex items-center gap-1"><CornerDownLeft size={12} /> open</span>
                <span>Tab: next filter</span>
                <span className="flex-1" />
                <span>{terms.length ? `${flat.length} result${flat.length === 1 ? "" : "s"}` : "Ctrl K to open anywhere"}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
