"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Loader2, Check, Search, Store, Globe, CreditCard, MessageCircle, Users, ShieldCheck, X, Eye, EyeOff, RotateCcw,
  Plus, Trash2, ChevronUp, ChevronDown, Download, Upload, Sparkles, AlertCircle, Undo2, BadgeCheck,
} from "lucide-react";
import { ImageInput } from "./ResourceManager";
import PasswordForm from "./PasswordForm";
import BrandLogo from "../BrandLogo";
import { SETTINGS_TABS } from "@/lib/settingsSchema";

/* ------------------------------------------------------------------ schema */
// A block is either a group of plain fields or a custom editor. Every key listed here is saved through /api/admin/settings.
const TAB_ICONS = { general: Store, seo: Globe, payments: CreditCard, channels: MessageCircle, affiliate: Users, trust: BadgeCheck, security: ShieldCheck };
const TABS = SETTINGS_TABS.map((t) => ({ ...t, icon: TAB_ICONS[t.id] }));

const fieldsOf = (b) => (b.fields || []).flatMap((f) => [f.key, f.toggle].filter(Boolean)).concat(b.master ? [b.master] : [], b.keys || []);
const tabKeys = (t) => t.blocks.flatMap(fieldsOf);
const ALL_KEYS = TABS.flatMap(tabKeys);
const NL = String.fromCharCode(10);

/* --------------------------------------------------------------- small UI */
function Switch({ on, onChange, label, text = true }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`shrink-0 flex items-center gap-2 text-[11px] ${on ? "text-emerald-400" : "text-mist"}`}>
      {text && (on ? "Active" : "Inactive")}
      <span className={`relative w-9 h-5 rounded-full transition-colors ${on ? "bg-emerald-500" : "bg-panel2 border border-line"}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

function Counter({ n, max }) {
  const c = n === 0 ? "text-mist" : n > max ? "text-red-400" : n > max * 0.9 ? "text-amber-400" : "text-emerald-400";
  return <span className={`text-[11px] tabular-nums ${c}`}>{n}/{max}</span>;
}

function Card({ title, hint, master, on, onMaster, children, id }) {
  return (
    <section id={id} className="rounded-2xl border border-line bg-panel p-5 sm:p-6">
      {(title || master) && (
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display font-semibold">{title}</h2>
          {master && <Switch on={on} onChange={onMaster} label={`Turn ${title} on or off`} />}
        </div>
      )}
      {hint && <p className="text-xs text-mist mt-1 leading-relaxed">{hint}</p>}
      <div className={`mt-5 ${master && !on ? "opacity-50" : ""}`}>{children}</div>
    </section>
  );
}

function Field({ f, v, set, defaults, dirty }) {
  const val = v[f.key] ?? "";
  const [show, setShow] = useState(false);
  const canReset = defaults[f.key] !== undefined && defaults[f.key] !== "" && val !== defaults[f.key];
  const off = f.toggle && v[f.toggle] === "false";
  const status = f.toggle ? (off ? ["Hidden", "text-mist"] : val ? ["Live", "text-emerald-400"] : ["Add a value", "text-amber-400"]) : null;

  const input =
    f.type === "textarea" ? <textarea rows={3} className="input" value={val} placeholder={f.placeholder} onChange={(e) => set(f.key, e.target.value)} />
    : f.type === "image" ? <ImageInput value={val} onChange={(x) => set(f.key, x)} />
    : f.type === "select" ? (
      <select className="input" value={val} onChange={(e) => set(f.key, e.target.value)}>{f.options.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
    )
    : f.type === "secret" ? (
      <div className="relative">
        <input type={show ? "text" : "password"} autoComplete="off" className="input pr-10" value={val} placeholder={f.placeholder} onChange={(e) => set(f.key, e.target.value)} />
        <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide" : "Show"} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-mist hover:text-fg">{show ? <EyeOff size={15} /> : <Eye size={15} />}</button>
      </div>
    )
    : <input type={f.type === "number" ? "number" : "text"} min={f.type === "number" ? 0 : undefined} className={`input ${off ? "opacity-50" : ""}`} value={val} placeholder={f.placeholder} onChange={(e) => set(f.key, e.target.value)} />;

  return (
    <div id={`f-${f.key}`} className={f.type === "textarea" || f.type === "image" ? "sm:col-span-2" : ""}>
      <div className="flex items-center justify-between gap-3 mb-1.5 min-h-[20px]">
        <label className="flex items-center gap-2 text-xs text-mist">
          {/* x/tiktok/threads draw white with no badge behind them here, so force mono (inherits this label's own colour) - otherwise they'd vanish in light theme. */}
          {f.icon && <BrandLogo name={f.icon} size={15} mono={["x", "tiktok", "threads"].includes(f.icon)} />}
          <span>{f.label}</span>
          {dirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Unsaved change" />}
        </label>
        <span className="flex items-center gap-3">
          {f.max && <Counter n={String(val).length} max={f.max} />}
          {status && <span className={`text-[11px] ${status[1]}`}>{status[0]}</span>}
          {canReset && (
            <button type="button" onClick={() => set(f.key, defaults[f.key])} className="flex items-center gap-1 text-[11px] text-mist hover:text-fg" title="Restore the default value"><RotateCcw size={11} /> Default</button>
          )}
          {f.toggle && <Switch on={v[f.toggle] !== "false"} onChange={(x) => set(f.toggle, x ? "true" : "false")} label={`Show ${f.label}`} text={false} />}
        </span>
      </div>
      {input}
      {f.hintText && <p className="text-[11px] text-mist mt-1">{f.hintText}</p>}
    </div>
  );
}

/* ------------------------------------------------------ custom: payments */
const clean = (s) => String(s || "").replace(/[|\r\n]+/g, " ").trim();
let rid = 0;
function parsePayments(options, logosJson) {
  let logos = {};
  try { logos = JSON.parse(logosJson || "{}") || {}; } catch {}
  return String(options || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => {
    const [name = "", desc = "", ...rest] = l.split("|");
    return { id: ++rid, name: name.trim(), desc: desc.trim(), ins: rest.join("|").trim(), logo: logos[name.trim()] || "" };
  });
}

function PaymentsEditor({ v, set }) {
  const [rows, setRows] = useState(() => parsePayments(v.paymentOptions, v.paymentLogos));
  const push = (next) => {
    setRows(next);
    const named = next.filter((r) => clean(r.name));
    set("paymentOptions", named.map((r) => [clean(r.name), clean(r.desc), clean(r.ins)].join("|")).join(NL));
    const logos = {};
    for (const r of named) if (r.logo) logos[clean(r.name)] = r.logo;
    set("paymentLogos", JSON.stringify(logos));
  };
  const upd = (id, patch) => push(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const move = (i, d) => { const n = [...rows]; const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; push(n); };

  return (
    <Card title="Payment methods" hint="Each method shows in checkout and in the footer 'Pay with' strip. Add a logo so customers recognise it; without a logo the name is shown.">
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {rows.map((r, i) => (
            <motion.div key={r.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="rounded-xl border border-line bg-panel2/30 p-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 min-w-[60px] items-center justify-center rounded-md bg-white px-2.5 text-[11px] font-bold text-[#1c1c28]">
                  {r.logo ? <img src={r.logo} alt="" className="h-6 w-auto max-w-[84px] object-contain" /> : clean(r.name) || "Logo"}
                </span>
                <input className="input flex-1 font-medium" placeholder="Method name, e.g. bKash" value={r.name} onChange={(e) => upd(r.id, { name: e.target.value })} />
                <span className="flex items-center shrink-0">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className="p-2 text-mist hover:text-fg disabled:opacity-30"><ChevronUp size={16} /></button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label="Move down" className="p-2 text-mist hover:text-fg disabled:opacity-30"><ChevronDown size={16} /></button>
                  <button type="button" onClick={() => push(rows.filter((x) => x.id !== r.id))} aria-label="Delete method" className="p-2 text-mist hover:text-red-400"><Trash2 size={16} /></button>
                </span>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 mt-3">
                <input className="input sm:col-span-2" placeholder="Short description (optional)" value={r.desc} onChange={(e) => upd(r.id, { desc: e.target.value })} />
                <div className="sm:col-span-2"><textarea rows={2} className="input" placeholder="Instructions shown when the customer picks this method (number, account, steps)" value={r.ins} onChange={(e) => upd(r.id, { ins: e.target.value })} /></div>
                <div className="sm:col-span-2"><ImageInput value={r.logo} onChange={(u) => upd(r.id, { logo: u })} /></div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {rows.length === 0 && <p className="text-sm text-amber-300 flex items-center gap-2"><AlertCircle size={15} /> No payment methods yet: customers cannot check out.</p>}
        <button type="button" onClick={() => push([...rows, { id: ++rid, name: "", desc: "", ins: "", logo: "" }])} className="btn-ghost"><Plus size={15} /> Add payment method</button>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------- custom: coupons */
function parseCoupons(text) {
  return String(text || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => {
    const [code = "", val = "", ...note] = l.split("|");
    const t = val.trim();
    return { id: ++rid, code: code.trim(), pct: t.endsWith("%"), value: parseFloat(t) || "", note: note.join("|").trim() };
  });
}

function CouponsEditor({ v, set }) {
  const [rows, setRows] = useState(() => parseCoupons(v.coupons));
  const push = (next) => {
    setRows(next);
    set("coupons", next.filter((r) => clean(r.code) && Number(r.value) > 0).map((r) => `${clean(r.code).toUpperCase()} | ${Number(r.value)}${r.pct ? "%" : ""}${clean(r.note) ? " | " + clean(r.note) : ""}`).join(NL));
  };
  const upd = (id, patch) => push(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return (
    <Card title="Coupons" hint="Customers enter the code at checkout. A row needs a code and a value above 0 to be active.">
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1.2fr_1.2fr_1.6fr_auto] gap-2 items-center rounded-xl border border-line bg-panel2/30 p-3">
            <input className="input font-mono uppercase" placeholder="CODE" value={r.code} onChange={(e) => upd(r.id, { code: e.target.value })} />
            <div className="flex gap-2 col-span-2 sm:col-span-1 order-3 sm:order-none">
              <input type="number" min={0} className="input" placeholder="Value" value={r.value} onChange={(e) => upd(r.id, { value: e.target.value })} />
              <div className="flex rounded-lg border border-line overflow-hidden shrink-0">
                {[["%", true], ["৳", false]].map(([l, p]) => (
                  <button key={l} type="button" onClick={() => upd(r.id, { pct: p })} className={`px-3 text-sm ${r.pct === p ? "bg-brand text-white" : "text-mist hover:text-fg"}`}>{l}</button>
                ))}
              </div>
            </div>
            <input className="input col-span-2 sm:col-span-1 order-4 sm:order-none" placeholder="Note (optional)" value={r.note} onChange={(e) => upd(r.id, { note: e.target.value })} />
            <button type="button" onClick={() => push(rows.filter((x) => x.id !== r.id))} aria-label="Delete coupon" className="p-2 text-mist hover:text-red-400"><Trash2 size={16} /></button>
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-mist">No coupons yet.</p>}
        <button type="button" onClick={() => push([...rows, { id: ++rid, code: "", pct: true, value: "", note: "" }])} className="btn-ghost"><Plus size={15} /> Add coupon</button>
      </div>
    </Card>
  );
}

/* ---------------------------------------------------------- SEO preview */
function SeoPreview({ v }) {
  const host = String(v.siteUrl || "").replace(/^https?:\/\//, "").replace(/\/$/, "") || "yourdomain.com";
  const clip = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
  return (
    <div className="mt-5 rounded-xl border border-line bg-white p-4">
      <p className="text-[11px] text-emerald-800 mb-1 flex items-center gap-1"><Sparkles size={11} /> Google preview</p>
      <p className="text-xs text-[#202124]">{host}</p>
      <p className="text-[19px] leading-snug text-[#1a0dab] mt-0.5">{clip(v.seoTitle || v.siteName || "Page title", 60)}</p>
      <p className="text-[13px] text-[#4d5156] mt-1 leading-snug">{clip(v.seoDescription || "Your description appears here.", 155)}</p>
    </div>
  );
}

/* ------------------------------------------------------ setup checklist */
function Checklist({ v, go }) {
  const items = [
    ["Logo uploaded", !!v.logo, "general"],
    ["Favicon uploaded", !!v.favicon, "general"],
    ["Live website address set", /^https:\/\/[^/]+\.[a-z]{2,}/i.test(v.siteUrl || "") && !/localhost/.test(v.siteUrl), "seo"],
    ["Google Analytics connected", /^G-/i.test(v.gaId || ""), "seo"],
    ["Facebook Pixel connected", !!v.fbPixelId, "seo"],
    ["Real payment numbers added", !!v.paymentOptions && !/X{4}/.test(v.paymentOptions), "payments"],
    ["WhatsApp or Telegram added", !!(v.whatsapp || v.telegram), "channels"],
    ["Real phone number added", !!v.phone && !/X{4}/.test(v.phone), "general"],
  ];
  const done = items.filter((i) => i[1]).length;
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-line bg-panel p-4">
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-3 text-left">
        <span className="relative w-10 h-10 shrink-0">
          <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90"><circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-line" /><motion.circle cx="18" cy="18" r="15" fill="none" stroke="#E8352B" strokeWidth="3" strokeLinecap="round" strokeDasharray={94.2} initial={{ strokeDashoffset: 94.2 }} animate={{ strokeDashoffset: 94.2 - (94.2 * done) / items.length }} transition={{ duration: 0.8 }} /></svg>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">{done}/{items.length}</span>
        </span>
        <span className="flex-1 min-w-0"><span className="block text-sm font-semibold">Setup progress</span><span className="block text-xs text-mist">{done === items.length ? "Everything is set up. Great!" : `${items.length - done} step${items.length - done > 1 ? "s" : ""} left before you launch`}</span></span>
        <ChevronDown size={16} className={`text-mist transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden grid sm:grid-cols-2 gap-x-6 gap-y-1 mt-3">
            {items.map(([l, ok, tab]) => (
              <li key={l}><button type="button" onClick={() => go(tab)} className="w-full flex items-center gap-2.5 py-1.5 text-sm text-left hover:text-fg">
                <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${ok ? "bg-emerald-500 text-white" : "border border-line"}`}>{ok && <Check size={10} />}</span>
                <span className={ok ? "text-mist line-through" : ""}>{l}</span>
              </button></li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------- main form */
export default function SettingsForm({ initial, defaults = {}, initialTab = "", focus = "", nonce = "" }) {
  const [saved, setSaved] = useState(initial);
  const [v, setV] = useState(initial);
  const [rev, setRev] = useState(0); // bumps to remount the list editors after discard/import
  const [tab, setTab] = useState(TABS.some((x) => x.id === initialTab) ? initialTab : "general");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (initialTab && TABS.some((x) => x.id === initialTab)) { setTab(initialTab); setQ(""); }
  }, [initialTab, nonce]);

  useEffect(() => {
    if (!focus) return;
    const go = setTimeout(() => {
      const el = document.getElementById("f-" + focus);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("flash-target");
      setTimeout(() => el.classList.remove("flash-target"), 2600);
      el.querySelector("input,textarea,select")?.focus({ preventScroll: true });
    }, 450);
    return () => clearTimeout(go);
  }, [focus, nonce]);

  const set = (k, x) => setV((p) => ({ ...p, [k]: x }));
  const dirtyKeys = useMemo(() => ALL_KEYS.filter((k) => (v[k] ?? "") !== (saved[k] ?? "")), [v, saved]);
  const dirtySet = new Set(dirtyKeys);
  const flash = (ok, text) => { setToast({ ok, text }); setTimeout(() => setToast(null), 2800); };

  async function save() {
    if (!dirtyKeys.length || busy) return;
    setBusy(true);
    const body = Object.fromEntries(dirtyKeys.map((k) => [k, v[k] ?? ""]));
    const r = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    if (r.ok) { setSaved((s) => ({ ...s, ...body })); flash(true, "Settings saved"); } else flash(false, "Could not save");
  }
  const saveRef = useRef(save); saveRef.current = save;

  function discard() { setV(saved); setRev((n) => n + 1); }

  useEffect(() => {
    const key = (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); saveRef.current(); } };
    const leave = (e) => { if (dirtyKeys.length) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("keydown", key);
    window.addEventListener("beforeunload", leave);
    return () => { window.removeEventListener("keydown", key); window.removeEventListener("beforeunload", leave); };
  }, [dirtyKeys.length]);

  function exportJson() {
    const out = Object.fromEntries(ALL_KEYS.map((k) => [k, v[k] ?? ""]));
    const url = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url; a.download = `htp-settings-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url);
  }
  async function importJson(file) {
    if (!file) return;
    try {
      const j = JSON.parse(await file.text());
      const next = { ...v }; let n = 0;
      for (const k of ALL_KEYS) if (k in j && String(j[k]) !== (v[k] ?? "")) { next[k] = String(j[k]); n++; }
      setV(next); setRev((r) => r + 1);
      flash(true, n ? `${n} setting${n > 1 ? "s" : ""} loaded. Press Save to apply.` : "Nothing to change in that file");
    } catch { flash(false, "That is not a valid settings file"); }
    if (fileRef.current) fileRef.current.value = "";
  }

  const term = q.trim().toLowerCase();
  const matches = (f) => `${f.label} ${f.key} ${f.hintText || ""}`.toLowerCase().includes(term);
  const results = term ? TABS.flatMap((t) => t.blocks.flatMap((b) => (b.fields || []).filter(matches).map((f) => ({ t, b, f })))) : [];
  const customHits = term ? TABS.flatMap((t) => t.blocks.filter((b) => b.custom && `${b.custom} ${t.label} payment coupon logo password`.includes(term)).map((b) => t)) : [];

  const cur = TABS.find((t) => t.id === tab);
  const master = (b) => ({ on: v[b.master] === "true", onMaster: (x) => set(b.master, x ? "true" : "false") });

  function renderBlock(b, i) {
    if (b.custom === "payments") return <PaymentsEditor key={"p" + rev} v={v} set={set} />;
    if (b.custom === "coupons") return <CouponsEditor key={"c" + rev} v={v} set={set} />;
    if (b.custom === "security")
      return (
        <div key="sec" className="space-y-5">
          <PasswordForm />
          <Card title="Backup & restore" hint="Download every setting on this page as a file, or load one back. Loading only fills the form; nothing changes until you press Save. The file includes private keys, so keep it safe.">
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={exportJson} className="btn-ghost"><Download size={15} /> Export settings</button>
              <button type="button" onClick={() => fileRef.current?.click()} className="btn-ghost"><Upload size={15} /> Import settings</button>
              <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => importJson(e.target.files?.[0])} />
            </div>
          </Card>
        </div>
      );
    return (
      <Card key={b.title + i} title={b.title} hint={b.hint} {...(b.master ? { master: true, ...master(b) } : {})}>
        <div className="grid sm:grid-cols-2 gap-4">
          {b.fields.map((f) => <Field key={f.key} f={f} v={v} set={set} defaults={defaults} dirty={dirtySet.has(f.key) || (f.toggle && dirtySet.has(f.toggle))} />)}
        </div>
        {b.custom === "seoPreview" && <SeoPreview v={v} />}
      </Card>
    );
  }

  return (
    <div className="max-w-5xl pb-28">
      <div className="mb-5"><Checklist v={saved} go={(t) => { setQ(""); setTab(t); }} /></div>

      <div className="relative mb-5">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mist" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search settings, e.g. whatsapp, logo, pixel, coupon…" className="input pl-10 pr-10" />
        {q && <button type="button" onClick={() => setQ("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-mist hover:text-fg"><X size={16} /></button>}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[250px_minmax(0,1fr)] gap-6 items-start">
        <nav className="lg:sticky lg:top-4 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible -mx-4 px-4 lg:mx-0 lg:px-0 pb-1" aria-label="Settings sections">
          {TABS.map((t) => {
            const n = tabKeys(t).filter((k) => dirtySet.has(k)).length;
            const on = !term && tab === t.id;
            return (
              <button key={t.id} type="button" onClick={() => { setQ(""); setTab(t.id); }} className={`relative shrink-0 lg:w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm transition-colors ${on ? "bg-brand/15 text-fg border border-brand/40" : "text-mist hover:text-fg hover:bg-panel border border-transparent"}`}>
                <t.icon size={18} className={`shrink-0 ${on ? "text-brand" : ""}`} />
                <span className="min-w-0 flex-1 whitespace-nowrap lg:whitespace-normal"><span className="block font-medium leading-tight">{t.label}</span><span className="hidden lg:block text-[11px] text-mist leading-snug mt-0.5">{t.desc}</span></span>
                {n > 0 && <span className="shrink-0 ml-auto min-w-[18px] h-[18px] rounded-full bg-amber-400 text-black text-[10px] font-bold flex items-center justify-center px-1">{n}</span>}
              </button>
            );
          })}
        </nav>

        <div className="min-w-0">
          <AnimatePresence mode="wait" initial={false}>
            {term ? (
              <motion.div key="search" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <p className="text-sm text-mist">{results.length + customHits.length} result{results.length + customHits.length === 1 ? "" : "s"} for "{q}"</p>
                {results.length > 0 && (
                  <div className="rounded-2xl border border-line bg-panel p-5 sm:p-6 grid sm:grid-cols-2 gap-x-4 gap-y-5">
                    {results.map(({ t, f }) => (
                      <div key={f.key} className={f.type === "textarea" || f.type === "image" ? "sm:col-span-2" : ""}>
                        <p className="text-[10px] uppercase tracking-wider text-brand mb-1">{t.label}</p>
                        <Field f={f} v={v} set={set} defaults={defaults} dirty={dirtySet.has(f.key)} />
                      </div>
                    ))}
                  </div>
                )}
                {[...new Set(customHits)].map((t) => (
                  <button key={t.id} type="button" onClick={() => { setQ(""); setTab(t.id); }} className="w-full text-left rounded-xl border border-line bg-panel p-4 text-sm hover:border-brand/50">Open <span className="text-brand">{t.label}</span> →</button>
                ))}
                {results.length + customHits.length === 0 && <p className="text-center text-mist py-12 text-sm">Nothing matches. For page text like headings and buttons use <a href="/admin/content" className="text-brand underline">Page Content</a>.</p>}
              </motion.div>
            ) : (
              <motion.div key={cur.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="space-y-5">
                {cur.blocks.map(renderBlock)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {dirtyKeys.length > 0 && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} transition={{ type: "spring", stiffness: 320, damping: 30 }} className="fixed z-40 left-4 right-4 lg:left-auto lg:right-8 bottom-20 lg:bottom-6 lg:w-[440px] flex items-center gap-3 rounded-2xl border border-amber-400/40 bg-panel/95 backdrop-blur px-4 py-3 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <span className="text-sm flex-1 min-w-0 truncate">{dirtyKeys.length} unsaved change{dirtyKeys.length > 1 ? "s" : ""}<span className="hidden sm:inline text-mist text-xs"> · Ctrl+S</span></span>
            <button type="button" onClick={discard} className="btn-ghost !py-2 !px-3 text-xs"><Undo2 size={13} /> Discard</button>
            <button type="button" onClick={save} disabled={busy} className="btn-primary !py-2 !px-4 text-sm">{busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save</button>
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
