"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, LogOut, Loader2 } from "lucide-react";
import { navStart } from "@/components/LoadingSystem";

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
