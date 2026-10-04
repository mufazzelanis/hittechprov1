"use client";

import { useEffect, useState } from "react";
import {
  X, Copy, Check, Mail, Phone, MessageCircle, Loader2, Send, StickyNote, ArrowRightLeft,
  PackageCheck, Clock, User, ShoppingBag, ExternalLink, Share2, RefreshCcw, Rocket, Link2,
  CreditCard, ClipboardList, Upload, FileDown, Trash2,
} from "lucide-react";
import { PAYONEER_METHOD, parseFiles, parseJson, fmtSize, fmtUsd } from "@/lib/catalog";

const LINE_LABEL = { product: "Template", service: "Service", tool: "Tool", bundle: "Bundle", plan: "Pack", smm: "SMM" };

// Payoneer payment link: paste it, it's saved on the order and emailed to the buyer.
function PayLinkBox({ order, onDone }) {
  const [url, setUrl] = useState(order.payLink || "");
  const [saved, setSaved] = useState(order.payLink || "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  async function save() {
    setBusy(true);
    setMsg(null);
    const r = await fetch(`/api/admin/orders/${order.id}/paylink`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setMsg({ err: true, text: j.error || "Could not save" });
    setSaved(j.payLink);
    setMsg({ text: j.emailed ? `Saved and emailed to ${order.email}` : "Saved. Email not sent (SMTP not configured) - the buyer still sees the Pay button in their Client Area." });
    onDone?.();
  }
  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-wide text-mist mb-2 flex items-center gap-1.5"><CreditCard size={12} /> Payoneer payment</p>
      <div className="rounded-xl border border-sky-500/30 bg-sky-500/[0.05] p-4 space-y-3">
        {order.usdAmount ? (
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm">Request exactly</span>
            <span className="flex items-center gap-1 font-display text-xl font-bold text-sky-300">{fmtUsd(order.usdAmount.toFixed(2))} USD<CopyBtn value={order.usdAmount.toFixed(2)} /></span>
          </div>
        ) : null}
        <ol className="text-[11px] text-mist space-y-0.5 list-decimal pl-4">
          <li>Payoneer → <b className="text-fg">Get Paid → Request a payment</b>, for the amount above, to <b className="text-fg">{order.email}</b></li>
          <li>Copy the payment request link and paste it here</li>
          <li>When the money arrives, set the status to <b className="text-fg">PAID</b> - downloads unlock automatically</li>
        </ol>
        <div className="flex gap-2">
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…payoneer.com/…" className="input !py-2 text-sm" />
          <button type="button" disabled={busy || !url.trim() || url.trim() === saved} onClick={save} className="btn-primary !py-2 !px-3 text-xs shrink-0">
            {busy ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} {saved ? "Update & email" : "Save & email"}
          </button>
        </div>
        {saved && <a href={saved} target="_blank" rel="noreferrer" className="text-[11px] text-sky-300 hover:underline inline-flex items-center gap-1 break-all"><Link2 size={11} /> Current link: {saved}</a>}
        {msg && <p className={`text-xs ${msg.err ? "text-red-400" : "text-emerald-400"}`}>{msg.text}</p>}
      </div>
    </section>
  );
}

// Finished work for a service order: uploaded here, downloaded by the buyer in their Client Area.
function DeliveryFiles({ order, onDone }) {
  const [files, setFiles] = useState(parseFiles(order.deliveryFiles));
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  async function add(list) {
    setErr("");
    for (const f of Array.from(list || [])) {
      setBusy(f.name);
      const fd = new FormData();
      fd.append("file", f);
      const r = await fetch(`/api/admin/orders/${order.id}/files`, { method: "POST", body: fd });
      const j = await r.json().catch(() => ({}));
      if (r.ok) setFiles(j.files); else setErr(j.error || "Upload failed");
    }
    setBusy("");
    onDone?.();
  }
  async function remove(id) {
    const r = await fetch(`/api/admin/orders/${order.id}/files?fileId=${encodeURIComponent(id)}`, { method: "DELETE" });
    const j = await r.json().catch(() => ({}));
    if (r.ok) setFiles(j.files);
    onDone?.();
  }
  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-wide text-mist mb-2 flex items-center gap-1.5"><FileDown size={12} /> Delivery files</p>
      <div className="space-y-2">
        {files.length > 0 && (
          <ul className="rounded-xl border border-line divide-y divide-line">
            {files.map((f) => (
              <li key={f.id} className="flex items-center gap-3 px-3 py-2">
                <FileDown size={14} className="text-brand shrink-0" />
                <a href={`/api/downloads/${order.id}/${f.id}`} className="flex-1 min-w-0 text-sm truncate hover:underline">{f.name}</a>
                <span className="text-[11px] text-mist shrink-0">{fmtSize(f.size)}</span>
                <button type="button" onClick={() => remove(f.id)} aria-label={`Remove ${f.name}`} className="p-1 text-mist hover:text-red-400"><Trash2 size={13} /></button>
              </li>
            ))}
          </ul>
        )}
        <label className={`flex items-center justify-center gap-2 rounded-xl border border-dashed border-line px-4 py-3.5 text-sm text-mist cursor-pointer hover:border-brand hover:text-fg ${busy ? "pointer-events-none opacity-70" : ""}`}>
          {busy ? <><Loader2 size={14} className="animate-spin" /> Uploading {busy}…</> : <><Upload size={14} /> Upload finished files</>}
          <input type="file" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
        </label>
        <p className="text-[11px] text-mist">The buyer downloads these from their Client Area once the order is paid. Then use "Email customer" below to let them know.</p>
        {err && <p className="text-xs text-red-400">{err}</p>}
      </div>
    </section>
  );
}

const SMM_STATUS_STYLE = {
  Pending: "bg-amber-500/15 text-amber-300",
  "In progress": "bg-sky-500/15 text-sky-300",
  Processing: "bg-sky-500/15 text-sky-300",
  Completed: "bg-emerald-500/15 text-emerald-300",
  Partial: "bg-orange-500/15 text-orange-300",
  Canceled: "bg-zinc-500/20 text-zinc-300",
  Cancelled: "bg-zinc-500/20 text-zinc-300",
  "Not sent": "bg-zinc-500/20 text-zinc-300",
};

const STATUS_STYLE = {
  PENDING: "bg-amber-500/15 text-amber-300",
  PAID: "bg-sky-500/15 text-sky-300",
  IN_PROGRESS: "bg-indigo-500/15 text-indigo-300",
  COMPLETED: "bg-teal-500/15 text-teal-300",
  DELIVERED: "bg-emerald-500/15 text-emerald-300",
  REFUNDED: "bg-purple-500/15 text-purple-300",
  CANCELLED: "bg-zinc-500/20 text-zinc-300",
};
const STATUSES = ["PENDING", "PAID", "IN_PROGRESS", "COMPLETED", "DELIVERED", "REFUNDED", "CANCELLED"];
const EVENT_ICON = { status: ArrowRightLeft, note: StickyNote, delivery: PackageCheck };

const fmtDate = (d) => new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const timeAgo = (iso) => {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); if (d < 30) return `${d}d ago`;
  return fmtDate(iso);
};
const digits = (v) => String(v || "").replace(/\D/g, "");

function CopyBtn({ value }) {
  const [done, setDone] = useState(false);
  if (!value) return null;
  return (
    <button
      type="button"
      onClick={() => { navigator.clipboard?.writeText(String(value)); setDone(true); setTimeout(() => setDone(false), 1400); }}
      aria-label="Copy"
      className="p-1.5 text-mist hover:text-fg shrink-0"
    >
      {done ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
    </button>
  );
}

function Row({ label, value, copy, action }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-line/60 last:border-0">
      <span className="text-xs text-mist shrink-0 pt-0.5">{label}</span>
      <span className="flex items-center gap-1 min-w-0 text-right">
        <span className="text-sm break-words">{value}</span>
        {action}
        {copy && <CopyBtn value={value} />}
      </span>
    </div>
  );
}

export default function OrderDetail({ order, readOnly = false, onClose, onSaved }) {
  const [status, setStatus] = useState(order.status);
  const [statusBusy, setStatusBusy] = useState(false);
  const [events, setEvents] = useState(null);
  const [note, setNote] = useState("");
  const [noteBusy, setNoteBusy] = useState(false);
  const [deliverMsg, setDeliverMsg] = useState("");
  const [markDelivered, setMarkDelivered] = useState(order.status !== "DELIVERED");
  const [deliverBusy, setDeliverBusy] = useState(false);
  const [deliverDone, setDeliverDone] = useState(false);
  const [err, setErr] = useState("");
  const [smm, setSmm] = useState(order.smmOrder || null);
  const [smmBusy, setSmmBusy] = useState(false);
  const [smmErr, setSmmErr] = useState("");

  const loadEvents = () => fetch(`/api/admin/orders/${order.id}/events`).then((r) => r.json()).then((j) => setEvents(j.rows || []));
  useEffect(() => { loadEvents(); }, [order.id]);

  async function changeStatus(next) {
    setStatus(next);
    setStatusBusy(true);
    const r = await fetch(`/api/admin/orders/${order.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) });
    setStatusBusy(false);
    if (r.ok) { loadEvents(); onSaved?.(); } else setStatus(order.status);
  }

  async function addNote() {
    if (!note.trim()) return;
    setNoteBusy(true);
    const r = await fetch(`/api/admin/orders/${order.id}/events`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: note }) });
    setNoteBusy(false);
    if (r.ok) { setNote(""); loadEvents(); }
  }

  async function sendDelivery() {
    if (!deliverMsg.trim()) return;
    setDeliverBusy(true);
    setErr("");
    const r = await fetch(`/api/admin/orders/${order.id}/deliver`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: deliverMsg, markDelivered }) });
    const j = await r.json().catch(() => ({}));
    setDeliverBusy(false);
    if (!r.ok) return setErr(j.error || "Could not send");
    setDeliverMsg("");
    setDeliverDone(true);
    setTimeout(() => setDeliverDone(false), 2500);
    if (markDelivered) setStatus("DELIVERED");
    loadEvents();
    onSaved?.();
  }

  async function sendToProvider() {
    setSmmBusy(true);
    setSmmErr("");
    const r = await fetch(`/api/admin/orders/${order.id}/smm-send`, { method: "POST" });
    const j = await r.json().catch(() => ({}));
    setSmmBusy(false);
    if (!r.ok) return setSmmErr(j.error || "Could not send to SMMIU");
    setSmm((v) => ({ ...v, providerOrderId: j.providerOrderId, providerStatus: "Pending" }));
    loadEvents();
  }

  async function syncStatus() {
    setSmmBusy(true);
    setSmmErr("");
    const r = await fetch(`/api/admin/orders/${order.id}/smm-sync`, { method: "POST" });
    const j = await r.json().catch(() => ({}));
    setSmmBusy(false);
    if (!r.ok) return setSmmErr(j.error || "Could not sync status");
    setSmm(j.smmOrder);
    if (j.orderStatus && j.orderStatus !== status) { setStatus(j.orderStatus); loadEvents(); onSaved?.(); }
  }

  const wa = digits(order.phone) ? `https://wa.me/${digits(order.phone)}` : null;
  const lineItems = (() => { const l = parseJson(order.lines, []); return Array.isArray(l) ? l : []; })();
  const hasService = lineItems.some((l) => l.type === "service");

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button className="flex-1 bg-black/60" onClick={onClose} aria-label="Close" />
      <div className="w-full max-w-lg bg-panel border-l border-line flex flex-col">
        <div className="flex items-center justify-between px-6 h-16 border-b border-line shrink-0">
          <h2 className="font-display font-semibold flex items-center gap-2">
            Order #{order.number}
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[status]}`}>{status}</span>
          </h2>
          <button type="button" onClick={onClose} className="text-mist hover:text-fg"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-mist shrink-0">Status</label>
            <select
              value={status} disabled={statusBusy || readOnly} onChange={(e) => changeStatus(e.target.value)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold border-0 outline-none cursor-pointer ${STATUS_STYLE[status]}`}
            >
              {STATUSES.map((s) => <option key={s} value={s} className="bg-panel text-fg">{s.split("_").join(" ")}</option>)}
            </select>
            {statusBusy && <Loader2 size={15} className="animate-spin text-mist" />}
          </div>

          {/* Customer */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-wide text-mist mb-2 flex items-center gap-1.5"><User size={12} /> Customer</p>
            <div className="rounded-xl border border-line px-4">
              <Row label="Name" value={order.name} />
              <Row label="Email" value={order.email} copy action={<a href={`mailto:${order.email}`} className="p-1.5 text-mist hover:text-brand"><Mail size={13} /></a>} />
              <Row label="Phone" value={order.phone} copy action={<>
                {order.phone && <a href={`tel:${order.phone}`} className="p-1.5 text-mist hover:text-brand"><Phone size={13} /></a>}
                {wa && <a href={wa} target="_blank" rel="noreferrer" className="p-1.5 text-mist hover:text-emerald-400"><MessageCircle size={13} /></a>}
              </>} />
              {order.email && (
                <div className="flex items-center justify-between gap-3 py-2">
                  <span className="text-xs text-mist">This customer's other orders</span>
                  <a href={`/admin/orders?q=${encodeURIComponent(order.email)}`} className="text-brand hover:underline inline-flex items-center gap-1 text-sm shrink-0">See all <ExternalLink size={11} /></a>
                </div>
              )}
            </div>
          </section>

          {/* Order */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-wide text-mist mb-2 flex items-center gap-1.5"><ShoppingBag size={12} /> Order</p>
            <div className="rounded-xl border border-line px-4">
              <Row label="Item" value={order.itemName} />
              <Row label="Source" value={order.itemType === "manual" ? "Manual" : "Website"} />
              <Row label="Amount" value={`৳${Number(order.amount).toLocaleString()}`} />
              <Row label="Amount (USD)" value={order.usdAmount ? `$${order.usdAmount.toFixed(2)}` : null} copy />
              <Row label="Method" value={order.method} />
              <Row label="Transaction ID" value={order.txnId} copy />
              <Row label="Referred by" value={order.refCode} copy />
              <Row label="Commission" value={order.commission ? `৳${order.commission}` : null} />
              <Row label="Placed" value={fmtDate(order.createdAt)} />
            </div>
          </section>

          {lineItems.length > 1 && (
            <section>
              <p className="text-xs font-semibold uppercase tracking-wide text-mist mb-2 flex items-center gap-1.5"><ShoppingBag size={12} /> Items</p>
              <ul className="rounded-xl border border-line divide-y divide-line/60">
                {lineItems.map((l, i) => (
                  <li key={i} className="flex items-center gap-3 px-4 py-2 text-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 bg-panel2 text-mist shrink-0">{LINE_LABEL[l.type] || l.type}</span>
                    <span className="flex-1 min-w-0 truncate">{l.name}</span>
                    <span className="text-mist shrink-0">৳{Number(l.price).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!readOnly && (order.method === PAYONEER_METHOD || order.payLink) && <PayLinkBox order={order} onDone={() => { loadEvents(); onSaved?.(); }} />}

          {hasService && (
            <section>
              <p className="text-xs font-semibold uppercase tracking-wide text-mist mb-2 flex items-center gap-1.5"><ClipboardList size={12} /> Buyer's brief</p>
              {order.brief
                ? <p className="rounded-xl border border-line bg-panel2/40 px-4 py-3 text-sm whitespace-pre-wrap">{order.brief}</p>
                : <p className="rounded-xl border border-dashed border-line px-4 py-3 text-sm text-mist">Not sent yet. The buyer is asked for it in their Client Area once the order is paid.</p>}
            </section>
          )}

          {!readOnly && (hasService || parseFiles(order.deliveryFiles).length > 0) && <DeliveryFiles order={order} onDone={() => { loadEvents(); onSaved?.(); }} />}

          {/* SMM fulfillment */}
          {smm && (
            <section>
              <p className="text-xs font-semibold uppercase tracking-wide text-mist mb-2 flex items-center gap-1.5"><Share2 size={12} /> SMM Service</p>
              <div className="rounded-xl border border-line px-4">
                <Row label="Service" value={smm.service?.name} />
                <Row label="Quantity" value={smm.quantity?.toLocaleString()} />
                <Row label="Link" value={smm.link} copy action={<a href={smm.link} target="_blank" rel="noreferrer" className="p-1.5 text-mist hover:text-brand"><Link2 size={13} /></a>} />
                <Row label="Provider order #" value={smm.providerOrderId} copy />
                <Row label="Provider status" value={<span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SMM_STATUS_STYLE[smm.providerStatus] || "bg-panel2 text-mist"}`}>{smm.providerStatus}</span>} />
                <Row label="Start count" value={smm.startCount?.toLocaleString()} />
                <Row label="Remaining" value={smm.remains?.toLocaleString()} />
                <Row label="Last synced" value={smm.lastSyncedAt ? timeAgo(smm.lastSyncedAt) : null} />
              </div>
              {!readOnly && <div className="flex items-center gap-2 mt-3">
                {!smm.providerOrderId ? (
                  <button type="button" disabled={smmBusy} onClick={sendToProvider} className="btn-primary !py-2 !px-4 text-xs">
                    {smmBusy ? <Loader2 size={13} className="animate-spin" /> : <Rocket size={13} />} Send to SMMIU
                  </button>
                ) : (
                  <button type="button" disabled={smmBusy} onClick={syncStatus} className="btn-ghost !py-2 !px-4 text-xs">
                    {smmBusy ? <Loader2 size={13} className="animate-spin" /> : <RefreshCcw size={13} />} Sync status
                  </button>
                )}
                {smmErr && <p className="text-xs text-red-400">{smmErr}</p>}
              </div>}
              {!smm.providerOrderId && <p className="text-[11px] text-mist mt-2">Only send this once payment is confirmed (status PAID or later) - it spends real balance on your SMMIU account.</p>}
            </section>
          )}

          {order.note && (
            <section>
              <p className="text-xs font-semibold uppercase tracking-wide text-mist mb-2">Customer's note</p>
              <p className="rounded-xl border border-line bg-panel2/40 px-4 py-3 text-sm whitespace-pre-wrap">{order.note}</p>
            </section>
          )}

          {!readOnly && <>
          {/* Send delivery */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-wide text-mist mb-2 flex items-center gap-1.5"><Send size={12} /> Send delivery details</p>
            <div className="rounded-xl border border-line p-4 space-y-3">
              <textarea
                rows={3} value={deliverMsg} onChange={(e) => setDeliverMsg(e.target.value)} className="input"
                placeholder="Login / access details, credentials, or instructions for the customer..."
              />
              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-xs text-mist cursor-pointer">
                  <input type="checkbox" checked={markDelivered} onChange={(e) => setMarkDelivered(e.target.checked)} className="w-3.5 h-3.5 accent-[#E8352B]" />
                  Also mark as Delivered
                </label>
                <button type="button" disabled={deliverBusy || !deliverMsg.trim()} onClick={sendDelivery} className="btn-primary !py-2 !px-4 text-xs">
                  {deliverBusy ? <Loader2 size={13} className="animate-spin" /> : deliverDone ? <Check size={13} /> : <Send size={13} />}
                  {deliverDone ? "Sent" : "Email customer"}
                </button>
              </div>
              {err && <p className="text-xs text-red-400">{err}</p>}
              <p className="text-[11px] text-mist">Emails {order.email}. If SMTP isn't configured yet, the message is only logged to the server console.</p>
            </div>
          </section>

          {/* Internal note */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-wide text-mist mb-2 flex items-center gap-1.5"><StickyNote size={12} /> Internal note</p>
            <div className="flex gap-2">
              <input value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addNote()} placeholder="Add a note only admins can see..." className="input" />
              <button type="button" disabled={noteBusy || !note.trim()} onClick={addNote} className="btn-ghost shrink-0">{noteBusy ? <Loader2 size={14} className="animate-spin" /> : "Add"}</button>
            </div>
          </section>

          </>}

          {/* Timeline */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-wide text-mist mb-2 flex items-center gap-1.5"><Clock size={12} /> Timeline</p>
            {events === null && <p className="text-sm text-mist">Loading…</p>}
            {events?.length === 0 && <p className="text-sm text-mist">No activity logged yet.</p>}
            <div className="space-y-3">
              {events?.map((e) => {
                const Icon = EVENT_ICON[e.type] || Clock;
                return (
                  <div key={e.id} className="flex gap-3">
                    <span className="w-7 h-7 rounded-full bg-panel2 border border-line flex items-center justify-center shrink-0 text-mist"><Icon size={13} /></span>
                    <div className="min-w-0 flex-1 pb-1">
                      <p className="text-sm whitespace-pre-wrap break-words">{e.message}</p>
                      <p className="text-[11px] text-mist mt-0.5">{e.byName ? `${e.byName} · ` : ""}{timeAgo(e.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
