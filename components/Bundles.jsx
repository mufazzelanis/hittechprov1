"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import Icon from "./IconMap";
import RichText from "./RichText";
import Reveal from "./Reveal";
import { spotMove } from "@/lib/spot";
import { openSoon } from "@/lib/soon";
import { useCheckout } from "./CheckoutProvider";

function BundleCard({ b, i, s }) {
  const checkout = useCheckout();
  const [show, setShow] = useState(false);
  const list = b.tools.split("\n").filter(Boolean);

  return (
    <Reveal delay={(i % 4) * 0.08}>
      <motion.div
        whileHover={{ y: -5 }}
        onMouseMove={spotMove}
        className={`spot relative rounded-2xl p-6 text-center h-full flex flex-col border transition-colors ${
          b.popular ? "border-brand bg-gradient-to-b from-brand/15 to-panel shadow-glow" : "border-line bg-panel hover:border-brand/40"
        }`}
      >
        {b.popular && (
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-semibold bg-brand px-3 py-1 rounded-full whitespace-nowrap">{s.bundlePopular}</span>
        )}
        <span className="w-11 h-11 rounded-full bg-brand/15 text-brand flex items-center justify-center mx-auto mb-4">
          <Icon name={b.icon} size={19} />
        </span>
        <h3 className="font-display font-bold">{b.name}</h3>
        <p className="text-mist text-xs mt-1.5 min-h-[32px]">{b.tagline}</p>
        <p className="font-display font-bold text-2xl text-brand mt-4">
          ৳{b.price.toLocaleString()}<span className="text-mist text-xs font-normal">/month</span>
        </p>
        <button onClick={() => setShow((s) => !s)} className="text-xs text-brand mt-4 hover:underline">
          {show ? s.bundleHideLabel : s.bundleViewLabel}
        </button>
        <AnimatePresence initial={false}>
          {show && (
            <motion.ul
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden text-left text-xs text-mist mt-3 space-y-1.5"
            >
              {list.map((t) => (
                <li key={t} className="flex items-center gap-2"><Check size={12} className="text-brand shrink-0" /> {t}</li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
        <button
          onClick={() => b.soon ? openSoon(b.name) : checkout({ type: "bundle", id: b.id, name: b.name, price: b.price, per: "/month" })}
          className={`mt-auto pt-0 w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            b.popular ? "bg-brand hover:bg-brand-dark" : "border border-line hover:border-mist"
          }`}
          style={{ marginTop: "1.25rem" }}
        >
          {b.soon ? s.soonBtn : s.bundleBtn}
        </button>
      </motion.div>
    </Reveal>
  );
}

export default function Bundles({ bundles, s }) {
  return (
    <section id="bundles" className="py-24 border-t border-line bg-panel/40">
      <div className="container-x">
        <Reveal className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="font-display text-3xl sm:text-4xl font-bold"><RichText text={s.bundlesTitle} /></h2>
          <p className="text-mist mt-4">
            <RichText text={s.bundlesSubtitle} />
          </p>
          <p className="font-semibold mt-10"><RichText text={s.bundlesLead} /></p>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {bundles.map((b, i) => <BundleCard key={b.id} b={b} i={i} s={s} />)}
        </div>
      </div>
    </section>
  );
}
