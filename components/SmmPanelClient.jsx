"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, Link2, Hash, Sparkles, ShieldCheck, RefreshCcw, Zap, Search, Inbox, ArrowRight, Loader2,
  Facebook, Instagram, Youtube, Twitter, Linkedin, Twitch, Music2, Send, MessageCircle, Coins, Globe,
  Share2, Star, PlayCircle, Gauge, TrendingDown, XCircle, CheckCircle2, Info, Copy, Check,
} from "lucide-react";
import { useCheckout } from "./CheckoutProvider";
import Reveal from "./Reveal";

// Category names come straight from the provider ("Instagram Followers Services", "TikTok Comments ᴺᴱᵂ",
// ...) - matched by keyword to a real brand-ish icon, colour and a grouping name, so thousands of raw
// categories collapse into a couple dozen recognisable platforms instead of one giant flat list.
const PLATFORMS = [
  { key: "instagram", name: "Instagram", test: /instagram/i, Icon: Instagram, color: "#E1306C" },
  { key: "facebook", name: "Facebook", test: /facebook|fb\b/i, Icon: Facebook, color: "#1877F2" },
  { key: "youtube", name: "YouTube", test: /youtube/i, Icon: Youtube, color: "#FF0000" },
  { key: "tiktok", name: "TikTok", test: /tiktok/i, Icon: Music2, color: "#25F4EE" },
  { key: "twitter", name: "Twitter / X", test: /twitter|\bx\b/i, Icon: Twitter, color: "#1DA1F2" },
  { key: "linkedin", name: "LinkedIn", test: /linkedin/i, Icon: Linkedin, color: "#0A66C2" },
  { key: "telegram", name: "Telegram", test: /telegram/i, Icon: Send, color: "#26A5E4" },
  { key: "whatsapp", name: "WhatsApp", test: /whatsapp/i, Icon: MessageCircle, color: "#25D366" },
  { key: "twitch", name: "Twitch", test: /twitch/i, Icon: Twitch, color: "#9146FF" },
  { key: "music", name: "Music & Audio", test: /spotify|sound\s?cloud|music/i, Icon: PlayCircle, color: "#1DB954" },
  { key: "crypto", name: "Crypto", test: /coinmarketcap|crypto|coin/i, Icon: Coins, color: "#E8B23B" },
  { key: "web", name: "Website Traffic", test: /website|traffic|seo/i, Icon: Globe, color: "#38BDF8" },
  { key: "reviews", name: "Reviews", test: /review|rating|trustpilot/i, Icon: Star, color: "#F59E0B" },
];
const OTHER_PLATFORM = { key: "other", name: "Other", Icon: Share2, color: "#8b8b9a" };
const platformFor = (category) => PLATFORMS.find((p) => p.test.test(category)) || OTHER_PLATFORM;

function PlatformAvatar({ category, size = 36 }) {
  const { Icon, color } = platformFor(category);
  return (
    <span className="rounded-xl flex items-center justify-center shrink-0" style={{ width: size, height: size, background: `${color}22`, color }}>
      <Icon size={Math.round(size * 0.46)} />
    </span>
  );
}

// The provider packs quality/speed/drop-rate hints straight into the service name, e.g.
// "TikTok Comment Likes | HQ | Instant | 10K/D | LD | NR" - split on "|" for a clean display name, then
// translate the trailing shorthand into badges a customer can actually read, instead of showing the raw
// abbreviations (or, worse, leaving them off entirely for lack of a separate "quality" field from the API).
const TAG_WORDS = { HQ: "High quality", LQ: "Low quality", REAL: "Real users", INSTANT: "Instant start", ND: "No drop", LD: "Low drop", HD: "High drop", NR: "No refill", NEW: "New" };
function parseServiceName(raw) {
  const parts = String(raw || "").split("|").map((s) => s.trim()).filter(Boolean);
  const name = parts[0] || raw || "";
  const tags = parts.slice(1).map((p) => {
    const t = p.toUpperCase().replace(/[^\w/]/g, "");
    if (TAG_WORDS[t]) return TAG_WORDS[t];
    const speed = t.match(/^(\d+[KMB]?)\/D$/);
    if (speed) return `${speed[1]}/day speed`;
    const refillDays = t.match(/^R(\d{1,3})D?$/);
    if (refillDays) return `${refillDays[1]}-day refill`;
    if (t === "R") return "Refill available";
    return p;
  });
  return { name, tags };
}

const EXAMPLE_LINK = {
  instagram: "https://instagram.com/username", facebook: "https://facebook.com/yourpage", youtube: "https://youtube.com/watch?v=...",
  tiktok: "https://tiktok.com/@username/video/...", twitter: "https://x.com/username/status/...", linkedin: "https://linkedin.com/in/username",
  telegram: "https://t.me/yourchannel", whatsapp: "https://wa.me/...", twitch: "https://twitch.tv/username",
  music: "https://open.spotify.com/track/...", crypto: "https://coinmarketcap.com/community/profile/...", web: "https://yourwebsite.com",
  reviews: "https://your-listing-url.com", other: "https://...",
};

// Round, familiar quick-pick quantities (1k, 5k, 10k, ...) rather than raw fractions of an often huge
// max (a service capped at 10,000,000 would otherwise suggest picking exactly "2,500,080").
const NICE_QUANTITIES = [100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000, 2500000, 5000000, 10000000, 25000000, 50000000];
function nicePresets(min, max) {
  const inRange = NICE_QUANTITIES.filter((n) => n >= min && n <= max);
  const picks = inRange.length >= 3 ? [inRange[0], inRange[Math.floor(inRange.length / 2)], inRange[inRange.length - 1]] : inRange.length ? inRange : [min, max];
  return [...new Set(picks)];
}

function StepLabel({ n, text }) {
  return (
    <label className="flex items-center gap-2 text-xs font-semibold text-mist uppercase tracking-wide">
      <span className="w-5 h-5 rounded-full bg-brand/15 text-brand flex items-center justify-center text-[10px] font-bold not-italic normal-case">{n}</span>
      {text}
    </label>
  );
}

function CopyExample({ text }) {
  const [done, setDone] = useState(false);
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.9 }}
      onClick={() => { navigator.clipboard?.writeText(text); setDone(true); setTimeout(() => setDone(false), 1400); }}
      className="inline-flex items-center gap-1 text-[11px] text-mist hover:text-brand shrink-0"
    >
      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <motion.span key="done" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} className="inline-flex items-center gap-1">
            <Check size={11} className="text-emerald-400" /> Copied
          </motion.span>
        ) : (
          <motion.span key="copy" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} className="inline-flex items-center gap-1">
            <Copy size={11} /> Copy
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// A real SMM-panel ordering flow (platform -> category -> service -> link -> quantity), done up in this
// site's own visual language. The price updates live and one button sends it straight to the site's
// existing checkout (same payment methods, same guest/sign-in flow as everything else) - placing the
// item in the shared basket rather than a bespoke mini-checkout means every bit of checkout polish
// (coupons, crypto rate conversion, guest signup) comes for free and never has to be re-built here.
export default function SmmPanelClient({ services }) {
  const checkout = useCheckout();

  const platforms = useMemo(() => {
    const seen = new Map();
    for (const s of services) {
      const p = platformFor(s.category);
      if (!seen.has(p.key)) seen.set(p.key, { ...p, count: 0 });
      seen.get(p.key).count++;
    }
    return [...seen.values()].sort((a, b) => b.count - a.count);
  }, [services]);

  const [platformKey, setPlatformKey] = useState(platforms[0]?.key || "");
  const categoriesInPlatform = useMemo(() => [...new Set(services.filter((s) => platformFor(s.category).key === platformKey).map((s) => s.category))], [services, platformKey]);
  const [category, setCategory] = useState(categoriesInPlatform[0] || "");
  const [serviceId, setServiceId] = useState("");
  const [query, setQuery] = useState("");
  const [link, setLink] = useState("");
  const [qty, setQty] = useState("");
  const [busy, setBusy] = useState(false);
  const [openPicker, setOpenPicker] = useState(false);

  const inCategory = useMemo(() => services.filter((s) => s.category === category), [services, category]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return inCategory;
    return inCategory.filter((s) => s.name.toLowerCase().includes(q));
  }, [inCategory, query]);

  const service = services.find((s) => s.id === serviceId) || null;
  const parsed = service ? parseServiceName(service.name) : null;
  const platform = platformFor(category);

  useEffect(() => {
    const first = services.filter((s) => platformFor(s.category).key === platformKey)[0];
    setCategory(first?.category || "");
  }, [platformKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setServiceId(inCategory[0]?.id || "");
    setQuery("");
  }, [category]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setQty(service ? String(service.min) : "");
  }, [serviceId]); // eslint-disable-line react-hooks/exhaustive-deps

  const qtyNum = parseInt(qty, 10);
  const qtyValid = service && Number.isInteger(qtyNum) && qtyNum >= service.min && qtyNum <= service.max;
  const linkValid = /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(link.trim());
  const price = service && qtyValid ? Math.max(1, Math.ceil((service.sellRate * qtyNum) / 1000)) : 0;
  const canOrder = service && qtyValid && linkValid && !busy;

  const order = () => {
    if (!canOrder) return;
    setBusy(true);
    checkout({
      type: "smm",
      id: `smm_${service.id}_${Date.now()}`,
      serviceId: service.id,
      qty: qtyNum,
      link: link.trim(),
      name: `${parsed.name} (${qtyNum.toLocaleString()})`,
      price,
      accent: "#E8352B",
    });
  };

  if (!services.length) {
    return (
      <div className="container-x max-w-3xl pb-24">
        <div className="rounded-2xl border border-line bg-panel p-10 text-center">
          <Inbox size={30} className="mx-auto text-mist mb-3" />
          <p className="font-display font-semibold">No services available yet</p>
          <p className="text-sm text-mist mt-1">Please check back shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-x max-w-6xl pb-24 space-y-5">
      {/* Platform strip */}
      <Reveal>
        <div className="rounded-2xl border border-line bg-panel p-3">
          <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
            {platforms.map((p) => {
              const active = p.key === platformKey;
              return (
                <motion.button
                  key={p.key}
                  type="button"
                  onClick={() => setPlatformKey(p.key)}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.94 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                  className={`relative shrink-0 flex flex-col items-center gap-1.5 rounded-xl px-4 py-2.5 transition-colors ${!active ? "hover:bg-panel2" : ""}`}
                >
                  {active && (
                    <motion.span
                      layoutId="smmPlatformActive"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      className="absolute inset-0 rounded-xl bg-brand/10 ring-1 ring-brand/30"
                    />
                  )}
                  <motion.span
                    className="relative w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${p.color}22`, color: p.color }}
                    animate={{ scale: active ? 1.08 : 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <p.Icon size={19} />
                  </motion.span>
                  <span className={`relative text-[11px] font-semibold whitespace-nowrap transition-colors ${active ? "text-brand" : "text-mist"}`}>{p.name}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </Reveal>

      <div className="grid lg:grid-cols-[1fr_320px] gap-5 items-start">
        {/* Order form */}
        <Reveal delay={0.05}>
          <div className="rounded-2xl border border-line bg-panel overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-brand via-brand-light to-brand" aria-hidden />
            <div className="p-5 sm:p-7 space-y-6">
              {/* Category */}
              {categoriesInPlatform.length > 1 && (
                <div>
                  <StepLabel n={1} text="Category" />
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full mt-2 rounded-xl border border-line bg-panel2 px-3.5 py-3 text-sm outline-none focus:border-brand/50 transition-colors"
                  >
                    {categoriesInPlatform.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}

              {/* Service picker */}
              <div>
                <StepLabel n={categoriesInPlatform.length > 1 ? 2 : 1} text="Choose a service" />
                <div className="relative mt-2">
                  <motion.button
                    type="button"
                    onClick={() => setOpenPicker((o) => !o)}
                    whileHover={{ scale: 1.008 }}
                    whileTap={{ scale: 0.99 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="w-full flex items-center gap-3 rounded-xl border border-line bg-panel2 px-3.5 py-3 text-left hover:border-brand/40 transition-colors"
                  >
                    {service ? (
                      <>
                        <PlatformAvatar category={service.category} size={38} />
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold text-sm truncate">{parsed.name}</span>
                          <span className="block text-xs text-mist mt-0.5">৳{service.sellRate.toLocaleString()} per 1,000 · min {service.min.toLocaleString()}, max {service.max.toLocaleString()}</span>
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-mist flex-1">Select a service…</span>
                    )}
                    <ChevronDown size={16} className={`shrink-0 text-mist transition-transform ${openPicker ? "rotate-180" : ""}`} />
                  </motion.button>

                  <AnimatePresence>
                    {openPicker && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
                        className="absolute z-20 mt-2 w-full rounded-xl border border-line bg-panel shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)] overflow-hidden"
                      >
                        <div className="p-2 border-b border-line">
                          <div className="flex items-center gap-2 rounded-lg bg-panel2 px-3 py-2">
                            <Search size={14} className="text-mist shrink-0" />
                            <input
                              autoFocus
                              value={query}
                              onChange={(e) => setQuery(e.target.value)}
                              placeholder="Search services…"
                              className="bg-transparent text-sm outline-none flex-1 min-w-0"
                            />
                          </div>
                        </div>
                        <div className="max-h-72 overflow-y-auto">
                          {filtered.length === 0 && <p className="text-sm text-mist text-center py-8">No services match.</p>}
                          {filtered.map((s) => {
                            const p = parseServiceName(s.name);
                            return (
                              <motion.button
                                key={s.id}
                                type="button"
                                onClick={() => { setServiceId(s.id); setOpenPicker(false); }}
                                whileHover={{ x: 3 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-panel2 transition-colors ${s.id === serviceId ? "bg-brand/10" : ""}`}
                              >
                                <PlatformAvatar category={s.category} size={32} />
                                <span className="min-w-0 flex-1">
                                  <span className="block text-sm font-medium truncate">{p.name}</span>
                                  <span className="block text-[11px] text-mist mt-0.5">min {s.min.toLocaleString()} · max {s.max.toLocaleString()}</span>
                                </span>
                                <span className="shrink-0 text-xs font-bold text-brand">৳{s.sellRate.toLocaleString()}/1k</span>
                              </motion.button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {parsed?.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {parsed.tags.map((t) => (
                      <span key={t} className="text-[10px] font-semibold rounded-full bg-panel2 text-mist px-2 py-1">{t}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Link */}
              <div>
                <StepLabel n={categoriesInPlatform.length > 1 ? 3 : 2} text="Paste your link" />
                <div className="relative mt-2">
                  <Link2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-mist" />
                  <input
                    id="smm-link"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder={EXAMPLE_LINK[platform.key] || EXAMPLE_LINK.other}
                    className="w-full rounded-xl border border-line bg-panel2 pl-11 pr-4 py-3.5 text-sm outline-none focus:border-brand/50 transition-colors"
                  />
                  {linkValid && <Sparkles size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400" />}
                </div>
                {link && !linkValid && <p className="text-xs text-red-400 mt-1.5">Enter a full link starting with http:// or https://</p>}
              </div>

              {/* Quantity */}
              <div>
                <StepLabel n={categoriesInPlatform.length > 1 ? 4 : 3} text="Quantity" />
                <div className="relative mt-2">
                  <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-mist" />
                  <input
                    id="smm-qty"
                    type="number"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    min={service?.min} max={service?.max}
                    className="w-full rounded-xl border border-line bg-panel2 pl-11 pr-4 py-3.5 text-sm outline-none focus:border-brand/50 transition-colors tabular-nums"
                  />
                </div>
                {service && (
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {nicePresets(service.min, service.max).map((v) => (
                      <motion.button
                        key={v} type="button" onClick={() => setQty(String(v))}
                        whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.92 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                        className={`text-[11px] rounded-full border px-2.5 py-1 transition-colors ${qtyNum === v ? "border-brand/50 text-brand bg-brand/10" : "border-line text-mist hover:text-brand hover:border-brand/40"}`}
                      >
                        {v.toLocaleString()}
                      </motion.button>
                    ))}
                    <p className={`text-xs ml-auto ${qtyValid ? "text-mist" : "text-red-400"}`}>
                      Min {service.min.toLocaleString()} · Max {service.max.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Price + submit */}
              <div className="relative overflow-hidden rounded-xl border border-brand/30 bg-gradient-to-br from-brand/10 via-panel2/60 to-panel2/60 p-4 sm:p-5 flex flex-wrap items-center gap-4">
                <div className="orb absolute -top-10 -right-10 w-40 h-40 rounded-full bg-brand/10 blur-[60px] pointer-events-none" aria-hidden />
                <div className="relative flex-1 min-w-[160px]">
                  <p className="text-xs text-mist">Total price</p>
                  <p className="font-display font-bold text-3xl tracking-tight">৳{price.toLocaleString()}</p>
                  {service && <p className="text-[11px] text-mist mt-0.5">৳{service.sellRate.toLocaleString()} / 1,000 · {qtyValid ? qtyNum.toLocaleString() : "—"} qty</p>}
                </div>
                <motion.button
                  type="button"
                  onClick={order}
                  disabled={!canOrder}
                  whileHover={canOrder ? { scale: 1.035, y: -2 } : {}}
                  whileTap={canOrder ? { scale: 0.96 } : {}}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="btn-shine relative flex items-center gap-2 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-6 py-3.5 shadow-glow transition-colors"
                >
                  {busy ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <motion.span animate={canOrder ? { rotate: [0, -12, 12, -8, 0] } : {}} transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.4, ease: "easeInOut" }}>
                      <Zap size={16} />
                    </motion.span>
                  )}
                  Order Now <ArrowRight size={15} />
                </motion.button>
              </div>

              <div className="grid sm:grid-cols-3 gap-3 pt-2">
                {[
                  { Icon: Sparkles, t: "Wholesale pricing" },
                  { Icon: RefreshCcw, t: "Automatic delivery" },
                  { Icon: ShieldCheck, t: "Order tracking in your account" },
                ].map(({ Icon, t }) => (
                  <div key={t} className="flex items-center gap-2 text-xs text-mist">
                    <span className="w-7 h-7 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0"><Icon size={13} /></span>
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        {/* Service info */}
        <Reveal delay={0.1} className="lg:sticky lg:top-24">
          <div className="rounded-2xl border border-line bg-panel overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-line bg-panel2/40">
              <Info size={14} className="text-brand" />
              <p className="text-sm font-semibold">Service info</p>
            </div>
            {!service ? (
              <p className="text-sm text-mist p-5">Choose a service to see its details here.</p>
            ) : (
              <div className="p-4 sm:p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <PlatformAvatar category={service.category} size={40} />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm leading-snug">{parsed.name}</p>
                    <p className="text-[11px] text-mist mt-0.5">{service.category}</p>
                  </div>
                </div>

                {parsed.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {parsed.tags.map((t) => <span key={t} className="text-[10px] font-semibold rounded-full bg-panel2 text-mist px-2 py-1">{t}</span>)}
                  </div>
                )}

                <div className="rounded-xl border border-line divide-y divide-line/60 text-sm">
                  <div className="flex items-center justify-between px-3.5 py-2.5">
                    <span className="text-mist flex items-center gap-1.5"><Gauge size={13} /> Quantity range</span>
                    <span className="font-medium">{service.min.toLocaleString()} – {service.max.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between px-3.5 py-2.5">
                    <span className="text-mist flex items-center gap-1.5"><TrendingDown size={13} /> Refill</span>
                    <span className={`font-medium flex items-center gap-1 ${service.refill ? "text-emerald-400" : "text-mist"}`}>
                      {service.refill ? <><CheckCircle2 size={13} /> Available</> : <><XCircle size={13} /> Not available</>}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-3.5 py-2.5">
                    <span className="text-mist flex items-center gap-1.5"><XCircle size={13} /> Cancel</span>
                    <span className={`font-medium flex items-center gap-1 ${service.cancel ? "text-emerald-400" : "text-mist"}`}>
                      {service.cancel ? <><CheckCircle2 size={13} /> Available</> : <><XCircle size={13} /> Not available</>}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-mist uppercase tracking-wide mb-1.5">Example link</p>
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-panel2/60 px-3 py-2">
                    <code className="text-[11px] text-mist truncate">{EXAMPLE_LINK[platform.key] || EXAMPLE_LINK.other}</code>
                    <CopyExample text={EXAMPLE_LINK[platform.key] || EXAMPLE_LINK.other} />
                  </div>
                </div>

                <ul className="text-[11px] text-mist space-y-1.5 leading-relaxed">
                  <li>• Speed may vary when a service is busy.</li>
                  <li>• Don't place a second order on the same link before the first completes.</li>
                  <li>• Need help? Use the chat button in the corner.</li>
                </ul>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
