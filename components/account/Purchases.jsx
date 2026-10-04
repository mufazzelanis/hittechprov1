"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, CreditCard, Clock, CheckCircle2, ClipboardList, Loader2, Pencil, Send, PackageCheck, ExternalLink, LayoutTemplate, Briefcase } from "lucide-react";
import { fmtSize, fmtUsd } from "@/lib/catalog";

const STATUS = {
  PENDING: "bg-amber-500/15 text-amber-300",
  PAID: "bg-sky-500/15 text-sky-300",
  IN_PROGRESS: "bg-indigo-500/15 text-indigo-300",
  COMPLETED: "bg-teal-500/15 text-teal-300",
  DELIVERED: "bg-emerald-500/15 text-emerald-300",
  REFUNDED: "bg-purple-500/15 text-purple-300",
  CANCELLED: "bg-zinc-500/20 text-zinc-300",
};

// Plain text with any https:// links made clickable (no HTML is ever injected).
function Linkify({ text }) {
  const parts = String(text || "").split(/(https?:\/\/[^\s<]+)/g);
  return parts.map((p, i) => (/^https?:\/\//.test(p)
    ? <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="text-brand underline break-all">{p}</a>
    : <span key={i}>{p}</span>));
}

function FileList({ orderId, files }) {
  if (!files.length) return null;
  return (
    <ul className="rounded-xl border border-line divide-y divide-line bg-ink/40">
      {files.map((f) => (
        <li key={f.id}>
          <a href={`/api/downloads/${orderId}/${f.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-panel2/60 transition-colors">
            <span className="w-8 h-8 rounded-lg bg-brand/15 text-brand flex items-center justify-center shrink-0"><Download size={15} /></span>
            <span className="flex-1 min-w-0 text-sm font-medium truncate">{f.name}</span>
            <span className="text-xs text-mist shrink-0">{fmtSize(f.size)}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

function BriefForm({ order, questions, initial }) {
  const router = useRouter();
  const [editing, setEditing] = useState(!initial);
  const [answers, setAnswers] = useState(questions.map(() => ""));
  const [extra, setExtra] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function send(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const r = await fetch(`/api/account/orders/${order.id}/brief`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: questions.map((q, i) => ({ q, a: answers[i] })), extra }),
    });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setErr(j.error || "Could not send");
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] p-4">
        <div className="flex items-center justify-between gap-3 mb-2">
          <p className="text-sm font-semibold text-emerald-300 flex items-center gap-1.5"><CheckCircle2 size={15} /> Brief received - we're on it</p>
          <button type="button" onClick={() => setEditing(true)} className="text-xs text-mist hover:text-fg inline-flex items-center gap-1"><Pencil size={12} /> Edit</button>
        </div>
        <p className="text-sm text-fg/80 whitespace-pre-wrap">{initial}</p>
      </div>
    );
  }
  return (
    <form onSubmit={send} className="rounded-xl border border-brand/30 bg-brand/[0.05] p-4 space-y-3">
      <p className="text-sm font-semibold flex items-center gap-1.5"><ClipboardList size={15} className="text-brand" /> Tell us what you need</p>
      {questions.map((q, i) => (
        <label key={i} className="block">
          <span className="block text-xs text-mist mb-1">{q}</span>
          <textarea rows={2} value={answers[i]} onChange={(e) => setAnswers((a) => a.map((x, j) => (j === i ? e.target.value : x)))} className="input" />
        </label>
      ))}
      <label className="block">
        <span className="block text-xs text-mist mb-1">{questions.length ? "Anything else? (links to examples, brand colours, deadlines...)" : "Describe what you need - links to examples, brand colours, text, deadlines..."}</span>
        <textarea rows={questions.length ? 2 : 4} value={extra} onChange={(e) => setExtra(e.target.value)} className="input" />
      </label>
      {err && <p className="text-xs text-red-400">{err}</p>}
      <div className="flex justify-end gap-2">
        {initial && <button type="button" className="btn-ghost !py-2 text-xs" onClick={() => setEditing(false)}>Cancel</button>}
        <button disabled={busy} className="btn-primary !py-2 text-xs">{busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Send brief</button>
      </div>
    </form>
  );
}

export default function Purchases({ orders }) {
  if (!orders.length) return null;
  return (
    <section>
      <h2 className="font-display font-semibold text-xl mb-4">My purchases</h2>
      <div className="space-y-4">
        {orders.map((o) => {
          const pending = o.status === "PENDING";
          const dead = o.status === "CANCELLED" || o.status === "REFUNDED";
          return (
            <article key={o.id} className="rounded-2xl border border-line bg-panel p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-mist">Order #{o.number} · {o.date}</p>
                  <h3 className="font-display font-semibold text-lg mt-0.5">{o.itemName}</h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{o.usdAmount ? fmtUsd(o.usdAmount) : `৳${o.amount.toLocaleString()}`}</span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS[o.status]}`}>{o.status.split("_").join(" ")}</span>
                </div>
              </div>

              {pending && (
                o.payoneer ? (
                  o.payLink ? (
                    <div className="mt-4 rounded-xl border border-sky-500/30 bg-sky-500/[0.07] p-4 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm">Your secure payment link is ready. Pay by card, bank transfer or Payoneer balance.</p>
                      <a href={o.payLink} target="_blank" rel="noopener noreferrer" className="btn-primary"><CreditCard size={15} /> Pay {fmtUsd(o.usdAmount)} with Payoneer</a>
                    </div>
                  ) : (
                    <p className="mt-4 rounded-xl border border-line bg-panel2/40 p-4 text-sm text-mist flex items-start gap-2"><Clock size={15} className="shrink-0 mt-0.5 text-amber-300" /> We're preparing your secure Payoneer payment link for <b className="text-fg">{fmtUsd(o.usdAmount)}</b>. It will arrive by email and appear here, usually within a few hours.</p>
                  )
                ) : (
                  <p className="mt-4 rounded-xl border border-line bg-panel2/40 p-4 text-sm text-mist flex items-start gap-2"><Clock size={15} className="shrink-0 mt-0.5 text-amber-300" /> We're confirming your payment. Your files and next steps appear here as soon as it's verified.</p>
                )
              )}

              {o.paid && (
                <div className="mt-5 space-y-5">
                  {o.products.map((p) => (
                    <div key={p.id} className="space-y-3">
                      <p className="text-sm font-semibold flex items-center gap-2"><LayoutTemplate size={15} className="text-brand" /> {p.name}
                        {p.slug && <a href={`/templates/${p.slug}`} className="text-mist hover:text-fg"><ExternalLink size={12} /></a>}</p>
                      <FileList orderId={o.id} files={p.files} />
                      {p.deliveryText && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] p-4 text-sm whitespace-pre-wrap leading-relaxed"><Linkify text={p.deliveryText} /></div>}
                      {!p.files.length && !p.deliveryText && <p className="text-sm text-mist">Your files are being prepared - we'll email you when they're ready.</p>}
                    </div>
                  ))}

                  {o.services.map((s) => (
                    <div key={s.id} className="space-y-3">
                      <p className="text-sm font-semibold flex items-center gap-2"><Briefcase size={15} className="text-brand" /> {s.name}</p>
                      {!["COMPLETED", "DELIVERED"].includes(o.status) && <BriefForm order={o} questions={s.questions} initial={o.brief} />}
                    </div>
                  ))}

                  {(o.deliveryNote || o.delivery.length > 0) && (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold flex items-center gap-2"><PackageCheck size={15} className="text-emerald-400" /> Your delivery</p>
                      {o.deliveryNote && <div className="rounded-xl border border-line bg-ink/40 p-4 text-sm whitespace-pre-wrap leading-relaxed"><Linkify text={o.deliveryNote} /></div>}
                      <FileList orderId={o.id} files={o.delivery} />
                    </div>
                  )}
                </div>
              )}
              {dead && <p className="mt-4 text-sm text-mist">This order was {o.status.toLowerCase()}.</p>}
            </article>
          );
        })}
      </div>
    </section>
  );
}
