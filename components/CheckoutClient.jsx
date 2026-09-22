"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag, Trash2, Loader2, CheckCircle2, Tag, Lock, ShieldCheck, AlertTriangle, MessageCircle, Send, Phone, Mail, Check, ArrowRight } from "lucide-react";
import { useCart } from "./CheckoutProvider";
import { track } from "@/lib/track";
import { withText, fillMsg } from "@/lib/wa";
import { ToolCover } from "./ToolsGrid";
import { getVisitorId } from "@/lib/visitorId";

const CODES = ["+880", "+91", "+1", "+44", "+971", "+966", "+60", "+65"];

function Section({ n, title, children }) {
  return (
    <section className="rounded-2xl border border-line bg-panel p-5 sm:p-7">
      <h2 className="font-display font-semibold text-lg flex items-center gap-3 mb-5">
        <span className="w-7 h-7 rounded-full bg-brand/15 text-brand text-sm flex items-center justify-center">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function CheckoutClient({ options, user, contact, wa: waT }) {
  const router = useRouter();
  const cart = useCart();
  const [method, setMethod] = useState(options[0]?.name || "");
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState(null); // {code, discount, label}
  const [cState, setCState] = useState({ busy: false, err: "" });
  const [st, setSt] = useState({ busy: false, err: "", done: null });

  const subtotal = cart.items.reduce((n, x) => n + x.price, 0);
  const total = Math.max(0, subtotal - (applied?.discount || 0));
  const key = useMemo(() => cart.items.map((x) => x.type + x.id).join(","), [cart.items]);
  const chosen = options.find((o) => o.name === method);
  const waCh = contact.channels.find((c) => c.key === "whatsapp");
  const itemsText = cart.items.map((x) => x.name).join(", ");
  const sentCheckout = useRef(false);
  useEffect(() => {
    if (cart.ready && cart.items.length && !sentCheckout.current) {
      sentCheckout.current = true;
      track("InitiateCheckout", { content_ids: cart.items.map((x) => x.id), content_type: "product", num_items: cart.items.length, value: cart.items.reduce((n, x) => n + x.price, 0), currency: "BDT" });
    }
  }, [cart.ready, cart.items]);
  const [first = "", ...restName] = (user?.name || "").split(" ");

  // The discount depends on the basket, so any change to it re-checks the coupon.
  useEffect(() => {
    if (!applied) return;
    setApplied(null);
    setCoupon(applied.code);
  }, [key]); // eslint-disable-line

  async function applyCoupon() {
    if (!coupon.trim()) return;
    setCState({ busy: true, err: "" });
    const r = await fetch("/api/coupon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: coupon, items: cart.items.map((x) => ({ type: x.type, id: x.id })) }),
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok) {
      setApplied({ code: j.code, discount: j.discount, label: j.label });
      setCState({ busy: false, err: "" });
    } else {
      setApplied(null);
      setCState({ busy: false, err: j.error || "Invalid coupon" });
    }
  }

  async function submit(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (!user && f.get("password") !== f.get("confirm")) return setSt({ busy: false, err: "Passwords do not match.", done: null });
    setSt({ busy: true, err: "", done: null });
    const r = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.items.map((x) => ({ type: x.type, id: x.id })),
        visitorId: getVisitorId(),
        name: `${f.get("first")} ${f.get("last")}`.trim(),
        email: f.get("email"),
        phone: `${f.get("cc")} ${f.get("phone")}`,
        method,
        txnId: f.get("txnId"),
        note: f.get("note"),
        coupon: applied?.code || "",
        password: f.get("password") || "",
        agree: f.get("agree") === "on",
      }),
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok) {
      track("Purchase", { value: j.amount, currency: "BDT", content_type: "product", content_name: cart.items.map((x) => x.name).join(", ").slice(0, 120), content_ids: cart.items.map((x) => x.id), order_id: String(j.number) }, { server: false, fb: !!j.fb, eventId: j.fb?.eventId || `purchase-${j.number}` });
      const summary = { items: cart.items.map((x) => x.name).join(", "), method, txn: String(f.get("txnId") || "") };
      cart.clear();
      setSt({ busy: false, err: "", done: { ...j, ...summary } });
      router.refresh();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else setSt({ busy: false, err: j.error || "Something went wrong", done: null });
  }

  if (st.done) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg mx-auto text-center rounded-2xl border border-line bg-panel p-10">
        <CheckCircle2 size={56} className="text-emerald-400 mx-auto mb-4" />
        <h1 className="font-display text-2xl font-bold">Order #{st.done.number} received</h1>
        <p className="text-brand font-bold text-xl mt-2">৳{st.done.amount.toLocaleString()}</p>
        <p className="text-mist text-sm mt-4 leading-relaxed">We will verify your payment and send your access details {waCh ? "by email or WhatsApp" : "to your email"} shortly. You can follow the status in your Client Area.</p>
        <div className="flex flex-wrap justify-center gap-3 mt-7">
          {waCh && (
            <div className="w-full basis-full mb-2">
              <p className="text-xs text-mist mb-2">{waT.note}</p>
              <a href={withText(waCh.href, fillMsg(waT.order, { number: st.done.number, items: st.done.items, amount: st.done.amount, method: st.done.method, txn: st.done.txn }))} target="_blank" rel="noopener noreferrer" onClick={() => track("Contact", { content_name: "whatsapp-order" })} className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl py-3.5 text-sm font-semibold text-white hover:brightness-110" style={{ background: "linear-gradient(135deg,#2BE372,#0E9F6E)", boxShadow: "0 12px 28px -14px #25D366" }}>
                <MessageCircle size={18} /> {waT.orderBtn} <ArrowRight size={15} />
              </a>
            </div>
          )}
          <Link href="/account" className="btn-primary">Open Client Area</Link>
          <Link href="/tools" className="btn-ghost">Keep shopping</Link>
        </div>
      </motion.div>
    );
  }

  if (!cart.ready) {
    return <div className="max-w-3xl mx-auto space-y-4">{[0, 1, 2].map((i) => <div key={i} className="shimmer h-32" />)}</div>;
  }

  if (cart.items.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center rounded-2xl border border-line bg-panel p-10">
        <ShoppingBag size={40} className="text-mist mx-auto mb-4" />
        <h1 className="font-display text-xl font-bold">Your basket is empty</h1>
        <p className="text-mist text-sm mt-2">Pick a tool or bundle to get started.</p>
        <Link href="/tools" className="btn-primary mt-6 justify-center">Browse tools</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
      <div className="space-y-6">
        <div className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <p>Before purchasing, check the <Link href="/limits" target="_blank" className="underline font-semibold">limits and tool status</Link>.</p>
        </div>

        <Section n="1" title="Select payment method">
          {options.length === 0 ? (
            <p className="text-sm text-mist">No payment options are configured yet. Please contact support.</p>
          ) : (
            <div className="space-y-3" role="radiogroup" aria-label="Payment method">
              {options.map((o) => {
                const on = method === o.name;
                return (
                  <label key={o.name} className={`block cursor-pointer rounded-xl border p-4 transition-colors ${on ? "border-brand bg-brand/[0.07]" : "border-line hover:border-mist"}`}>
                    <div className="flex items-start gap-3">
                      <input type="radio" name="pm" checked={on} onChange={() => setMethod(o.name)} className="mt-1 accent-[#E8352B]" />
                      <div className="flex-1">
                        <p className="font-semibold text-sm flex items-center gap-2.5">{o.logo && <span className="inline-flex h-8 min-w-[44px] items-center justify-center rounded-md bg-white px-2"><img src={o.logo} alt="" className="h-5 w-auto max-w-[72px] object-contain" /></span>}{o.name}</p>
                        {o.desc && <p className="text-xs text-mist mt-0.5">{o.desc}</p>}
                        <AnimatePresence initial={false}>
                          {on && (
                            <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden text-xs leading-relaxed text-fg/90 mt-3 rounded-lg bg-ink border border-line p-3">
                              {o.instructions}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
          <div className="mt-5">
            <label className="block text-xs text-mist mb-1.5">Payment Transaction ID <span className="text-brand">*</span></label>
            <input name="txnId" required minLength={6} placeholder="Enter the Transaction ID from your payment" className="input" />
            <p className="text-[11px] text-mist mt-1.5">We verify this before delivering your access.</p>
          </div>
        </Section>

        <Section n="2" title="Account details">
          {user ? (
            <p className="flex items-center gap-2 text-sm rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 mb-5"><Check size={15} /> Signed in as {user.email}</p>
          ) : (
            <p className="text-sm rounded-lg bg-panel2 border border-line px-4 py-3 mb-5 text-mist">
              Already have an account? <Link href="/login?next=/checkout" className="text-brand underline">Log in</Link> to continue. New here? Fill in the details below and we will create your account.
            </p>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="block text-xs text-mist mb-1.5">First name <span className="text-brand">*</span></label><input name="first" required defaultValue={first} className="input" /></div>
            <div><label className="block text-xs text-mist mb-1.5">Last name</label><input name="last" defaultValue={restName.join(" ")} className="input" /></div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-mist mb-1.5">Email address <span className="text-brand">*</span></label>
              <input name="email" type="email" required defaultValue={user?.email || ""} readOnly={!!user} className="input" />
              <p className="text-[11px] text-mist mt-1.5">A confirmation will be sent to this address.</p>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-mist mb-1.5">Mobile phone number <span className="text-brand">*</span></label>
              <div className="flex gap-2">
                <select name="cc" className="input !w-28" defaultValue="+880">{CODES.map((c) => <option key={c}>{c}</option>)}</select>
                <input name="phone" required minLength={6} defaultValue={user?.phone || ""} placeholder="1XXXXXXXXX" className="input" />
              </div>
              <p className="text-[11px] text-mist mt-1.5">Used for order updates.</p>
            </div>
            {!user && (
              <>
                <div><label className="block text-xs text-mist mb-1.5">Choose a password <span className="text-brand">*</span></label><input name="password" type="password" required minLength={8} autoComplete="new-password" className="input" /><p className="text-[11px] text-mist mt-1.5">At least 8 characters.</p></div>
                <div><label className="block text-xs text-mist mb-1.5">Confirm password <span className="text-brand">*</span></label><input name="confirm" type="password" required minLength={8} autoComplete="new-password" className="input" /></div>
              </>
            )}
            <div className="sm:col-span-2"><label className="block text-xs text-mist mb-1.5">Note (optional)</label><textarea name="note" rows={2} className="input" /></div>
          </div>
        </Section>

        <Section n="3" title="Need help paying?">
          <p className="text-sm text-mist mb-4">Contact us for any payment or buying question:</p>
          <div className="flex flex-wrap gap-3">
            {contact.channels.map((c) => (
              <a key={c.key} href={c.key === "whatsapp" ? withText(c.href, fillMsg(waT.help, { items: itemsText, total: total.toLocaleString() })) : c.href} target={/^https?:/i.test(c.href) ? "_blank" : undefined} rel="noreferrer" className="btn-ghost">{c.key === "telegram" ? <Send size={15} className="text-sky-400" /> : c.key === "messenger" ? <MessageCircle size={15} className="text-indigo-300" /> : <Phone size={15} className="text-emerald-400" />} {c.label}</a>
            ))}
            <a href={`mailto:${contact.email}`} className="btn-ghost"><Mail size={15} className="text-brand" /> {contact.email}</a>
          </div>
        </Section>
      </div>

      <aside className="lg:sticky lg:top-24 space-y-5">
        <div className="rounded-2xl border border-line bg-panel p-5 sm:p-6">
          <h2 className="font-display font-semibold text-lg mb-4">Order summary</h2>
          <ul className="divide-y divide-line">
            <AnimatePresence initial={false}>
              {cart.items.map((x) => (
                <motion.li key={x.type + x.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="flex items-center gap-3 py-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0"><ToolCover tool={{ name: x.name, image: x.image, accent: x.accent }} small /></div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{x.name}</p>
                      <p className="text-[11px] text-mist">Access {x.per ? x.per.replace("/", "for ") : ""}</p>
                    </div>
                    <p className="text-sm font-semibold">৳{x.price.toLocaleString()}</p>
                    <button type="button" onClick={() => cart.remove(x.type, x.id)} aria-label={`Remove ${x.name}`} className="p-3 -m-3 text-mist hover:text-red-400"><Trash2 size={15} /></button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          <div className="mt-4 pt-4 border-t border-line">
            <label className="flex items-center gap-2 text-xs text-mist mb-2"><Tag size={13} /> Coupon code</label>
            <div className="flex gap-2">
              <input value={coupon} onChange={(e) => setCoupon(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyCoupon())} placeholder="Enter code" className="input uppercase" />
              <button type="button" onClick={applyCoupon} disabled={cState.busy} className="btn-ghost shrink-0">{cState.busy ? <Loader2 size={14} className="animate-spin" /> : "Apply"}</button>
            </div>
            {cState.err && <p className="text-xs text-red-400 mt-2">{cState.err}</p>}
            {applied && <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1.5"><Check size={13} /> {applied.code} applied ({applied.label})</p>}
          </div>

          <dl className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between text-mist"><dt>Subtotal</dt><dd>৳{subtotal.toLocaleString()}</dd></div>
            {applied && <div className="flex justify-between text-emerald-400"><dt>Discount</dt><dd>-৳{applied.discount.toLocaleString()}</dd></div>}
            <div className="flex justify-between font-display font-bold text-xl pt-3 border-t border-line"><dt>Total</dt><dd className="text-brand">৳{total.toLocaleString()}</dd></div>
          </dl>

          <label className="flex items-start gap-3 text-xs text-mist mt-5 cursor-pointer">
            <input type="checkbox" name="agree" required className="mt-0.5 accent-[#E8352B]" />
            <span>I have read and agree to the <Link href="/terms" target="_blank" className="text-brand underline">Usage Terms</Link> and <Link href="/refund" target="_blank" className="text-brand underline">Refund Policy</Link>.</span>
          </label>

          {st.err && <p className="text-sm text-red-400 mt-4">{st.err}</p>}
          <button disabled={st.busy || !options.length} className="btn-primary w-full justify-center py-3.5 mt-5 text-base">
            {st.busy ? <Loader2 size={17} className="animate-spin" /> : <Lock size={16} />} Place order · ৳{total.toLocaleString()}
          </button>
          <p className="flex items-center justify-center gap-2 text-[11px] text-mist mt-4"><ShieldCheck size={13} className="text-emerald-400" /> Refund if access does not work</p>
        </div>
      </aside>
    </form>
  );
}
