"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Clock, Bell, Loader2, CheckCircle2 } from "lucide-react";
import BrandLogo from "./BrandLogo";
import { withText, fillMsg } from "@/lib/wa";
import { track } from "@/lib/track";
import { getVisitorId } from "@/lib/visitorId";

// Shown when someone taps a buy button on a product marked "Coming soon" in Admin.
export default function SoonPopup({ t, wa }) {
  const [name, setName] = useState(null);
  const [st, setSt] = useState({ busy: false, err: "", done: false });

  useEffect(() => {
    const on = (e) => { setSt({ busy: false, err: "", done: false }); setName(e.detail?.name || ""); };
    window.addEventListener("htp-soon", on);
    return () => window.removeEventListener("htp-soon", on);
  }, []);

  useEffect(() => {
    if (name === null) return;
    const k = (e) => e.key === "Escape" && setName(null);
    document.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [name]);

  async function submit(e) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget));
    setSt({ busy: true, err: "", done: false });
    const r = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, type: "soon-notify", message: `Coming soon: ${name}`, visitorId: getVisitorId() }) });
    const j = await r.json().catch(() => ({}));
    if (r.ok) { track("Lead", { content_name: `soon: ${name}` }); setSt({ busy: false, err: "", done: true }); }
    else setSt({ busy: false, err: j.error || "Something went wrong", done: false });
  }

  return (
    <AnimatePresence>
      {name !== null && (
        <motion.div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && setName(null)}>
          <motion.div role="dialog" aria-modal="true" aria-label={t.title} initial={{ y: 40, scale: 0.94, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 26 }} className="relative w-full max-w-sm max-h-[94dvh] overflow-y-auto rounded-3xl border border-line bg-panel px-6 pt-8 pb-6 text-center shadow-[0_30px_80px_-20px_rgba(232,53,43,0.35)]">
            <button onClick={() => setName(null)} aria-label="Close" className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center text-mist hover:text-fg hover:bg-fg/10"><X size={18} /></button>

            <span className="relative mx-auto flex w-16 h-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-[0_12px_30px_-10px_rgba(245,158,11,0.7)]">
              <Clock size={28} className="animate-pulse" />
              <span className="absolute inset-0 rounded-2xl border-2 border-amber-400 animate-ping opacity-40" />
            </span>
            <h3 className="font-display font-bold text-2xl mt-4">{t.title}</h3>
            <p className="text-sm text-mist leading-relaxed mt-2">{t.text.replace("{name}", name)}</p>

            {st.done ? (
              <div className="mt-5 rounded-2xl border border-emerald-500/40 bg-emerald-500/[0.07] p-4">
                <CheckCircle2 size={26} className="mx-auto text-emerald-400" />
                <p className="text-sm mt-2">{t.thanks}</p>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-5 space-y-3 text-left">
                <input name="name" required placeholder={t.fName} className="input" />
                <input name="email" type="email" required placeholder={t.fEmail} className="input" />
                {st.err && <p className="text-sm text-red-400">{st.err}</p>}
                <button disabled={st.busy} className="btn-primary w-full justify-center py-3">{st.busy ? <Loader2 size={16} className="animate-spin" /> : <Bell size={16} />} {t.notify}</button>
              </form>
            )}

            {wa && (
              <a href={withText(wa.href, fillMsg(t.waMsg, { name }))} target="_blank" rel="noopener noreferrer" onClick={() => track("Contact", { content_name: "whatsapp-soon" })} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white hover:brightness-110" style={{ background: "linear-gradient(135deg,#2BE372,#0E9F6E)" }}>
                <BrandLogo name="whatsapp" size={18} mono /> {t.waBtn}
              </a>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
