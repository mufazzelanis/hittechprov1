"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Gift, X, Loader2, Check, Copy, ExternalLink, Clock, PartyPopper, Users, Lock, ArrowRight } from "lucide-react";
import Reveal from "./Reveal";
import { ToolCover } from "./ToolsGrid";
import { BRAND, BrandIcon } from "./Brand";
import { track } from "@/lib/track";
import { getVisitorId } from "@/lib/visitorId";

const isUrl = (t) => /^https?:\/\/\S+$/i.test(t.trim());
const fmtDate = (d) => new Date(d + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const VERIFY_SECONDS = 5;

// "Ends in 2d 5h" when the deadline is within a week, otherwise the date. Updates every minute.
function Ends({ date, t }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(i);
  }, []);
  const ms = new Date(date + "T23:59:59").getTime() - now;
  if (ms <= 0) return t.ended;
  if (ms > 7 * 864e5) return t.ends.replace("{date}", fmtDate(date));
  const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5), m = Math.floor((ms % 36e5) / 6e4);
  return t.endsIn.replace("{time}", d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`);
}

function Confetti() {
  const bits = Array.from({ length: 22 }, (_, i) => i);
  const colors = ["#E8352B", "#E8B23B", "#25D366", "#229ED9", "#D6249F", "#FFFFFF"];
  return (
    <div className="pointer-events-none absolute left-1/2 top-24 w-0 h-0" aria-hidden>
      {bits.map((i) => {
        const a = (i / bits.length) * Math.PI * 2 + (i % 3) * 0.3;
        const r = 110 + (i % 5) * 26;
        return (
          <motion.span
            key={i}
            className="absolute w-2 h-3 rounded-[2px]"
            style={{ background: colors[i % colors.length] }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.6 }}
            animate={{ x: Math.cos(a) * r, y: Math.sin(a) * r * 0.8 + 60, opacity: 0, rotate: 260 + i * 20, scale: 1 }}
            transition={{ duration: 1.3 + (i % 4) * 0.15, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}

export default function OffersGrid({ offers, t, user }) {
  const [sel, setSel] = useState(null);
  const [st, setSt] = useState({ busy: false, err: "", done: null });
  const [copied, setCopied] = useState(false);
  const [steps, setSteps] = useState([]); // per join: "idle" | "checking" | "done"
  const token = useRef("");

  useEffect(() => {
    if (!sel) return;
    const k = (e) => e.key === "Escape" && setSel(null);
    document.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", k);
      document.body.style.overflow = "";
    };
  }, [sel]);

  function open(o) {
    setSt({ busy: false, err: "", done: null });
    setCopied(false);
    setSteps(o.joins.map(() => "idle"));
    token.current = "";
    setSel(o);
    if (o.joins.length) fetch("/api/free-offers/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ offerId: o.id }) }).then((r) => r.json()).then((j) => (token.current = j.token || "")).catch(() => {});
  }

  function join(i) {
    const j = sel.joins[i];
    window.open(j.url, "_blank", "noopener,noreferrer");
    track("Contact", { content_name: `offer-join-${j.type}` });
    setSteps((s) => s.map((x, k) => (k === i ? "checking" : x)));
    setTimeout(() => setSteps((s) => s.map((x, k) => (k === i ? "done" : x))), VERIFY_SECONDS * 1000);
  }

  const unlocked = steps.every((x) => x === "done");
  const needsHandle = sel?.joins.some((j) => j.type === "telegram" || j.type === "whatsapp");

  async function submit(e) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget));
    setSt({ busy: true, err: "", done: null });
    const r = await fetch("/api/free-offers/claim", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, offerId: sel.id, token: token.current, visitorId: getVisitorId() }) });
    const j = await r.json().catch(() => ({}));
    if (r.ok) {
      track("Lead", { content_name: `free-offer: ${sel.name}` });
      setSt({ busy: false, err: "", done: j });
    } else setSt({ busy: false, err: j.error || "Something went wrong", done: null });
  }

  if (!offers.length) {
    return (
      <div className="text-center rounded-2xl border border-line bg-panel py-16 px-6">
        <Gift size={40} className="mx-auto text-mist mb-4" />
        <p className="text-mist">{t.empty}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {offers.map((o, i) => {
          const left = o.max > 0 ? Math.max(0, o.max - o.claims) : null;
          const soldOut = left === 0;
          const closed = o.ended || soldOut;
          const pct = o.max > 0 ? Math.min(100, Math.round((o.claims / o.max) * 100)) : 0;
          const first = o.joins[0];
          const B = first ? BRAND[first.type] : null;
          return (
            <Reveal key={o.id} delay={(i % 3) * 0.08}>
              <motion.div whileHover={{ y: closed ? 0 : -6 }} className={`group h-full rounded-2xl border bg-panel overflow-hidden flex flex-col transition-colors ${closed ? "border-line opacity-70" : "border-line hover:border-brand/60"}`}>
                <div className="relative aspect-[16/9] overflow-hidden">
                  <ToolCover tool={{ name: o.name, image: o.image, accent: o.accent }} />
                  {o.badge && <span className="absolute top-3 left-3 rounded-full bg-brand px-3 py-1 text-[11px] font-bold tracking-wide shadow-glow">{o.badge}</span>}
                  {!closed && <span className="absolute top-3 right-3 flex w-2.5 h-2.5" aria-hidden><span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75 animate-ping" /><span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-emerald-400" /></span>}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-display font-bold text-lg leading-snug">{o.name}</h3>
                  {o.desc && <p className="text-sm text-mist mt-2 leading-relaxed">{o.desc}</p>}

                  <div className="mt-4 space-y-2.5 text-xs text-mist">
                    {o.max > 0 ? (
                      <div>
                        <div className="flex justify-between mb-1.5"><span className="inline-flex items-center gap-1"><Users size={12} /> {o.claims}/{o.max}</span><span className={soldOut ? "text-red-400" : "text-brand font-semibold"}>{soldOut ? t.soldOut : t.left.replace("{left}", left)}</span></div>
                        <div className="h-1.5 rounded-full bg-panel2 overflow-hidden"><motion.div className="h-full rounded-full bg-gradient-to-r from-brand to-gold" initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }} transition={{ duration: 0.9 }} /></div>
                      </div>
                    ) : (
                      o.claims > 0 && <p className="inline-flex items-center gap-1.5"><Users size={12} /> {t.claimedCount.replace("{n}", o.claims)}</p>
                    )}
                    {o.ends && <p className={`flex items-center gap-1.5 ${o.ended ? "text-red-400" : ""}`}><Clock size={12} /> <Ends date={o.ends} t={t} /></p>}
                  </div>

                  <div className="mt-auto pt-5">
                    <button
                      disabled={closed}
                      onClick={() => open(o)}
                      className={`w-full inline-flex items-center justify-center gap-2.5 rounded-xl py-3.5 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-60 ${B ? "" : "btn-primary"}`}
                      style={B && !closed ? { background: `linear-gradient(135deg, ${B.from}, ${B.to})`, boxShadow: `0 12px 28px -14px ${B.glow}` } : B ? { background: "rgb(var(--line))" } : undefined}
                    >
                      {first ? <BrandIcon type={first.type} size={18} /> : <Gift size={16} />}
                      {o.ended ? t.ended : soldOut ? t.soldOut : o.cta || (first ? t.joinClaim : t.claim)}
                    </button>
                  </div>
                </div>
              </motion.div>
            </Reveal>
          );
        })}
      </div>

      <AnimatePresence>
        {sel && (
          <motion.div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && setSel(null)}>
            <motion.div role="dialog" aria-modal="true" aria-label={sel.name} initial={{ y: 40, scale: 0.94, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 26 }} className="relative w-full max-w-md max-h-[94dvh] overflow-y-auto overflow-x-hidden rounded-3xl border border-line bg-panel shadow-[0_30px_80px_-20px_rgba(232,53,43,0.35)]">
              <button onClick={() => setSel(null)} aria-label="Close" className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center text-mist hover:text-fg hover:bg-fg/10"><X size={18} /></button>

              {st.done ? (
                <div className="relative px-6 py-9 text-center">
                  <Confetti />
                  <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 14 }} className="mx-auto w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center"><PartyPopper size={30} /></motion.span>
                  <h3 className="font-display font-bold text-2xl mt-4">{t.successTitle}</h3>
                  <p className="text-sm text-mist mt-1">{sel.name}</p>
                  {st.done.repeat && <p className="text-[11px] text-mist mt-1">{t.alreadyClaimed}</p>}
                  {st.done.reward ? (
                    <div className="mt-5 rounded-2xl border border-brand/40 bg-brand/[0.07] p-4 text-left">
                      <p className="text-[11px] uppercase tracking-wider text-brand mb-2">{t.yourOffer}</p>
                      <p className="font-mono text-sm break-words whitespace-pre-wrap text-fg">{st.done.reward}</p>
                      <div className="flex gap-2 mt-3">
                        {isUrl(st.done.reward) && <a href={st.done.reward.trim()} target="_blank" rel="noopener noreferrer" className="btn-primary flex-1 justify-center !py-2 text-xs"><ExternalLink size={13} /> {t.open}</a>}
                        <button onClick={() => { navigator.clipboard?.writeText(st.done.reward); setCopied(true); setTimeout(() => setCopied(false), 1600); }} className="btn-ghost flex-1 justify-center !py-2 text-xs">{copied ? <Check size={13} /> : <Copy size={13} />} {copied ? t.copied : t.copy}</button>
                      </div>
                    </div>
                  ) : (
                    (() => {
                      // No code/link to show: send them to the offer's Telegram (or WhatsApp / first) channel.
                      const c = sel.joins.find((j) => j.type === "telegram") || sel.joins.find((j) => j.type === "whatsapp") || sel.joins[0];
                      if (!c) return <p className="mt-5 rounded-2xl border border-line bg-panel2/60 p-4 text-sm text-mist">{t.noRewardMail}</p>;
                      const B = BRAND[c.type];
                      return (
                        <div className="mt-5 rounded-2xl border border-line bg-panel2/60 p-4">
                          <p className="text-sm text-mist leading-relaxed">{t.noReward.replace("{channel}", B.name)}</p>
                          <a href={c.url} target="_blank" rel="noopener noreferrer" onClick={() => track("Contact", { content_name: `offer-contact-${c.type}` })} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white hover:brightness-110" style={{ background: `linear-gradient(135deg, ${B.from}, ${B.to})` }}>
                            <BrandIcon type={c.type} size={18} /> {t.contactBtn.replace("{channel}", B.name)} <ArrowRight size={14} />
                          </a>
                        </div>
                      );
                    })()
                  )}
                  <button onClick={() => setSel(null)} className="btn-ghost mt-6">{t.close}</button>
                </div>
              ) : (
                <form onSubmit={submit} className="px-6 pt-8 pb-6">
                  <span className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center shadow-glow"><Gift size={24} /></span>
                  <h3 className="font-display font-bold text-xl text-center mt-4">{t.claimTitle.replace("{name}", sel.name)}</h3>
                  <p className="text-xs text-mist text-center mt-1.5">{sel.joins.length ? t.joinNote : t.formNote}</p>

                  {sel.joins.length > 0 && (
                    <div className="mt-5 space-y-2.5">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-mist">{t.step1}</p>
                      {sel.joins.map((j, i) => {
                        const B = BRAND[j.type];
                        const state = steps[i];
                        return (
                          <div key={i} className={`flex items-center gap-3 rounded-2xl border p-3 transition-colors ${state === "done" ? "border-emerald-500/40 bg-emerald-500/[0.06]" : "border-line bg-panel2/40"}`}>
                            <span className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: `linear-gradient(135deg, ${B.from}, ${B.to})` }}><BrandIcon type={j.type} size={20} /></span>
                            <span className="min-w-0 flex-1 text-sm font-medium leading-tight">{j.label || t.joinLabels[j.type]}</span>
                            {state === "done" ? (
                              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 15 }} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400"><Check size={15} /> {t.joined}</motion.span>
                            ) : state === "checking" ? (
                              <span className="inline-flex items-center gap-2 text-xs text-mist"><span className="relative w-6 h-6"><Loader2 size={24} className="animate-spin text-brand" /></span>{t.checking}</span>
                            ) : (
                              <button type="button" onClick={() => join(i)} className="shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold text-white hover:brightness-110" style={{ background: `linear-gradient(135deg, ${B.from}, ${B.to})` }}>
                                {t.joinBtn.replace("{channel}", B.name)} <ArrowRight size={13} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="relative mt-5">
                    {sel.joins.length > 0 && <p className="text-[11px] uppercase tracking-[0.14em] text-mist mb-2.5">{t.step2}</p>}
                    <fieldset disabled={!unlocked} className={`space-y-3 transition-opacity ${unlocked ? "" : "opacity-40"}`}>
                      <input name="name" required defaultValue={user?.name || ""} placeholder={t.fName} className="input" />
                      <input name="email" type="email" required defaultValue={user?.email || ""} placeholder={t.fEmail} className="input" />
                      <input name="phone" defaultValue={user?.phone || ""} placeholder={t.fPhone} className="input" />
                      {needsHandle && <input name="handle" required placeholder={t.fHandle} className="input" />}
                    </fieldset>
                    {!unlocked && <p className="absolute inset-0 flex items-center justify-center gap-2 text-xs font-semibold text-fg/90"><Lock size={14} /> {t.locked}</p>}
                  </div>

                  {st.err && <p className="text-sm text-red-400 mt-3">{st.err}</p>}
                  <button disabled={st.busy || !unlocked} className="btn-primary w-full justify-center py-3 mt-5">{st.busy ? <Loader2 size={16} className="animate-spin" /> : <Gift size={16} />} {t.submit}</button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
