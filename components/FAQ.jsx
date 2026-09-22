"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Reveal from "./Reveal";
import RichText from "./RichText";

export default function FAQ({ faqs, s }) {
  const [openIdx, setOpenIdx] = useState(-1);

  return (
    <section id="faq" className="py-24 border-t border-line bg-panel/40">
      <div className="container-x max-w-3xl">
        <Reveal className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold"><RichText text={s.faqTitle} /></h2>
          <p className="text-mist mt-3 text-sm">{s.faqSubtitle}</p>
        </Reveal>

        <div className="space-y-3">
          {faqs.map((f, i) => {
            const on = openIdx === i;
            return (
              <Reveal key={f.id} delay={Math.min(i, 5) * 0.04} y={14}>
                <div className={`rounded-xl border bg-panel transition-colors ${on ? "border-brand/40" : "border-line"}`}>
                  <button
                    onClick={() => setOpenIdx(on ? -1 : i)}
                    aria-expanded={on}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="font-semibold text-sm">{f.question}</span>
                    <ChevronDown size={16} className={`shrink-0 text-mist transition-transform ${on ? "rotate-180 text-brand" : ""}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {on && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <p className="text-mist text-sm px-5 pb-5 leading-relaxed">{f.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
