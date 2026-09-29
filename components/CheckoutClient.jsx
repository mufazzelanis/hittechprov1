"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag, Trash2, Loader2, CheckCircle2, Tag, Lock, ShieldCheck, AlertTriangle, MessageCircle, Send, Phone, Mail, Check, ArrowRight, XCircle, Info, User, Smartphone, KeyRound, Eye, EyeOff, StickyNote, LogIn, UserPlus, ChevronDown, Copy, Receipt, Sparkles, HelpCircle, Landmark, Bitcoin, Wallet, Clock, X, Ticket, BadgeCheck, Headphones } from "lucide-react";
import { useCart } from "./CheckoutProvider";
import { track } from "@/lib/track";
import { withText, fillMsg } from "@/lib/wa";
import { ToolCover } from "./ToolsGrid";
import { getVisitorId } from "@/lib/visitorId";
import { PHONE_CODES as CODES, checkPhone, splitPhone } from "@/lib/phone";
import { checkEmail } from "@/lib/email";
import { checkTxn, methodKind, findCopyables, findNetwork, METHOD_INFO } from "@/lib/txn";
import { toUsd, WALLET_METHOD } from "@/lib/payments";

// Cart items are display-ready objects (name/price/per already resolved for the UI); the server only
// ever trusts type+id (or, for an SMM line, serviceId/qty/link) and re-prices everything itself.
const toWanted = (x) => (x.type === "smm" ? { type: "smm", id: x.id, serviceId: x.serviceId, qty: x.qty, link: x.link } : { type: x.type, id: x.id });

async function verifyEmailRemote(email) {
  const r = await fetch("/api/check-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }).catch(() => null);
  return r?.ok ? r.json().catch(() => null) : null;
}

const MSG_STYLE = {
  error: { cls: "text-red-400", Icon: XCircle },
  warn: { cls: "text-amber-300", Icon: AlertTriangle },
  ok: { cls: "text-emerald-400", Icon: CheckCircle2 },
  info: { cls: "text-mist", Icon: Info },
};

function MsgList({ id, items }) {
  return (
    <ul id={id} aria-live="polite" className="mt-2 space-y-1">
      {items.map((m, i) => {
        const { cls, Icon } = MSG_STYLE[m.type];
        return <li key={i} className={`flex items-start gap-1.5 text-xs ${cls}`}><Icon size={14} className="shrink-0 mt-px" />{m.text}</li>;
      })}
    </ul>
  );
}

const LABEL = "block text-sm font-bold text-fg mb-1.5";

// Label + input wrapper with a leading icon that lights up while the field has focus.
function Field({ label, required, icon: Icon, className = "", iconTop = false, after, children }) {
  return (
    <div className={className}>
      <label className={LABEL}>{label} {required && <span className="text-brand">*</span>}</label>
      <div className="group relative">
        {Icon && <Icon size={17} className={`absolute left-3 ${iconTop ? "top-3" : "top-1/2 -translate-y-1/2"} text-mist pointer-events-none transition-colors group-focus-within:text-brand z-[1]`} />}
        {children}
      </div>
      {after}
    </div>
  );
}

function StatusIcon({ status }) {
  return (
    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
      {status === "checking" ? <Loader2 size={17} className="animate-spin text-mist" /> : status === "error" ? <XCircle size={18} className="text-red-400" /> : status === "warn" ? <AlertTriangle size={18} className="text-amber-300" /> : status === "ok" ? <CheckCircle2 size={18} className="text-emerald-400" /> : null}
    </span>
  );
}

const ringFor = (status) => (status === "error" ? "!border-red-500 focus:!border-red-500" : status === "ok" ? "!border-emerald-500/70" : status === "warn" ? "!border-amber-400/70" : "");

// Warning box that stays a one-line title until its field is focused (or the title is clicked).
function Notice({ title, open, children }) {
  const [manual, setManual] = useState(false);
  const show = open || manual;
  return (
    <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-200">
      <button type="button" onClick={() => setManual((v) => !v)} aria-expanded={show} className="w-full flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-300 text-left">
        <AlertTriangle size={14} className="shrink-0" /><span className="flex-1">{title}</span>
        <ChevronDown size={14} className={`shrink-0 transition-transform ${show ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {show && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <ul className="list-disc pl-7 pr-3 pb-2.5 space-y-0.5 text-[11px] leading-relaxed">{children}</ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function checkName(v) {
  const s = String(v || "").trim();
  if (!s) return { status: "empty", msg: "" };
  if (/\d/.test(s)) return { status: "error", msg: "Names cannot contain numbers." };
  if (/[^\p{L}\p{M} .'-]/u.test(s)) return { status: "error", msg: "Use letters only - no symbols or emoji." };
  if (s.replace(/[^\p{L}]/gu, "").length < 2) return { status: "error", msg: "Enter at least 2 letters." };
  if (/^(.)\1+$/iu.test(s.replace(/\s/g, "")) || /^(test|asdf|qwerty|abc|xyz|name|fake|none)$/i.test(s)) return { status: "error", msg: "Please enter your real name." };
  return { status: "ok", msg: "" };
}

function NameField({ name, label, required, initial, report }) {
  const [val, setVal] = useState(initial);
  const [touched, setTouched] = useState(false);
  const r = checkName(val);
  const status = r.status === "error" && !touched ? "empty" : r.status;
  useEffect(() => { report?.(name, r.status === "ok"); }, [r.status]); // eslint-disable-line
  return (
    <Field label={label} required={required} icon={User} after={status === "error" && <MsgList items={[{ type: "error", text: r.msg }]} />}>
      <input id={`checkout-${name}`} name={name} required={required} value={val} onChange={(e) => setVal(e.target.value)} onBlur={() => setTouched(true)} autoComplete={name === "first" ? "given-name" : "family-name"} placeholder={name === "first" ? "e.g. Rahim" : "e.g. Uddin"} aria-invalid={status === "error"} className={`input input-glow !pl-10 pr-10 ${ringFor(status)}`} />
      <StatusIcon status={status} />
    </Field>
  );
}

const COMMON_PW = new Set(["password", "password1", "password123", "12345678", "123456789", "1234567890", "qwerty123", "qwertyuiop", "11111111", "00000000", "iloveyou", "abcd1234", "abc12345", "welcome1", "admin123", "letmein1", "bangladesh", "asdfghjkl", "87654321", "12341234", "a1234567"]);

function passwordInfo(pw) {
  const s = String(pw || "");
  const rules = [
    { ok: s.length >= 8, text: "8+ characters" },
    { ok: /[a-z]/.test(s) && /[A-Z]/.test(s), text: "Upper & lower case" },
    { ok: /\d/.test(s), text: "A number" },
    { ok: /[^A-Za-z0-9]/.test(s), text: "A symbol (!@#...)" },
  ];
  const common = COMMON_PW.has(s.toLowerCase()) || /^(.)\1+$/.test(s);
  let score = rules.filter((r) => r.ok).length + (s.length >= 12 ? 1 : 0);
  if (!rules[0].ok || common) score = Math.min(score, 1);
  score = Math.min(score, 4);
  const error = !s ? "" : common ? "This password is too common - anyone could guess it." : !rules[0].ok ? `At least 8 characters (${8 - s.length} more).` : "";
  return { rules, score, error };
}

const STRENGTH = [
  { label: "Too weak", cls: "bg-red-500", text: "text-red-400" },
  { label: "Weak", cls: "bg-red-500", text: "text-red-400" },
  { label: "Fair", cls: "bg-amber-400", text: "text-amber-300" },
  { label: "Good", cls: "bg-emerald-400", text: "text-emerald-400" },
  { label: "Strong", cls: "bg-emerald-500", text: "text-emerald-400" },
];

function PasswordFields({ report }) {
  const [pw, setPw] = useState("");
  const [cf, setCf] = useState("");
  const [show, setShow] = useState(false);
  const info = passwordInfo(pw);
  const pwOk = pw && !info.error;
  const cfState = !cf ? "empty" : cf === pw ? "ok" : pw.startsWith(cf) ? "empty" : "error";
  useEffect(() => { report?.("password", !!pwOk); report?.("confirm", !!pwOk && cf === pw); }, [pwOk, cf, pw]); // eslint-disable-line
  const s = STRENGTH[info.score];
  const eye = (
    <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-mist hover:text-fg">
      {show ? <EyeOff size={17} /> : <Eye size={17} />}
    </button>
  );
  return (
    <>
      <Field label="Choose a password" required icon={KeyRound}>
        <input id="checkout-password" name="password" type={show ? "text" : "password"} required minLength={8} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="At least 8 characters" className={`input input-glow !pl-10 pr-11 ${pw ? ringFor(info.error ? "error" : info.score >= 3 ? "ok" : "warn") : ""}`} />
        {eye}
      </Field>
      <Field label="Confirm password" required icon={Lock}>
        <input id="checkout-confirm" name="confirm" type={show ? "text" : "password"} required minLength={8} autoComplete="new-password" value={cf} onChange={(e) => setCf(e.target.value)} placeholder="Type it again" aria-invalid={cfState === "error"} className={`input input-glow !pl-10 pr-11 ${ringFor(cfState)}`} />
        {eye}
      </Field>
      {(pw || cf) && (
        <div className="sm:col-span-2 -mt-1 rounded-lg border border-line bg-panel2/60 p-3">
          {pw && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1 grid grid-cols-4 gap-1.5" aria-hidden>
                  {[1, 2, 3, 4].map((i) => <span key={i} className={`h-1.5 rounded-full transition-colors duration-300 ${info.score >= i ? s.cls : "bg-line"}`} />)}
                </div>
                <span className={`text-xs font-bold w-16 text-right ${s.text}`}>{s.label}</span>
              </div>
              <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
                {info.rules.map((r) => <li key={r.text} className={`flex items-center gap-1 text-[11px] transition-colors ${r.ok ? "text-emerald-400" : "text-mist"}`}>{r.ok ? <CheckCircle2 size={12} /> : <span className="w-3 h-3 rounded-full border border-current" />}{r.text}</li>)}
              </ul>
              {info.error && <MsgList items={[{ type: "error", text: info.error }]} />}
            </>
          )}
          {cfState === "ok" && <MsgList items={[{ type: "ok", text: "Passwords match." }]} />}
          {cfState === "error" && <MsgList items={[{ type: "error", text: "Passwords do not match." }]} />}
        </div>
      )}
    </>
  );
}

function EmailField({ initial, locked, report }) {
  const [val, setVal] = useState(initial);
  const [touched, setTouched] = useState(false);
  const [focus, setFocus] = useState(false);
  const [remote, setRemote] = useState(null); // { email, status, messages, suggestion }
  const local = checkEmail(val);
  const email = local.email;

  // Once the address passes the offline rules, ask the server whether its domain really takes mail.
  useEffect(() => {
    if (locked || local.status === "error" || local.status === "empty") return;
    let live = true;
    const t = setTimeout(async () => {
      const j = await verifyEmailRemote(email);
      if (live) setRemote(j ? { ...j, email } : { email, status: local.status, messages: local.messages });
    }, 600);
    return () => { live = false; clearTimeout(t); };
  }, [email, locked, local.status]); // eslint-disable-line

  const remoteOk = remote?.email === email && (remote.status === "ok" || remote.status === "warn");
  useEffect(() => { report?.("email", locked || (local.status !== "error" && remoteOk)); }, [locked, local.status, remoteOk]); // eslint-disable-line

  if (locked) {
    return (
      <div className="sm:col-span-2">
        <Field label="Email address" required icon={Mail}>
          <input name="email" type="email" required value={val} readOnly className="input !pl-10 pr-10 opacity-80 cursor-not-allowed" />
          <StatusIcon status="ok" />
        </Field>
        <p className="text-[11px] text-mist mt-1.5">A confirmation will be sent to this address.</p>
      </div>
    );
  }

  const checking = local.status !== "error" && local.status !== "empty" && remote?.email !== email;
  const r = local.status === "error" ? local : remote?.email === email ? remote : null;
  // Half-typed addresses ("rahim", "rahim@gma") aren't wrong yet - wait for a blur or a full domain.
  const early = !touched && local.status === "error" && !/@[^@]+\.[a-z]{2,}$/i.test(email) && !/\s/.test(email);
  const status = checking ? "checking" : early || !r ? "empty" : r.status;
  const suggestion = !early && r?.suggestion;

  return (
    <div className="sm:col-span-2">
      <Field label="Email address" required icon={Mail}>
        <input
          id="checkout-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => { setTouched(true); setFocus(false); }}
          placeholder="yourname@gmail.com"
          aria-invalid={status === "error"}
          aria-describedby="checkout-email-msg"
          className={`input input-glow !pl-10 pr-10 ${ringFor(status)}`}
        />
        <StatusIcon status={status} />
      </Field>
      <MsgList
        id="checkout-email-msg"
        items={status === "checking" ? [{ type: "info", text: "Checking that this email can receive mail..." }] : early ? (email ? [{ type: "info", text: "Keep typing... e.g. yourname@gmail.com" }] : []) : r?.messages || []}
      />
      {suggestion && (
        <button type="button" onClick={() => setVal(suggestion)} className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-brand/40 bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand-light hover:bg-brand/20">
          <Check size={13} /> Use {suggestion}
        </button>
      )}
      <Notice title="Use an email inbox you can open right now" open={focus}>
        <li>Your order confirmation, login and <b>access details are sent to this email</b>.</li>
        <li>Temporary, disposable or made-up emails are blocked and cannot receive your access.</li>
        <li>A wrong email means you will not get your product - check the spelling carefully.</li>
        <li>Also check your Spam / Promotions folder after ordering.</li>
      </Notice>
    </div>
  );
}

function PhoneField({ initial, report }) {
  const init = splitPhone(initial);
  const [cc, setCc] = useState(init.cc || "+880");
  const [val, setVal] = useState(init.rest);
  const [touched, setTouched] = useState(false);
  const [focus, setFocus] = useState(false);
  const r = checkPhone(cc, val);
  useEffect(() => { report?.("phone", r.status === "ok" || r.status === "warn"); }, [r.status]); // eslint-disable-line
  // While still typing, "too short" is expected - hold it back until the user leaves the field.
  const typing = !touched && r.messages.some((m) => m.text.startsWith("Too short"));
  const shown = typing
    ? [...r.messages.filter((m) => m.type === "error" && !m.text.startsWith("Too short")), ...(r.messages.some((m) => m.type === "error" && !m.text.startsWith("Too short")) ? [] : [{ type: "info", text: `Keep typing... ${cc === "+880" ? "11 digits needed, e.g. 01712345678" : "enter your full mobile number"}` }])]
    : r.messages;
  const bad = !typing && r.status === "error";
  const status = r.status === "empty" || typing ? "empty" : r.status;

  return (
    <div className="sm:col-span-2">
      <label className={LABEL}>Mobile phone number <span className="text-brand">*</span></label>
      <div className="flex gap-2">
        <select name="cc" value={cc} onChange={(e) => setCc(e.target.value)} className="input input-glow !w-28 font-semibold">{CODES.map((c) => <option key={c}>{c}</option>)}</select>
        <div className="group relative flex-1">
          <Smartphone size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-mist pointer-events-none transition-colors group-focus-within:text-brand z-[1]" />
          <input
            id="checkout-phone"
            name="phone"
            required
            inputMode="tel"
            autoComplete="tel-national"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onFocus={() => setFocus(true)}
            onBlur={() => { setTouched(true); setFocus(false); }}
            placeholder={cc === "+880" ? "01XXXXXXXXX" : "Mobile number"}
            aria-invalid={bad}
            aria-describedby="checkout-phone-msg"
            className={`input input-glow !pl-10 pr-10 ${ringFor(status)}`}
          />
          <StatusIcon status={status} />
        </div>
      </div>
      <MsgList id="checkout-phone-msg" items={shown} />
      <Notice title="Use your real, active mobile number" open={focus}>
        <li>We call or WhatsApp this number to confirm your order and send your access.</li>
        <li>Orders with a fake, wrong or unreachable number are <b>cancelled without delivery</b>.</li>
        <li>Keep this phone with you - an unanswered verification delays your order.</li>
        <li>Enter only your own number, not a friend&apos;s or a shop&apos;s.</li>
      </Notice>
    </div>
  );
}

function CopyBtn({ value, label = "Copy", className = "" }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const t = document.createElement("textarea");
      t.value = value; document.body.appendChild(t); t.select();
      try { document.execCommand("copy"); } catch {}
      t.remove();
    }
    setDone(true);
    setTimeout(() => setDone(false), 1600);
  }
  return (
    <button type="button" onClick={copy} className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors ${done ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300" : "border-line bg-panel hover:border-brand hover:text-brand-light"} ${className}`}>
      {done ? <Check size={12} strokeWidth={3} /> : <Copy size={12} />} {done ? "Copied" : label}
    </button>
  );
}

function MethodBadge({ o }) {
  const info = METHOD_INFO[methodKind(o.name)];
  if (o.logo) return <span className="inline-flex h-9 w-14 shrink-0 items-center justify-center rounded-lg bg-white px-1.5 shadow-sm"><img src={o.logo} alt="" className="h-6 w-auto max-w-full object-contain" /></span>;
  const Icon = { bank: Landmark, crypto: Bitcoin }[methodKind(o.name)] || Wallet;
  return <span className="inline-flex h-9 w-14 shrink-0 items-center justify-center rounded-lg text-white shadow-sm" style={{ background: `linear-gradient(135deg, ${info.brand}, ${info.brand}cc)` }}><Icon size={18} /></span>;
}

// Step-by-step "how to pay" for the chosen method, with the amount and account numbers one tap to copy.
function PayGuide({ o, total, usd }) {
  const kind = methodKind(o.name);
  const info = METHOD_INFO[kind];
  const copies = findCopyables(o.instructions);
  const acct = copies[0];
  const mfs = ["bkash", "nagad", "rocket", "upay"].includes(kind);
  const network = kind === "crypto" ? findNetwork(o.instructions) : "";
  const usdAmt = kind === "crypto" ? toUsd(total, usd?.rate) : null;
  const steps = mfs
    ? [
        <>Open the <b>{info.app}</b> or dial <b className="font-mono">{info.ussd}</b></>,
        <>Choose <b>Send Money</b></>,
        acct ? <>Enter our number <b className="font-mono tracking-wide">{acct.value}</b> <CopyBtn value={acct.value.replace(/-/g, "")} className="ml-1 align-middle" /></> : <>Enter the number shown below</>,
        <>Enter the amount <b className="text-brand-light">৳{total.toLocaleString()}</b> <CopyBtn value={String(total)} className="ml-1 align-middle" /></>,
        <>Confirm with your PIN, then copy the <b>Transaction ID</b> from the SMS and paste it below</>,
      ]
    : kind === "crypto"
      ? [
          <>Open your wallet or exchange (Binance, Bybit, Trust Wallet...) and choose <b>Withdraw / Send</b></>,
          network ? <>Select the <b>{network}</b> network - it must match exactly</> : <>Select the network shown in the details below</>,
          <>Paste our <b>wallet address</b> - use the Copy button above, never type it by hand</>,
          usdAmt ? <>Send exactly <b className="text-emerald-300">{usdAmt.toFixed(2)} {usd.currency}</b> <CopyBtn value={usdAmt.toFixed(2)} className="ml-1 align-middle" /> - if your exchange charges a network fee, add it on top</> : <>Send the equivalent of <b className="text-brand-light">৳{total.toLocaleString()}</b></>,
          <>After it is sent, copy the <b>TXID / transaction hash</b> and paste it below</>,
        ]
      : kind === "bank"
        ? [
            <>Deposit or transfer to the account below (bank app, Only NPSB)</>,
            <>Send exactly <b className="text-brand-light">৳{total.toLocaleString()}</b></>,
            <>Enter the <b>deposit slip / transfer reference number</b> below</>,
          ]
        : null;
  return (
    <div className="mt-3 space-y-3">
      {usdAmt ? (
        <div className="rounded-xl border border-emerald-500/35 bg-gradient-to-r from-emerald-500/15 to-transparent px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-mist font-semibold">Amount to send</p>
              <p className="font-display text-3xl font-bold text-emerald-300 leading-tight tabular-nums">${usdAmt.toFixed(2)} <span className="text-base font-semibold text-emerald-400/80">{usd.currency}</span></p>
            </div>
            <CopyBtn value={usdAmt.toFixed(2)} label={`Copy ${usd.currency} amount`} />
          </div>
          <div className="mt-2 pt-2 border-t border-emerald-500/20 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs">
            <span className="text-mist">Order total <b className="text-fg">৳{total.toLocaleString()}</b></span>
            <span className="inline-flex items-center gap-1 rounded-full bg-panel border border-line px-2 py-0.5 text-[11px] text-mist tabular-nums">Rate: 1 USD = <b className="text-fg">৳{usd.rate.toLocaleString()}</b></span>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand/30 bg-gradient-to-r from-brand/15 to-transparent px-4 py-3">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-mist font-semibold">Amount to pay</p>
            <p className="font-display text-2xl font-bold text-fg leading-tight">৳{total.toLocaleString()}</p>
          </div>
          <CopyBtn value={String(total)} label="Copy amount" />
        </div>
      )}
      {!mfs && copies.length > 0 && (
        <div className="rounded-xl border border-line bg-ink divide-y divide-line">
          {network && (
            <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-mist">Network</span>
              <span className="rounded-md px-2 py-0.5 text-xs font-bold text-white" style={{ background: info.brand }}>{network}</span>
            </div>
          )}
          {copies.map((c) => (
            <div key={c.label + c.value} className="flex items-center gap-3 px-3.5 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-mist">{c.label}</p>
                <p className={`font-mono text-sm font-bold text-fg break-all ${c.label === "Wallet address" ? "tracking-wide" : ""}`}>{c.value}</p>
              </div>
              <CopyBtn value={/^Account no|Routing|Number/.test(c.label) ? c.value.replace(/[\s-]/g, "") : c.value} className="shrink-0 !px-2.5 !py-1.5" />
            </div>
          ))}
        </div>
      )}
      {network && (
        <p className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-amber-200">
          <AlertTriangle size={14} className="shrink-0 mt-px text-amber-300" />
          <span>Send only on the <b>{network}</b> network. Coins sent on any other network cannot be recovered.</span>
        </p>
      )}
      {steps && (
        <ol className="space-y-2.5">
          {steps.map((s, i) => (
            <li key={i} className="flex items-start gap-3 text-xs text-fg/90 leading-relaxed">
              <span className="mt-px w-5 h-5 shrink-0 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={{ background: info.brand }}>{i + 1}</span>
              <span className="pt-0.5">{s}</span>
            </li>
          ))}
        </ol>
      )}
      {o.instructions && <p className="text-[11px] leading-relaxed text-mist rounded-lg bg-ink border border-line px-3 py-2.5"><Info size={12} className="inline -mt-0.5 mr-1" />{o.instructions}</p>}
    </div>
  );
}

function TxnField({ method, total, report }) {
  const kind = methodKind(method);
  const info = METHOD_INFO[kind];
  const [val, setVal] = useState("");
  const [touched, setTouched] = useState(false);
  const [help, setHelp] = useState(false);
  const [remote, setRemote] = useState(null); // { value, used }
  const r = checkTxn(kind, val, total);

  // A pasted SMS is swapped for the ID found inside it, so the box shows exactly what we'll submit.
  function onChange(e) {
    const next = e.target.value;
    const c = checkTxn(kind, next, total);
    setVal(c.extracted ? c.value : kind === "crypto" || kind === "bank" ? next : next.toUpperCase().replace(/\s/g, ""));
    if (c.extracted) setTouched(true);
  }

  useEffect(() => {
    if (r.status === "error" || r.status === "empty") return;
    let live = true;
    const t = setTimeout(async () => {
      const res = await fetch("/api/check-txn", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ txnId: r.value, method }) }).catch(() => null);
      const j = res?.ok ? await res.json().catch(() => null) : null;
      if (live) setRemote({ value: r.value, used: !!j?.used });
    }, 500);
    return () => { live = false; clearTimeout(t); };
  }, [r.value, r.status, method]); // eslint-disable-line

  const checking = (r.status === "ok" || r.status === "warn") && remote?.value !== r.value;
  const used = remote?.value === r.value && remote.used;
  const early = !touched && r.status === "error" && r.messages.some((m) => m.text.startsWith("Too short"));
  const status = checking ? "checking" : used ? "error" : early ? "empty" : r.status;
  const msgs = checking
    ? [{ type: "info", text: "Checking this Transaction ID..." }]
    : used
      ? [{ type: "error", text: "This Transaction ID has already been used on another order. Each payment can only be used once." }]
      : early ? [] : status === "ok" ? [...r.messages, { type: "ok", text: "Transaction ID format looks correct. We will match it with the payment before delivery." }] : r.messages;
  useEffect(() => { report?.("txn", status === "ok" || status === "warn"); }, [status]); // eslint-disable-line

  return (
    <div className="mt-6 rounded-xl border border-line bg-panel2/50 p-4">
      <label htmlFor="checkout-txn" className="block text-sm font-bold text-brand-light mb-1.5 attn-blink">Payment Transaction ID <span className="text-brand">*</span></label>
      <div className="group relative">
        <Receipt size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-mist pointer-events-none transition-colors group-focus-within:text-brand z-[1]" />
        <input
          id="checkout-txn"
          name="txnId"
          required
          value={val}
          onChange={onChange}
          onBlur={() => setTouched(true)}
          autoComplete="off"
          spellCheck={false}
          placeholder={info.example ? `e.g. ${info.example}` : "Enter the Transaction ID from your payment"}
          aria-invalid={status === "error"}
          aria-describedby="checkout-txn-msg"
          className={`input input-glow !pl-10 pr-10 font-mono tracking-wider ${ringFor(status)}`}
        />
        <StatusIcon status={status} />
      </div>
      <MsgList id="checkout-txn-msg" items={msgs} />
      <p className="mt-2 text-[11px] text-mist flex items-start gap-1.5"><Sparkles size={12} className="shrink-0 mt-px text-brand" /> Tip: you can paste the whole payment SMS - we pick out the Transaction ID for you.</p>
      <button type="button" onClick={() => setHelp((v) => !v)} aria-expanded={help} className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-light hover:underline">
        <HelpCircle size={12} /> Where do I find my Transaction ID? <ChevronDown size={12} className={`transition-transform ${help ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {help && (
          <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden text-[11px] leading-relaxed text-fg/80">
            <span className="block mt-2 rounded-lg bg-ink border border-line px-3 py-2">{info.where}</span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function Section({ n, title, extra, done, children }) {
  return (
    <section className="rounded-2xl border border-line bg-panel p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 mb-5">
        <h2 className="font-display font-semibold text-lg flex items-center gap-3">
          <span className={`w-7 h-7 rounded-full text-sm flex items-center justify-center transition-colors ${done ? "bg-emerald-500 text-white" : "bg-brand/15 text-brand"}`}>{done ? <Check size={15} strokeWidth={3} /> : n}</span>
          {title}
        </h2>
        {extra}
      </div>
      {children}
    </section>
  );
}

export default function CheckoutClient({ options, user, contact, wa: waT, usd, wallet = 0 }) {
  const router = useRouter();
  const cart = useCart();
  const [method, setMethod] = useState(options[0]?.name || "");
  const isWallet = method === WALLET_METHOD;
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
  // Which required account fields are valid right now - drives the section's progress bar.
  const accKeys = user ? ["first", "email", "phone"] : ["first", "email", "phone", "password", "confirm"];
  const [valid, setValid] = useState({});
  const report = useRef((k, ok) => setValid((v) => (v[k] === ok ? v : { ...v, [k]: ok }))).current;
  const accDone = accKeys.filter((k) => valid[k]).length;
  const [agree, setAgree] = useState(false);
  const [nudge, setNudge] = useState(0); // bumps each time "Place order" is pressed without the terms ticked
  const checklist = [
    [!!method && (isWallet ? wallet >= total : !!valid.txn), "Payment & Transaction ID", "checkout-txn"],
    [accDone === accKeys.length, "Account details", "checkout-first"],
    [agree, "Accept the terms", "checkout-agree"],
  ];
  const left = checklist.filter(([ok]) => !ok).length;
  const usdTotal = methodKind(method) === "crypto" ? toUsd(total, usd?.rate) : null;

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
      body: JSON.stringify({ code: coupon, items: cart.items.map(toWanted) }),
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
    if (!agree) return setNudge((n) => n + 1);
    const f = new FormData(e.currentTarget);
    const jump = (id, err) => {
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus(); el?.blur(); el?.focus(); // the blur marks the field touched so every problem is listed
      setSt({ busy: false, err, done: null });
    };
    let tx = { value: "" };
    if (isWallet) {
      if (wallet < total) return jump("checkout-txn", `Your wallet balance (৳${wallet.toLocaleString()}) is not enough for this order.`);
    } else {
      tx = checkTxn(methodKind(method), f.get("txnId"), total);
      if (tx.status === "error" || tx.status === "empty") return jump("checkout-txn", tx.messages.find((m) => m.type === "error")?.text || "Please enter the payment Transaction ID.");
    }
    const nm = checkName(f.get("first"));
    if (nm.status !== "ok") return jump("checkout-first", nm.msg ? `First name: ${nm.msg}` : "Please enter your first name.");
    const ln = checkName(f.get("last"));
    if (ln.status === "error") return jump("checkout-last", `Last name: ${ln.msg}`);
    if (!user) {
      const pw = passwordInfo(f.get("password"));
      if (pw.error) return jump("checkout-password", `Password: ${pw.error}`);
      if (f.get("password") !== f.get("confirm")) return jump("checkout-confirm", "Passwords do not match.");
    }
    if (!user) {
      const em = checkEmail(f.get("email"));
      const ver = em.status === "error" || em.status === "empty" ? em : (await verifyEmailRemote(em.email)) || em;
      if (ver.status === "error" || ver.status === "empty") return jump("checkout-email", ver.messages.find((m) => m.type === "error")?.text || "Please enter your email address.");
    }
    const ph = checkPhone(f.get("cc"), f.get("phone"));
    if (ph.status === "error" || ph.status === "empty") return jump("checkout-phone", ph.messages.find((m) => m.type === "error")?.text || "Please enter your mobile phone number.");
    setSt({ busy: true, err: "", done: null });
    const r = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.items.map(toWanted),
        visitorId: getVisitorId(),
        name: `${f.get("first")} ${f.get("last")}`.trim(),
        email: f.get("email"),
        phone: ph.e164,
        method,
        txnId: tx.value,
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
        <p className="text-mist text-sm mt-4 leading-relaxed">
          {st.done.method === WALLET_METHOD
            ? "Paid instantly from your wallet balance. We're preparing your order now - you can follow its status in your Client Area."
            : <>We will verify your payment and send your access details {waCh ? "by email or WhatsApp" : "to your email"} shortly. You can follow the status in your Client Area.</>}
        </p>
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

        <Section
          n="1"
          title="Select payment method"
          done={!!method && (isWallet ? wallet >= total : !!valid.txn)}
          extra={<span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400"><ShieldCheck size={14} /> Manually verified payments</span>}
        >
          {options.length === 0 && !(user && wallet > 0) ? (
            <p className="text-sm text-mist">No payment options are configured yet. Please contact support.</p>
          ) : (
            <div className="space-y-3" role="radiogroup" aria-label="Payment method">
              {user && wallet > 0 && (
                <div className={`rounded-xl border transition-all ${isWallet ? "border-brand bg-brand/[0.06] shadow-[0_10px_30px_-18px_rgb(var(--brand))]" : "border-line hover:border-mist hover:bg-panel2/40"}`}>
                  <label className="flex cursor-pointer items-center gap-3 p-4">
                    <input type="radio" name="pm" value={WALLET_METHOD} checked={isWallet} onChange={() => setMethod(WALLET_METHOD)} className="peer sr-only" />
                    <span className={`w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand/50 ${isWallet ? "border-brand" : "border-mist/60"}`}>
                      {isWallet && <motion.span layoutId="pm-dot" className="w-2.5 h-2.5 rounded-full bg-brand" />}
                    </span>
                    <span className="w-9 h-9 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0"><Wallet size={16} /></span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-bold text-sm">Wallet Balance</span>
                      <span className="block text-xs text-mist mt-0.5">Instant - no Transaction ID needed</span>
                    </span>
                    <span className="shrink-0 text-sm font-bold text-brand">৳{wallet.toLocaleString()}</span>
                  </label>
                </div>
              )}
              {options.map((o) => {
                const on = method === o.name;
                const brand = METHOD_INFO[methodKind(o.name)].brand;
                return (
                  <div key={o.name} className={`rounded-xl border transition-all ${on ? "border-brand bg-brand/[0.06] shadow-[0_10px_30px_-18px_rgb(var(--brand))]" : "border-line hover:border-mist hover:bg-panel2/40"}`} style={on ? { borderColor: brand } : undefined}>
                    <label className="flex cursor-pointer items-center gap-3 p-4">
                      <input type="radio" name="pm" value={o.name} checked={on} onChange={() => setMethod(o.name)} className="peer sr-only" />
                      <span className={`w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand/50 ${on ? "border-brand" : "border-mist/60"}`} style={on ? { borderColor: brand } : undefined}>
                        {on && <motion.span layoutId="pm-dot" className="w-2.5 h-2.5 rounded-full" style={{ background: brand }} />}
                      </span>
                      <MethodBadge o={o} />
                      <span className="flex-1 min-w-0">
                        <span className="block font-bold text-sm">{o.name}</span>
                        {o.desc && <span className="block text-xs text-mist mt-0.5 truncate">{o.desc}</span>}
                      </span>
                      {on && <span className="hidden sm:inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white" style={{ background: brand }}><Check size={11} strokeWidth={3} /> Selected</span>}
                    </label>
                    <AnimatePresence initial={false}>
                      {on && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="px-4 pb-4 -mt-1"><PayGuide o={o} total={total} usd={usd} /></div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
          {isWallet ? (
            <div className={`mt-6 rounded-xl border p-4 flex items-center gap-3 ${wallet >= total ? "border-emerald-500/30 bg-emerald-500/[0.06]" : "border-red-500/30 bg-red-500/[0.06]"}`}>
              {wallet >= total ? <ShieldCheck size={18} className="text-emerald-400 shrink-0" /> : <AlertTriangle size={18} className="text-red-400 shrink-0" />}
              <p className="text-sm">
                {wallet >= total
                  ? <>Your wallet balance (<span className="font-semibold">৳{wallet.toLocaleString()}</span>) covers this order - it will be marked paid instantly.</>
                  : <>Your wallet balance (৳{wallet.toLocaleString()}) is not enough for this ৳{total.toLocaleString()} order. Top it up in your <a href="/account" className="underline font-semibold">Client Area</a> or choose another payment method.</>}
              </p>
            </div>
          ) : (
            <TxnField method={method} total={total} report={report} />
          )}
        </Section>

        <Section
          n="2"
          title="Account details"
          done={accDone === accKeys.length}
          extra={
            <div className="flex items-center gap-2.5 min-w-[150px]" aria-label={`${accDone} of ${accKeys.length} required fields completed`}>
              <div className="h-1.5 flex-1 rounded-full bg-line overflow-hidden">
                <motion.div className={`h-full rounded-full ${accDone === accKeys.length ? "bg-emerald-500" : "bg-brand"}`} initial={false} animate={{ width: `${(accDone / accKeys.length) * 100}%` }} transition={{ type: "spring", stiffness: 140, damping: 20 }} />
              </div>
              <span className={`text-xs font-bold tabular-nums ${accDone === accKeys.length ? "text-emerald-400" : "text-mist"}`}>{accDone}/{accKeys.length}</span>
            </div>
          }
        >
          {user ? (
            <p className="flex items-center gap-2 text-sm rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 mb-5"><CheckCircle2 size={16} /> Signed in as <b>{user.email}</b></p>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-line bg-gradient-to-r from-brand/10 via-panel2 to-panel2 px-4 py-3.5 mb-5">
              <span className="w-9 h-9 shrink-0 rounded-full bg-brand/15 text-brand flex items-center justify-center"><UserPlus size={17} /></span>
              <p className="flex-1 text-sm text-mist leading-snug"><b className="text-fg">New here?</b> Fill in the details below - your account is created automatically with your order.</p>
              <Link href="/login?next=/checkout" className="btn-ghost !py-2 text-xs shrink-0 justify-center"><LogIn size={14} /> Have an account? Log in</Link>
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-x-4 gap-y-5">
            <NameField name="first" label="First name" required initial={first} report={report} />
            <NameField name="last" label="Last name" initial={restName.join(" ")} />
            <EmailField initial={user?.email || ""} locked={!!user} report={report} />
            <PhoneField initial={user?.phone || ""} report={report} />
            {!user && <PasswordFields report={report} />}
            <Field label={<>Note <span className="font-normal text-mist text-xs">(optional)</span></>} icon={StickyNote} iconTop className="sm:col-span-2">
              <textarea name="note" rows={2} placeholder="Anything we should know about your order?" className="input input-glow !pl-10 resize-y" />
            </Field>
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
        <div className="relative overflow-hidden rounded-2xl border border-line bg-panel shadow-[0_24px_60px_-40px_rgb(var(--brand))]">
          <div className="h-1 bg-gradient-to-r from-brand via-brand-light to-brand" aria-hidden />
          <div className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="font-display font-bold text-lg flex items-center gap-2"><ShoppingBag size={18} className="text-brand" /> Order summary</h2>
              <span className="rounded-full bg-brand/15 text-brand-light text-[11px] font-bold px-2.5 py-1">{cart.items.length} item{cart.items.length > 1 ? "s" : ""}</span>
            </div>

            <ul className="space-y-2.5">
              <AnimatePresence initial={false}>
                {cart.items.map((x) => (
                  <motion.li key={x.type + x.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="flex items-center gap-3 rounded-xl border border-line bg-panel2/40 p-2.5 pr-3 transition-colors hover:border-mist/50">
                      <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 ring-1 ring-line"><ToolCover tool={{ name: x.name, image: x.image, accent: x.accent }} small /></div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm truncate">{x.name}</p>
                        {x.per && <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 text-[10px] font-semibold"><Clock size={10} /> Access {x.per.replace("/", "for ")}</span>}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold tabular-nums">৳{x.price.toLocaleString()}</p>
                        <button type="button" onClick={() => cart.remove(x.type, x.id)} aria-label={`Remove ${x.name}`} className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-mist hover:text-red-400"><Trash2 size={11} /> Remove</button>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>

            <div className="mt-4">
              {applied ? (
                <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-emerald-500/50 bg-emerald-500/10 px-3 py-2.5">
                  <span className="w-8 h-8 shrink-0 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center"><Tag size={15} /></span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-emerald-300 font-mono tracking-wider">{applied.code}</p>
                    <p className="text-[11px] text-emerald-400/80">{applied.label} applied</p>
                  </div>
                  <button type="button" onClick={() => { setApplied(null); setCoupon(""); }} aria-label="Remove coupon" className="p-1.5 rounded-md text-mist hover:text-red-400 hover:bg-panel"><X size={15} /></button>
                </div>
              ) : (
                <>
                  <label htmlFor="checkout-coupon" className="flex items-center gap-1.5 text-xs font-semibold text-mist mb-2"><Tag size={13} /> Have a coupon?</label>
                  <div className="flex gap-2">
                    <div className="group relative flex-1">
                      <Ticket size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mist pointer-events-none transition-colors group-focus-within:text-brand z-[1]" />
                      <input id="checkout-coupon" value={coupon} onChange={(e) => setCoupon(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyCoupon())} placeholder="Enter code" className={`input input-glow !pl-9 uppercase font-mono tracking-wider ${cState.err ? "!border-red-500" : ""}`} />
                    </div>
                    <button type="button" onClick={applyCoupon} disabled={cState.busy || !coupon.trim()} className="btn-ghost shrink-0 disabled:opacity-50">{cState.busy ? <Loader2 size={14} className="animate-spin" /> : "Apply"}</button>
                  </div>
                  {cState.err && <p className="text-xs text-red-400 mt-2 flex items-center gap-1.5"><XCircle size={13} /> {cState.err}</p>}
                </>
              )}
            </div>

            <dl className="mt-5 space-y-2.5 text-sm">
              <div className="flex justify-between text-mist"><dt>Subtotal</dt><dd className="tabular-nums">৳{subtotal.toLocaleString()}</dd></div>
              {applied && <div className="flex justify-between text-emerald-400"><dt>Discount</dt><dd className="tabular-nums">-৳{applied.discount.toLocaleString()}</dd></div>}
              {method && (
                <div className="flex items-center justify-between text-mist">
                  <dt>Payment</dt>
                  <dd className="inline-flex items-center gap-1.5 font-semibold text-fg"><span className="w-2 h-2 rounded-full" style={{ background: METHOD_INFO[methodKind(method)].brand }} />{method}</dd>
                </div>
              )}
            </dl>
            <div className="mt-4 rounded-xl bg-gradient-to-br from-brand/15 via-brand/5 to-transparent border border-brand/25 px-4 py-3.5">
              <div className="flex items-end justify-between gap-3">
                <span className="font-display font-bold text-base">Total</span>
                <span className="text-right">
                  {applied && <span className="block text-xs text-mist line-through tabular-nums">৳{subtotal.toLocaleString()}</span>}
                  <span className="font-display font-bold text-3xl text-brand leading-none tabular-nums">৳{total.toLocaleString()}</span>
                </span>
              </div>
              {(applied || usdTotal) && (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  {applied ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-400 px-2 py-0.5 text-[11px] font-bold"><Sparkles size={11} /> You save ৳{applied.discount.toLocaleString()}</span> : <span />}
                  {usdTotal && <span className="text-xs font-semibold text-emerald-300 tabular-nums">≈ ${usdTotal.toFixed(2)} {usd.currency}</span>}
                </div>
              )}
            </div>

            <ul className="mt-5 space-y-2" aria-label="Order checklist">
              {checklist.map(([ok, text, target]) => (
                <li key={text}>
                  <button type="button" onClick={() => document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "center" })} className={`w-full flex items-center gap-2 text-xs text-left transition-colors ${ok ? "text-emerald-400" : "text-mist hover:text-fg"}`}>
                    {ok ? <CheckCircle2 size={15} /> : <span className="w-[15px] h-[15px] rounded-full border-2 border-current opacity-60" />}
                    <span>{text}</span>
                  </button>
                </li>
              ))}
            </ul>

            <label key={nudge} htmlFor="checkout-agree" className={`mt-4 flex items-start gap-3 rounded-xl border px-3 py-3 text-xs cursor-pointer transition-colors ${agree ? "border-emerald-500/40 bg-emerald-500/5 text-fg/90" : nudge ? "nudge-shake border-red-500 bg-red-500/10 text-fg/90" : "border-line text-mist hover:border-mist/60"}`}>
              <input id="checkout-agree" type="checkbox" name="agree" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="peer sr-only" />
              <span className={`mt-px w-[18px] h-[18px] shrink-0 rounded-md border-2 flex items-center justify-center transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand/50 ${agree ? "bg-emerald-500 border-emerald-500 text-white" : nudge ? "border-red-500" : "border-mist/60"}`}>{agree && <Check size={12} strokeWidth={3.5} />}</span>
              <span>I have read and agree to the <Link href="/terms" target="_blank" className="text-brand underline">Usage Terms</Link> and <Link href="/refund" target="_blank" className="text-brand underline">Refund Policy</Link>.</span>
            </label>
            {!agree && nudge > 0 && <p className="mt-2 text-xs text-red-400 flex items-center gap-1.5"><AlertTriangle size={13} /> Please tick the box to accept the terms before placing your order.</p>}

            {st.err && <p className="flex items-start gap-2 text-sm text-red-400 mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5"><XCircle size={16} className="shrink-0 mt-0.5" /> {st.err}</p>}
            {/* Looks disabled until the terms are ticked, but stays clickable so a press can point at the checkbox. */}
            <button
              disabled={st.busy || !options.length}
              aria-disabled={!agree}
              onClick={(e) => {
                if (agree) return;
                e.preventDefault();
                setNudge((n) => n + 1);
                document.getElementById("checkout-agree")?.closest("label")?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              className={`btn-primary w-full justify-center py-4 mt-5 text-base font-bold rounded-xl transition-all ${agree ? "bg-gradient-to-r from-brand to-brand-light hover:brightness-110 shadow-[0_14px_32px_-14px_rgb(var(--brand))]" : "!bg-panel2 !text-mist border border-line cursor-not-allowed shadow-none"}`}
            >
              {st.busy ? <><Loader2 size={18} className="animate-spin" /> Placing order...</> : <><Lock size={17} /> Place order · ৳{total.toLocaleString()} {agree && <ArrowRight size={17} />}</>}
            </button>
            {left > 0 && <p className="text-center text-[11px] text-mist mt-2">{left} step{left > 1 ? "s" : ""} left - tap an item above to jump to it</p>}

            <div className="mt-5 pt-4 border-t border-line grid grid-cols-3 gap-2 text-center">
              {[[ShieldCheck, "Refund if access fails"], [BadgeCheck, "Payment verified manually"], [Headphones, waCh ? "WhatsApp support" : "Email support"]].map(([Icon, t]) => (
                <div key={t} className="flex flex-col items-center gap-1.5 text-[10px] leading-tight text-mist">
                  <span className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center"><Icon size={15} /></span>{t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </form>
  );
}
