"use client";

import { motion } from "framer-motion";
import { Smile, Frown, Rocket, TrendingDown, Target, Clock, Wrench, Zap } from "lucide-react";
import Reveal from "./Reveal";
import RichText from "./RichText";

const list = (v) => String(v || "").split(",").map((x) => x.trim()).filter(Boolean);
const nums = (v) => list(v).map((x) => Math.max(0, Math.min(100, parseFloat(x) || 0)));

function Bars({ values, metrics, color, title, sub, icon: Icon, footer, FooterIcon, good }) {
  return (
    <div className={`rounded-2xl border bg-panel p-6 ${good ? "border-brand/40" : "border-line"}`}>
      <span className="w-11 h-11 rounded-full bg-panel2 flex items-center justify-center mx-auto"><Icon size={20} className={good ? "text-brand" : "text-mist"} /></span>
      <h3 className={`text-center font-semibold mt-3 ${good ? "text-brand" : ""}`}>{title}</h3>
      <p className="text-center text-xs text-mist">{sub}</p>
      <div className="flex items-end gap-3 h-44 mt-6 border-b border-l border-line px-3">
        {values.map((v, i) => (
          <div key={i} className="flex-1 h-full flex items-end" title={`${metrics[i] || ""}: ${v}`}>
            <motion.div
              className="w-full rounded-t-md"
              style={{ background: color }}
              initial={{ height: 0 }}
              whileInView={{ height: `${v}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-3 px-3 mt-2">
        {values.map((_, i) => <span key={i} className="flex-1 text-[9px] text-mist text-center leading-tight">{metrics[i]}</span>)}
      </div>
      <p className={`flex items-center justify-center gap-2 text-xs mt-5 ${good ? "text-brand" : "text-mist"}`}><FooterIcon size={14} /> {footer}</p>
    </div>
  );
}

export default function WhyChoose({ s, name }) {
  const vars = { name };
  const metrics = list(s.whyMetrics);
  const stats = [
    [s.statYears, s.whyStat1Label, Target],
    [s.whyStat2Value, s.whyStat2Label, Clock],
    [s.statTools, s.whyStat3Label, Wrench],
    [s.statUptime, s.whyStat4Label, Zap],
  ];
  return (
    <section className="py-24 border-t border-line bg-panel/40">
      <div className="container-x">
        <Reveal className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold"><RichText text={s.whyTitle} vars={vars} /></h2>
          <p className="text-mist mt-3 text-sm">{s.whySubtitle}</p>
        </Reveal>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Bars values={nums(s.whyOurs)} metrics={metrics} color="#EF4444" title={s.whyGoodTitle.replace("{name}", name)} sub={s.whyGoodSub} icon={Smile} footer={s.whyGoodFooter} FooterIcon={Rocket} good />
          <Bars values={nums(s.whyOthers)} metrics={metrics} color="#D4D4D8" title={s.whyBadTitle.replace("{name}", name)} sub={s.whyBadSub} icon={Frown} footer={s.whyBadFooter} FooterIcon={TrendingDown} />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-3xl mx-auto mt-10">
          {stats.map(([v, l, I], i) => (
            <Reveal key={i}>
              <div className="rounded-xl border border-line bg-brand/[0.06] p-4 text-center">
                <p className="font-display font-bold text-xl text-brand">{v}</p>
                <p className="text-[11px] text-mist mt-1">{l}</p>
                <I size={14} className="mx-auto mt-2 text-mist" />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
