"use client";

import { motion } from "framer-motion";
import { Info } from "lucide-react";
import Icon from "./IconMap";
import RichText from "./RichText";
import Reveal from "./Reveal";
import { spotMove } from "@/lib/spot";
import { openSoon } from "@/lib/soon";
import RequestTool from "./RequestTool";
import { useCheckout } from "./CheckoutProvider";

const tilt = [-1.2, 0.8, -0.8, 1.2];

export default function CustomPack({ plans, s, channels = [] }) {
  const checkout = useCheckout();
  return (
    <section id="custom" className="py-24 border-t border-line relative overflow-hidden">
      <div className="container-x">
        <Reveal className="text-center mb-14">
          <h2 className="font-display text-3xl sm:text-4xl font-bold"><RichText text={s.customTitle} /></h2>
          <p className="text-mist mt-3"><RichText text={s.customSubtitle} /></p>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.08}>
              <motion.div
                whileHover={{ rotate: 0, y: -6 }}
                initial={{ rotate: tilt[i % 4] }}
                onMouseMove={spotMove}
                className="spot relative h-full rounded-2xl border border-line bg-panel p-6 flex flex-col"
              >
                {p.popular && (
                  <span className="absolute -top-3 -right-2 rotate-6 bg-gold text-black text-[11px] font-bold px-3 py-1 rounded-lg">{s.planPopular}</span>
                )}
                <span className="w-10 h-10 rounded-full border border-line text-brand flex items-center justify-center mb-4"><Icon name={p.icon} size={17} /></span>
                <h3 className="font-display font-bold">{p.name}</h3>
                <p className="text-mist text-xs mt-1.5 min-h-[32px]">{p.tagline}</p>
                <p className="font-display font-bold text-3xl mt-5">৳{p.price.toLocaleString()}<span className="text-mist text-sm font-normal">/month</span></p>
                <div className="mt-5 rounded-xl border border-line bg-ink/60 p-3 text-xs text-mist flex-1">
                  <p className="flex gap-2"><span className="text-gold">•</span> {p.feature}</p>
                  <p className="flex items-center gap-1.5 mt-2 text-sky-400"><Info size={12} /> {s.planNote}</p>
                </div>
                <button
                  onClick={() => p.soon ? openSoon(p.name) : checkout({ type: "plan", id: p.id, name: p.name, price: p.price, per: "/month" })}
                  className={`mt-5 w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    p.popular ? "bg-gold text-black hover:brightness-110" : "bg-panel2 border border-line hover:border-mist"
                  }`}
                >
                  {p.soon ? s.soonBtn : s.planBtn}
                </button>
              </motion.div>
            </Reveal>
          ))}
        </div>

        <Reveal className="text-center mt-12">
          <p className="text-sm text-mist">{s.customFooterText}</p>
          <RequestTool kind="quote" channels={channels} s={s} className="inline-block mt-5 px-6 py-2.5 rounded-lg bg-brand hover:bg-brand-dark text-sm font-semibold transition-colors">{s.customBtn}</RequestTool>
        </Reveal>
      </div>
    </section>
  );
}
