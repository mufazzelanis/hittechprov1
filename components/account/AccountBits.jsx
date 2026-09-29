"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, Check, LogOut, Loader2, Wallet, Plus, X } from "lucide-react";
import { navStart } from "@/components/LoadingSystem";

const TOPUP_STATUS_STYLE = { PENDING: "bg-amber-500/15 text-amber-300", APPROVED: "bg-emerald-500/15 text-emerald-300", REJECTED: "bg-red-500/15 text-red-300" };

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        navStart();
        router.replace("/login");
        router.refresh();
      }}
      className="btn-ghost"
    >
      <LogOut size={15} /> Sign out
    </button>
  );
}

export function CopyLink({ code }) {
  const [copied, setCopied] = useState(false);
  const link = typeof window !== "undefined" ? `${window.location.origin}/?ref=${code}` : `/?ref=${code}`;
  return (
    <div className="flex gap-2">
      <input readOnly value={link} onFocus={(e) => e.target.select()} className="input" />
      <button
        onClick={() => {
          navigator.clipboard?.writeText(link);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        }}
        className="btn-primary shrink-0"
      >
        {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

export function PayoutForm({ balance, min, methods }) {
  const router = useRouter();
  const [st, setSt] = useState({ busy: false, msg: "", ok: false });
  const can = balance >= min;

  async function submit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    setSt({ busy: true, msg: "", ok: false });
    const r = await fetch("/api/account/payout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok) {
      form.reset();
      setSt({ busy: false, msg: "Payout requested. We will process it soon.", ok: true });
      router.refresh();
    } else setSt({ busy: false, msg: j.error || "Failed", ok: false });
  }

  return (
    <form onSubmit={submit} className="grid sm:grid-cols-4 gap-3 items-start">
      <input name="amount" type="number" min={min} max={balance} required disabled={!can} placeholder={`Amount (min ৳${min})`} className="input" />
      <select name="method" required disabled={!can} defaultValue="" className="input">
        <option value="" disabled>Method</option>
        {methods.map((m) => <option key={m}>{m}</option>)}
      </select>
      <input name="account" required disabled={!can} placeholder="Account number" className="input" />
      <button disabled={!can || st.busy} className="btn-primary justify-center">
        {st.busy && <Loader2 size={15} className="animate-spin" />} Request payout
      </button>
      {!can && <p className="sm:col-span-4 text-xs text-mist">You can request a payout once your available balance reaches ৳{min}.</p>}
      {st.msg && <p className={`sm:col-span-4 text-sm ${st.ok ? "text-emerald-400" : "text-red-400"}`}>{st.msg}</p>}
    </form>
  );
}

// Balance is spendable straight from checkout ("Wallet Balance" payment method) - top it up once here
// with a normal bKash/Nagad/etc. payment, verified manually by an admin exactly like an order's payment,
// then place any number of orders afterwards without re-entering payment details each time.
export function WalletCard({ balance, methods, topups }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [st, setSt] = useState({ busy: false, msg: "", ok: false });

  async function submit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    setSt({ busy: true, msg: "", ok: false });
    const r = await fetch("/api/wallet/topup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok) {
      form.reset();
      setSt({ busy: false, msg: "Topup requested. Once approved, it lands in your balance.", ok: true });
      router.refresh();
    } else setSt({ busy: false, msg: j.error || "Failed", ok: false });
  }

  return (
    <div className="rounded-2xl border border-line bg-panel p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0"><Wallet size={19} /></span>
          <div>
            <p className="text-xs text-mist">Wallet balance</p>
            <p className="font-display font-bold text-2xl">৳{balance.toLocaleString()}</p>
          </div>
        </div>
        <motion.button type="button" onClick={() => setOpen((o) => !o)} whileTap={{ scale: 0.96 }} className="btn-primary !py-2 overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={open ? "close" : "add"}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="inline-flex items-center gap-2"
            >
              {open ? <X size={15} /> : <Plus size={15} />} {open ? "Close" : "Add Fund"}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <form onSubmit={submit} className="grid sm:grid-cols-4 gap-3 items-start border-t border-line pt-5">
              <input name="amount" type="number" min={50} required placeholder="Amount (৳)" className="input" />
              <select name="method" required defaultValue="" className="input">
                <option value="" disabled>Method</option>
                {methods.map((m) => <option key={m}>{m}</option>)}
              </select>
              <input name="txnId" required placeholder="Transaction ID" className="input" />
              <button disabled={st.busy} className="btn-primary justify-center">
                {st.busy && <Loader2 size={15} className="animate-spin" />} Submit
              </button>
              {st.msg && <p className={`sm:col-span-4 text-sm ${st.ok ? "text-emerald-400" : "text-red-400"}`}>{st.msg}</p>}
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {topups.length > 0 && (
        <div className="border-t border-line pt-4">
          <p className="text-xs font-semibold text-mist uppercase tracking-wide mb-2">Topup history</p>
          <div className="space-y-1.5">
            {topups.map((t) => (
              <div key={t.id} className="flex items-center justify-between text-sm py-1">
                <span className="text-mist">{new Date(t.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} · {t.method}</span>
                <span className="flex items-center gap-2">
                  <span className="font-semibold">৳{t.amount.toLocaleString()}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${TOPUP_STATUS_STYLE[t.status]}`}>{t.status}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
