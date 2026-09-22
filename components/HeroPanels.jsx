"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X, Search, Check, ShoppingCart, Zap, ChevronDown, ShoppingBag } from "lucide-react";
import { useCart, useCheckout } from "./CheckoutProvider";
import { ToolCover } from "./ToolsGrid";
import Icon from "./IconMap";
import { openSoon } from "@/lib/soon";

// Opened by the two hero buttons via window event "htp-panel" ("tools" | "bundles").
export default function HeroPanels({ s, tools = [], categories = [], bundles = [], plans = [] }) {
  const [panel, setPanel] = useState(null);
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const on = (e) => setPanel(e.detail);
    window.addEventListener("htp-panel", on);
    const mq = window.matchMedia("(min-width: 640px)");
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => {
      window.removeEventListener("htp-panel", on);
      mq.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    if (!panel) return;
    const k = (e) => e.key === "Escape" && setPanel(null);
    document.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", k);
      document.body.style.overflow = "";
    };
  }, [panel]);

  const from = wide ? { x: "100%", y: 0 } : { x: 0, y: "100%" };

  return (
    <AnimatePresence>
      {panel && (
        <motion.div className="fixed inset-0 z-[75]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button aria-label="Close" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setPanel(null)} />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={panel === "tools" ? s.hpToolsTitle : s.hpBundlesTitle}
            initial={from}
            animate={{ x: 0, y: 0 }}
            exit={from}
            transition={{ type: "spring", stiffness: 300, damping: 34 }}
            className="absolute bottom-0 inset-x-0 max-h-[90dvh] rounded-t-3xl sm:inset-x-auto sm:right-0 sm:top-0 sm:max-h-none sm:h-full sm:w-[480px] sm:rounded-none sm:rounded-l-3xl bg-panel border-t sm:border-t-0 sm:border-l border-line flex flex-col shadow-[0_0_80px_-10px_rgba(232,53,43,0.35)]"
          >
            <div className="sm:hidden mx-auto mt-2.5 h-1 w-10 rounded-full bg-line" />
            {panel === "tools" ? <ToolsPanel s={s} tools={tools} categories={categories} close={() => setPanel(null)} /> : <BundlesPanel s={s} bundles={bundles} plans={plans} close={() => setPanel(null)} />}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Head({ title, sub, close }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 pt-4 sm:pt-6 pb-3">
      <div>
        <h2 className="font-display font-bold text-xl">{title}</h2>
        <p className="text-xs text-mist mt-1">{sub}</p>
      </div>
      <button onClick={close} aria-label="Close" className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center text-mist hover:text-fg hover:bg-fg/10"><X size={20} /></button>
    </div>
  );
}

function CartBar({ close, s }) {
  const cart = useCart();
  const total = cart.items.reduce((n, x) => n + x.price, 0);
  return (
    <div className="border-t border-line bg-ink/60 px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <AnimatePresence initial={false}>
        {cart.items.length > 0 ? (
          <motion.button
            key="go"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => { close(); cart.checkout(); }}
            className="btn-primary w-full justify-center py-3"
          >
            <ShoppingBag size={16} /> {s.hpCheckout} · {cart.items.length} item{cart.items.length > 1 ? "s" : ""} · ৳{total.toLocaleString()}
          </motion.button>
        ) : (
          <p key="empty" className="text-center text-xs text-mist py-2">{s.hpEmptyCart}</p>
        )}
      </AnimatePresence>
    </div>
  );
}

function AddBtn({ item, s }) {
  const cart = useCart();
  const has = cart.items.some((x) => x.type === item.type && x.id === item.id);
  return (
    <button
      onClick={() => (has ? cart.remove(item.type, item.id) : cart.add(item))}
      className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold border transition-colors ${has ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300" : "border-line hover:border-brand hover:text-brand"}`}
    >
      {has ? <Check size={13} /> : <ShoppingCart size={13} />} {has ? s.hpAdded : s.hpAdd}
    </button>
  );
}

function ToolsPanel({ s, tools, categories, close }) {
  const buy = useCheckout();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return tools.filter((t) => (!cat || t.category === cat) && (!s || t.name.toLowerCase().includes(s)));
  }, [tools, q, cat]);

  return (
    <>
      <Head title={s.hpToolsTitle} sub={s.hpToolsSub.split("{count}").join(tools.length)} close={close} />
      <div className="px-5 space-y-3">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mist" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={s.hpSearch} className="input !pl-10" />
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1 -mx-5 px-5">
          {["", ...categories].map((c) => (
            <button key={c || "all"} onClick={() => setCat(c)} className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs border transition-colors ${cat === c ? "bg-brand border-brand text-white" : "border-line text-mist hover:text-fg"}`}>
              {c || s.hpAll}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2.5">
        {list.length === 0 && <p className="text-center text-sm text-mist py-10">{s.hpNoResults}</p>}
        {list.map((t, i) => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.03 }} className="flex items-center gap-3 rounded-xl border border-line bg-panel2/40 p-2.5 hover:border-brand/40 transition-colors">
            <Link href={`/tool/${t.slug}`} onClick={close} className="w-16 h-12 rounded-lg overflow-hidden shrink-0"><ToolCover tool={t} small /></Link>
            <div className="min-w-0 flex-1">
              <Link href={`/tool/${t.slug}`} onClick={close} className="block font-semibold text-sm truncate hover:text-brand">{t.name}</Link>
              <p className="text-brand font-bold text-sm">৳{t.price.toLocaleString()} <span className="text-mist text-[11px] font-normal">/{t.duration}</span></p>
            </div>
            {t.soon ? <button onClick={() => { close(); setTimeout(() => openSoon(t.name), 250); }} className="shrink-0 rounded-lg border border-amber-500/50 bg-amber-500/15 px-3 py-2 text-xs font-semibold text-amber-300">{s.soonBtn}</button> : <><AddBtn s={s} item={{ type: "tool", id: t.id, name: t.name, price: t.price, per: `/${t.duration}`, image: t.image || null, accent: t.accent || null }} />
            <button onClick={() => { close(); buy({ type: "tool", id: t.id, name: t.name, price: t.price, per: `/${t.duration}`, image: t.image || null, accent: t.accent || null }); }} aria-label={`Buy ${t.name} now`} className="shrink-0 w-9 h-9 rounded-lg bg-brand hover:bg-brand-dark flex items-center justify-center"><Zap size={15} /></button></>}
          </motion.div>
        ))}
      </div>
      <div className="px-5 pb-2 text-center"><Link href="/tools" onClick={close} className="text-xs text-brand hover:underline">{s.hpFullPage}</Link></div>
      <CartBar s={s} close={close} />
    </>
  );
}

function BundlesPanel({ s, bundles, plans, close }) {
  const buy = useCheckout();
  const [tab, setTab] = useState(bundles.length ? "bundles" : "plans");
  const [openId, setOpenId] = useState(null);
  const rows = tab === "bundles" ? bundles.map((b) => ({ ...b, type: "bundle", sub: b.tagline })) : plans.map((p) => ({ ...p, type: "plan", sub: p.tagline }));

  return (
    <>
      <Head title={s.hpBundlesTitle} sub={s.hpBundlesSub} close={close} />
      <div className="px-5">
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-ink p-1 border border-line">
          {[["bundles", s.hpTabFixed], ["plans", s.hpTabCustom]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`relative rounded-lg py-2 text-sm font-medium transition-colors ${tab === k ? "text-white" : "text-mist hover:text-fg"}`}>
              {tab === k && <motion.span layoutId="hp-tab" className="absolute inset-0 rounded-lg bg-brand" />}
              <span className="relative">{l}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
        {rows.map((r, i) => {
          const list = r.type === "bundle" ? String(r.tools).split("\n").filter(Boolean) : [r.feature];
          const open = openId === r.id;
          const item = { type: r.type, id: r.id, name: r.name, price: r.price, per: "/month" };
          return (
            <motion.div key={r.type + r.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }} className={`rounded-2xl border p-4 ${r.popular ? "border-brand bg-gradient-to-b from-brand/10 to-transparent" : "border-line bg-panel2/40"}`}>
              <div className="flex items-start gap-3">
                <span className="w-10 h-10 rounded-full bg-brand/15 text-brand flex items-center justify-center shrink-0"><Icon name={r.icon} size={17} /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold truncate">{r.name}</h3>
                    {r.popular && <span className="text-[10px] font-semibold bg-brand px-2 py-0.5 rounded-full shrink-0">{s.hpPopular}</span>}
                  </div>
                  <p className="text-xs text-mist">{r.sub}</p>
                </div>
                <p className="font-display font-bold text-brand shrink-0">৳{r.price.toLocaleString()}<span className="text-mist text-[10px] font-normal">/mo</span></p>
              </div>
              <button onClick={() => setOpenId(open ? null : r.id)} className="mt-3 flex items-center gap-1 text-xs text-brand">
                {r.type === "bundle" ? s.hpIncluded.split("{count}").join(list.length) : s.hpWhatYouGet} <ChevronDown size={13} className={`transition-transform ${open ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-mist">
                    {list.map((t) => <li key={t} className="flex items-center gap-1.5"><Check size={11} className="text-brand shrink-0" /><span className="truncate">{t}</span></li>)}
                  </motion.ul>
                )}
              </AnimatePresence>
              <div className="mt-3 flex gap-2">
                {r.soon ? (
                  <button onClick={() => { close(); setTimeout(() => openSoon(r.name), 250); }} className="flex-1 rounded-lg border border-amber-500/50 bg-amber-500/15 py-2 text-xs font-semibold text-amber-300">{s.soonBtn}</button>
                ) : (
                  <>
                    <AddBtn s={s} item={item} />
                    <button onClick={() => { close(); buy(item); }} className="btn-primary flex-1 justify-center !py-2 text-xs"><Zap size={13} /> {s.hpBuyBtn}</button>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
        {rows.length === 0 && <p className="text-center text-sm text-mist py-10">Nothing available right now.</p>}
      </div>
      <CartBar s={s} close={close} />
    </>
  );
}
