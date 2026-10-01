"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Zap, Headset, ArrowRight, Lock, ThumbsUp, Star } from "lucide-react";
import Link from "next/link";
import RichText from "./RichText";
import { ToolCover } from "./ToolsGrid";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } } };

const PERK_ICONS = [ShieldCheck, Zap, Headset];
const PERK_COLORS = [
  { text: "text-brand", bg: "bg-brand/15", ring: "ring-brand/25", pulse: "bg-brand/40" },
  { text: "text-amber-400", bg: "bg-amber-500/15", ring: "ring-amber-500/25", pulse: "bg-amber-400/40" },
  { text: "text-emerald-400", bg: "bg-emerald-500/15", ring: "ring-emerald-500/25", pulse: "bg-emerald-400/40" },
];

const parseAnnouncement = (raw) => String(raw || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

const TYPE_MS = 55;
const DELETE_MS = 28;
const PAUSE_MS = 1700;

// Types out lines[0], and - only when there's more than one line (admin added extra phrases) - pauses,
// erases it and moves on to the next, looping forever. One line just types once and sits there, exactly
// like the original single-phrase badge did.
function Typed({ lines }) {
  const [i, setI] = useState(0);
  const [n, setN] = useState(0);
  const [phase, setPhase] = useState("typing"); // typing | pausing | deleting
  const text = lines[i] || "";

  useEffect(() => {
    if (!lines.length) return undefined;
    let t;
    if (phase === "typing") {
      if (n < text.length) t = setTimeout(() => setN((x) => x + 1), TYPE_MS);
      else if (lines.length > 1) t = setTimeout(() => setPhase("pausing"), PAUSE_MS);
    } else if (phase === "pausing") {
      t = setTimeout(() => setPhase("deleting"), PAUSE_MS);
    } else if (phase === "deleting") {
      if (n > 0) t = setTimeout(() => setN((x) => x - 1), DELETE_MS);
      else { setPhase("typing"); setI((x) => (x + 1) % lines.length); }
    }
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, phase, text, lines.length]);

  return (
    <>
      {text.slice(0, n)}
      <span className="caret inline-block w-px h-3 bg-brand ml-0.5 align-middle" />
    </>
  );
}

// Routes the connecting line through each icon, then straight down into the gap BELOW
// that row's text before crossing over to the next icon - so it never crosses the text
// itself, regardless of how the body copy wraps. Positions are measured live off the DOM.
function PerkZigzagLine({ wrapRef, iconRefs, rowRefs, count }) {
  const [path, setPath] = useState("");
  const [box, setBox] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const measure = () => {
      const wrap = wrapRef.current;
      if (!wrap || iconRefs.current.some((r) => !r) || rowRefs.current.some((r) => !r)) return;
      const wrapRect = wrap.getBoundingClientRect();
      const icons = iconRefs.current.map((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2 - wrapRect.left, y: r.top + r.height / 2 - wrapRect.top };
      });
      const rows = rowRefs.current.map((el) => {
        const r = el.getBoundingClientRect();
        return { top: r.top - wrapRect.top, bottom: r.bottom - wrapRect.top };
      });
      const d = [`M ${icons[0].x.toFixed(1)} ${icons[0].y.toFixed(1)}`];
      for (let i = 0; i < icons.length - 1; i++) {
        const gapY = ((rows[i].bottom + rows[i + 1].top) / 2).toFixed(1);
        d.push(`L ${icons[i].x.toFixed(1)} ${gapY}`);
        d.push(`L ${icons[i + 1].x.toFixed(1)} ${gapY}`);
        d.push(`L ${icons[i + 1].x.toFixed(1)} ${icons[i + 1].y.toFixed(1)}`);
      }
      setBox({ w: wrapRect.width, h: wrapRect.height });
      setPath(d.join(" "));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, [wrapRef, iconRefs, rowRefs, count]);

  if (!path || !box.w) return null;
  return (
    <svg className="absolute inset-0 sm:hidden pointer-events-none" width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`}>
      <defs>
        <linearGradient id="perkZigzag" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: "rgb(var(--brand))" }} stopOpacity="0.8" />
          <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.7" />
        </linearGradient>
        <filter id="perkLineBlur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1" />
        </filter>
      </defs>
      <motion.path
        d={path}
        fill="none"
        stroke="url(#perkZigzag)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#perkLineBlur)"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease: "easeInOut", delay: 0.1 }}
      />
    </svg>
  );
}

// Rotates through a handful of real tools (whatever the admin marked "Featured" in Tools)
// instead of a generic stock illustration - shows real products, real prices.
function HeroShowcase({ tools }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (tools.length < 2) return undefined;
    const t = setInterval(() => setIdx((i) => (i + 1) % tools.length), 3200);
    return () => clearInterval(t);
  }, [tools.length]);
  const t = tools[idx];

  return (
    <div className="relative floaty rounded-3xl aspect-[4/3] border border-white/10 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={t.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <Link href={`/tool/${t.slug}`} className="block w-full h-full" aria-label={t.name}>
            <ToolCover tool={t} />
          </Link>
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent pointer-events-none" />

      <div className="absolute top-5 left-5 flex items-center gap-3">
        <span className="w-14 h-14 rounded-xl bg-[#c9d6f0] border-2 border-[#1c1c28] flex items-center justify-center"><ThumbsUp size={26} className="text-[#1c1c28]" /></span>
        <span className="px-4 h-14 rounded-xl bg-[#c9e2f5] border-2 border-[#1c1c28] flex items-center gap-1.5">
          {[0, 1, 2].map((i) => <Star key={i} size={24} className="fill-amber-400 text-[#1c1c28]" />)}
        </span>
      </div>

      {tools.length > 1 && (
        <div className="absolute top-6 right-6 flex gap-1.5">
          {tools.map((tt, i) => (
            <span key={tt.id} className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? "w-5 bg-white" : "w-1.5 bg-white/40"}`} />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={t.id + "-info"}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4 }}
          className="absolute bottom-5 right-5"
        >
          <Link href={`/tool/${t.slug}`} className="group inline-flex items-center gap-2.5 rounded-xl bg-black/55 backdrop-blur-md border border-white/15 pl-3.5 pr-3 py-2.5 hover:bg-black/65 transition-colors">
            <span className="font-display font-semibold text-white text-sm">{t.name}</span>
            <span className="text-brand font-bold text-sm">৳{t.price.toLocaleString()}</span>
            <ArrowRight size={13} className="text-white/70 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function Hero({ s, showcase = [] }) {
  const perks = PERK_ICONS.map((icon, i) => ({ icon, title: s[`perk${i + 1}Title`], body: s[`perk${i + 1}Body`], c: PERK_COLORS[i] }));
  const perkWrapRef = useRef(null);
  const perkIconRefs = useRef([]);
  const perkRowRefs = useRef([]);
  return (
    <section id="home" className="relative pt-32 pb-24 overflow-hidden bg-grain">
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ backgroundImage: "linear-gradient(rgb(var(--fg)) 1px,transparent 1px),linear-gradient(90deg,rgb(var(--fg)) 1px,transparent 1px)", backgroundSize: "56px 56px", maskImage: "radial-gradient(ellipse at 30% 30%, #000, transparent 70%)", WebkitMaskImage: "radial-gradient(ellipse at 30% 30%, #000, transparent 70%)" }} />

      <div className="orb absolute -top-20 -left-24 w-96 h-96 rounded-full bg-brand/20 blur-[100px] pointer-events-none" />
      <div className="orb absolute top-40 right-0 w-80 h-80 rounded-full bg-gold/10 blur-[100px] pointer-events-none" style={{ animationDelay: "-6s" }} />
      <motion.div
        className="absolute top-8 left-1/2 -translate-x-1/2 lg:left-[28%] w-40 h-40 lg:w-56 lg:h-56 rounded-full bg-brand/10 blur-[60px] pointer-events-none"
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="container-x grid lg:grid-cols-2 gap-14 items-center relative">
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.span variants={item} className="relative inline-flex items-center gap-2 text-xs px-3.5 py-2 rounded-full border border-brand/40 text-brand bg-brand/10 mb-7 min-h-[32px]">
            <motion.span
              className="absolute inset-0 rounded-full border border-brand/50"
              animate={{ scale: [1, 1.12, 1.12], opacity: [0.7, 0, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            />
            <Lock size={12} /> <Typed lines={parseAnnouncement(s.announcement)} />
          </motion.span>

          <motion.h1 variants={item} className="font-display text-4xl sm:text-5xl lg:text-[3.6rem] leading-[1.08] font-bold">
            {s.heroTitleA} <span className="text-shine">{s.heroHighlight}</span> {s.heroTitleB}
          </motion.h1>

          <motion.p variants={item} className="mt-6 text-mist text-lg max-w-xl leading-relaxed">{s.heroText}</motion.p>

          <motion.div variants={item} className="mt-9 flex flex-wrap gap-4">
            <span className="relative inline-block">
              <motion.a whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} href="#bundles" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent("htp-panel", { detail: "bundles" })); }} className="btn-shine group inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-brand hover:bg-brand-dark shadow-glow transition-colors font-semibold text-sm">
                {s.heroCta1} <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </motion.a>
              <motion.span
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: -8, y: [0, -3, 0] }}
                transition={{ scale: { delay: 0.9, type: "spring", bounce: 0.6 }, rotate: { delay: 0.9 }, y: { duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 1.4 } }}
                className="absolute -top-3 -right-3 bg-gold text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap pointer-events-none"
              >
                Save 95%
              </motion.span>
            </span>
            <motion.a whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} href="#tools" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent("htp-panel", { detail: "tools" })); }} className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-line hover:border-mist transition-colors font-semibold text-sm">
              {s.heroCta2} <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </motion.a>
          </motion.div>

          <motion.div ref={perkWrapRef} variants={item} className="relative mt-10 sm:mt-14 sm:grid sm:grid-cols-3 sm:gap-6">
            <PerkZigzagLine wrapRef={perkWrapRef} iconRefs={perkIconRefs} rowRefs={perkRowRefs} count={perks.length} />

            {perks.map((p, i) => {
              const flip = i % 2 === 1;
              return (
                <motion.div
                  key={p.title}
                  ref={(el) => (perkRowRefs.current[i] = el)}
                  whileHover={{ x: flip ? -3 : 3 }}
                  className={`relative z-10 flex items-start gap-3.5 sm:flex-col sm:items-center sm:text-center sm:gap-0 ${flip ? "flex-row-reverse text-right" : ""} ${i < perks.length - 1 ? "mb-5" : ""} sm:mb-0`}
                >
                  <span ref={(el) => (perkIconRefs.current[i] = el)} className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full ${p.c.bg} ${p.c.text} flex items-center justify-center shrink-0 ring-1 ${p.c.ring} sm:mb-3 overflow-visible`}>
                    <motion.span
                      className={`absolute inset-0 rounded-full ${p.c.pulse}`}
                      animate={{ scale: [1, 1.5, 1.5], opacity: [0.6, 0, 0] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut", delay: i * 0.35 }}
                    />
                    <motion.span
                      initial={{ scale: 0, rotate: -30 }}
                      whileInView={{ scale: 1, rotate: 0 }}
                      viewport={{ once: true }}
                      transition={{ type: "spring", bounce: 0.55, duration: 0.7, delay: 0.15 + i * 0.1 }}
                      className="relative flex items-center justify-center"
                    >
                      <p.icon size={15} />
                    </motion.span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm sm:text-base">{p.title}</p>
                    <p className="text-mist text-xs mt-0.5 sm:mt-1 leading-relaxed">{p.body}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="relative"
        >
          <div className="absolute -inset-6 bg-brand/20 blur-3xl rounded-full" />
          {s.heroImage ? (
            <img src={s.heroImage} alt="" className="relative rounded-3xl w-full object-cover aspect-[4/3] border border-line floaty" />
          ) : showcase.length > 0 ? (
            <HeroShowcase tools={showcase} />
          ) : (
            <div className="relative floaty rounded-3xl aspect-[4/3] bg-gradient-to-br from-[#f1d9d6] to-[#e9e2f0] border border-white/10 overflow-hidden flex items-center justify-center">
              <div className="absolute top-5 left-5 flex items-center gap-3">
                <span className="w-14 h-14 rounded-xl bg-[#c9d6f0] border-2 border-[#1c1c28] flex items-center justify-center"><ThumbsUp size={26} className="text-[#1c1c28]" /></span>
                <span className="px-4 h-14 rounded-xl bg-[#c9e2f5] border-2 border-[#1c1c28] flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => <Star key={i} size={24} className="fill-amber-400 text-[#1c1c28]" />)}
                </span>
              </div>
              <div className="relative mt-16">
                <div className="w-40 h-40 rounded-full bg-[#f6c9a3] border-[3px] border-[#1c1c28] mx-auto relative">
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-24 h-16 bg-[#b5651d] rounded-t-full border-[3px] border-[#1c1c28]" />
                  <span className="absolute top-[58px] left-9 w-6 h-2 border-b-[3px] border-[#1c1c28] rounded-b-full" />
                  <span className="absolute top-[58px] right-9 w-6 h-2 border-b-[3px] border-[#1c1c28] rounded-b-full" />
                  <span className="absolute bottom-7 left-1/2 -translate-x-1/2 w-10 h-5 border-b-[3px] border-[#1c1c28] rounded-b-full" />
                </div>
                <div className="w-64 h-24 -mt-4 mx-auto rounded-t-[3rem] bg-[#f0b429] border-[3px] border-[#1c1c28]" />
              </div>
              <span className="absolute bottom-10 right-12 w-4 h-4 rounded-full bg-brand" />
              <span className="absolute top-24 right-16 text-2xl text-[#1c1c28]">✦</span>
            </div>
          )}
          <div className="absolute -bottom-5 -left-3 sm:-left-6 rounded-xl bg-panel border border-line px-4 py-3 shadow-glow flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs"><RichText text={s.heroPriceBadge} vars={{ price: `৳${s.startingPrice}` }} /></span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
