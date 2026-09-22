"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Zap, Headset, ArrowRight, Lock, ThumbsUp, Star } from "lucide-react";
import RichText from "./RichText";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } } };

const PERK_ICONS = [ShieldCheck, Zap, Headset];

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

export default function Hero({ s }) {
  const perks = PERK_ICONS.map((icon, i) => ({ icon, title: s[`perk${i + 1}Title`], body: s[`perk${i + 1}Body`] }));
  return (
    <section id="home" className="relative pt-32 pb-24 overflow-hidden bg-grain">
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ backgroundImage: "linear-gradient(rgb(var(--fg)) 1px,transparent 1px),linear-gradient(90deg,rgb(var(--fg)) 1px,transparent 1px)", backgroundSize: "56px 56px", maskImage: "radial-gradient(ellipse at 30% 30%, #000, transparent 70%)", WebkitMaskImage: "radial-gradient(ellipse at 30% 30%, #000, transparent 70%)" }} />

      <div className="orb absolute -top-20 -left-24 w-96 h-96 rounded-full bg-brand/20 blur-[100px] pointer-events-none" />
      <div className="orb absolute top-40 right-0 w-80 h-80 rounded-full bg-gold/10 blur-[100px] pointer-events-none" style={{ animationDelay: "-6s" }} />
      <div className="container-x grid lg:grid-cols-2 gap-14 items-center relative">
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.span variants={item} className="inline-flex items-center gap-2 text-xs px-3.5 py-2 rounded-full border border-brand/40 text-brand bg-brand/10 mb-7 min-h-[32px]">
            <Lock size={12} /> <Typed lines={parseAnnouncement(s.announcement)} />
          </motion.span>

          <motion.h1 variants={item} className="font-display text-4xl sm:text-5xl lg:text-[3.6rem] leading-[1.08] font-bold">
            {s.heroTitleA} <span className="text-brand">{s.heroHighlight}</span> {s.heroTitleB}
          </motion.h1>

          <motion.p variants={item} className="mt-6 text-mist text-lg max-w-xl leading-relaxed">{s.heroText}</motion.p>

          <motion.div variants={item} className="mt-9 flex flex-wrap gap-4">
            <a href="#bundles" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent("htp-panel", { detail: "bundles" })); }} className="btn-shine group inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-brand hover:bg-brand-dark shadow-glow transition-colors font-semibold text-sm">
              {s.heroCta1} <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </a>
            <a href="#tools" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent("htp-panel", { detail: "tools" })); }} className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-line hover:border-mist transition-colors font-semibold text-sm">
              {s.heroCta2} <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </a>
          </motion.div>

          <motion.div variants={item} className="mt-14 grid sm:grid-cols-3 gap-6">
            {perks.map((p) => (
              <div key={p.title}>
                <span className="w-10 h-10 rounded-full bg-brand/15 text-brand flex items-center justify-center mb-3"><p.icon size={18} /></span>
                <p className="font-semibold">{p.title}</p>
                <p className="text-mist text-xs mt-1 leading-relaxed">{p.body}</p>
              </div>
            ))}
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
