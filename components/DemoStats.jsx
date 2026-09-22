"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, animate } from "framer-motion";
import { Search, BarChart3, Globe, Target, Sparkles, Clock, Play, ShieldCheck, TrendingUp, Award, Wrench, Zap, Users } from "lucide-react";
import Reveal from "./Reveal";
import RichText from "./RichText";

const CARD_STYLE = [
  { icon: Search, tint: "from-blue-500/10" },
  { icon: BarChart3, tint: "from-emerald-500/10" },
  { icon: Globe, tint: "from-purple-500/10" },
  { icon: Target, tint: "from-orange-500/10" },
];

// Splits "9K+" / "99.7%" / "193+" into a number to count up to and its suffix.
function Counter({ value }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const m = String(value).match(/^([\d.]+)(.*)$/);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView || !m) return;
    const c = animate(0, parseFloat(m[1]), { duration: 1.6, ease: "easeOut", onUpdate: (v) => setN(v) });
    return () => c.stop();
  }, [inView]); // eslint-disable-line
  if (!m) return <span ref={ref}>{value}</span>;
  const dec = m[1].includes(".") ? m[1].split(".")[1].length : 0;
  return <span ref={ref}>{n.toFixed(dec)}{m[2]}</span>;
}

export default function DemoStats({ s }) {
  const cards = CARD_STYLE.map((c, i) => ({
    ...c,
    title: s[`demoCard${i + 1}Title`],
    body: s[`demoCard${i + 1}Body`],
    tags: String(s[`demoCard${i + 1}Tags`] || "").split(",").map((x) => x.trim()).filter(Boolean),
  }));
  const stats = [
    { icon: Wrench, v: s.statTools, l: s.statLabelTools, c: "text-brand" },
    { icon: Zap, v: s.statUptime, l: s.statLabelUptime, c: "text-emerald-400" },
    { icon: Users, v: s.statCustomers, l: s.statLabelCustomers, c: "text-blue-400" },
    { icon: Zap, v: s.statFastValue, l: s.statFastLabel, c: "text-gold" },
  ];

  return (
    <section className="py-24 border-t border-line bg-panel/40">
      <div className="container-x">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          <div className="grid grid-cols-2 gap-4 order-2 lg:order-1">
            {cards.map((c, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <div className={`h-full rounded-xl border border-line bg-gradient-to-br ${c.tint} to-panel p-4 hover:border-brand/40 transition-colors`}>
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="w-8 h-8 rounded-lg bg-brand/15 text-brand flex items-center justify-center"><c.icon size={15} /></span>
                    <span className="font-semibold text-sm">{c.title}</span>
                  </div>
                  <p className="text-[11px] text-mist leading-relaxed">{c.body}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {c.tags.map((t) => <span key={t} className="text-[10px] px-2 py-1 rounded-md bg-ink/60 text-mist">{t}</span>)}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="order-1 lg:order-2">
            <span className="inline-flex items-center gap-2 text-xs px-3.5 py-2 rounded-full border border-brand/40 bg-brand/10 mb-6">
              <Sparkles size={13} className="text-brand" /> {s.demoBadge}
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold leading-tight">
              <RichText text={s.demoTitle} />
            </h2>
            <p className="text-mist mt-5 leading-relaxed">{s.demoText}</p>
            <div className="flex flex-wrap gap-3 mt-7">
              <a href="#contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-brand to-brand-light font-semibold text-sm shadow-glow">
                <Clock size={15} /> {s.demoBtn1}
              </a>
              <a href={s.demoUrl || "#contact"} target={s.demoUrl ? "_blank" : undefined} rel="noreferrer" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-line hover:border-mist text-sm font-semibold">
                <Play size={14} /> {s.demoBtn2}
              </a>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-6 text-xs text-mist">
              <span className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-emerald-400" /> {s.demoPoint1}</span>
              <span className="flex items-center gap-1.5"><TrendingUp size={13} className="text-brand" /> {s.demoPoint2}</span>
              <span className="flex items-center gap-1.5"><Award size={13} className="text-gold" /> {s.demoPoint3}</span>
            </div>
          </Reveal>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-24 max-w-3xl mx-auto text-center">
          {stats.map((x) => (
            <Reveal key={x.l}>
              <x.icon size={22} className={`mx-auto mb-2 ${x.c}`} />
              <p className={`font-display font-bold text-3xl ${x.c}`}><Counter value={x.v} /></p>
              <p className="text-xs text-mist mt-1">{x.l}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
