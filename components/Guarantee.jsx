"use client";

import { motion } from "framer-motion";
import { ShieldCheck, BadgeCheck, Headset } from "lucide-react";
import Reveal from "./Reveal";

const ICONS = [ShieldCheck, BadgeCheck, Headset];

export default function Guarantee({ s }) {
  const cards = ICONS.map((icon, i) => ({
    icon,
    title: s[`gua${i + 1}Title`],
    body: s[`gua${i + 1}Body`],
    foot: s[`gua${i + 1}Foot`],
    hot: i === 2,
  }));
  return (
    <section className="relative py-24 border-t border-line overflow-hidden bg-gradient-to-b from-brand/[0.08] to-transparent">
      <div className="container-x">
        <Reveal className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-2 text-xs px-4 py-2 rounded-full bg-brand/80 mb-6"><ShieldCheck size={13} /> {s.guaBadge}</span>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-brand/90">{s.guaTitle}</h2>
          <p className="text-mist mt-4">{s.guaText}</p>
        </Reveal>
        <div className="grid sm:grid-cols-3 gap-5 mt-14 max-w-4xl mx-auto">
          {cards.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30, rotateX: -12 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.6 }}
              whileHover={{ y: -6 }}
              className={`rounded-xl border p-5 bg-panel/80 backdrop-blur ${c.hot ? "border-brand/60 shadow-glow" : "border-line"}`}
            >
              <c.icon size={18} className={c.hot ? "text-brand" : "text-mist"} />
              <h3 className={`font-semibold mt-3 ${c.hot ? "text-brand" : ""}`}>{c.title}</h3>
              <p className="text-xs text-mist mt-2 leading-relaxed">{c.body}</p>
              <p className="text-[11px] text-mist/70 mt-4">{c.foot}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
