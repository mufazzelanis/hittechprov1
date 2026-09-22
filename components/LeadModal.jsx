"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import { track } from "@/lib/track";
import { getVisitorId } from "@/lib/visitorId";

const COPY = {
  affiliate: { title: "Join the affiliate program", ph: "Where will you promote us? (optional)", cta: "Apply now" },
  "tool-request": { title: "Request a new tool", ph: "Which tool do you need?", cta: "Send request" },
  "custom-pack": { title: "Quote for a custom pack", ph: "List the tools you need", cta: "Get a quote" },
  "offer-notify": { title: "Get notified about Free Offers", ph: "Anything you would like to see? (optional)", cta: "Notify me" },
  "prompt-notify": { title: "Get notified about the AI Prompt Vault", ph: "Which AI tool do you use most? (optional)", cta: "Notify me" },
  contact: { title: "Contact us", ph: "How can we help?", cta: "Send" },
};

export default function LeadButton({ type = "contact", className = "", children }) {
  const [open, setOpen] = useState(false);
  const [st, setSt] = useState({ busy: false, err: "", done: false });
  const c = COPY[type];

  useEffect(() => {
    if (!open) return;
    const k = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [open]);

  async function submit(e) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget));
    setSt({ busy: true, err: "", done: false });
    const r = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, type, visitorId: getVisitorId() }) });
    const j = await r.json().catch(() => ({}));
    if (r.ok) track("Lead", { content_name: type });
    setSt(r.ok ? { busy: false, err: "", done: true } : { busy: false, err: j.error || "Failed", done: false });
  }

  return (
    <>
      <button type="button" className={className} onClick={() => { setSt({ busy: false, err: "", done: false }); setOpen(true); }}>{children}</button>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
            <motion.div role="dialog" aria-modal="true" className="w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-2xl border border-line bg-panel p-6" initial={{ y: 24 }} animate={{ y: 0 }} exit={{ y: 24, opacity: 0 }}>
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-display font-bold text-xl">{c.title}</h3>
                <button onClick={() => setOpen(false)} aria-label="Close" className="text-mist hover:text-fg"><X size={20} /></button>
              </div>
              {st.done ? (
                <div className="text-center py-8">
                  <CheckCircle2 size={44} className="text-emerald-400 mx-auto mb-3" />
                  <p className="font-semibold">Thanks! We will contact you soon.</p>
                  <button onClick={() => setOpen(false)} className="btn-primary mt-6">Close</button>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-3">
                  <input name="name" required placeholder="Full name" className="input" />
                  <input name="email" type="email" required placeholder="Email" className="input" />
                  <input name="phone" placeholder="Phone / WhatsApp" className="input" />
                  <textarea name="message" rows={3} placeholder={c.ph} className="input" />
                  {st.err && <p className="text-sm text-red-400">{st.err}</p>}
                  <button disabled={st.busy} className="btn-primary w-full justify-center py-3">
                    {st.busy && <Loader2 size={16} className="animate-spin" />} {c.cta}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
