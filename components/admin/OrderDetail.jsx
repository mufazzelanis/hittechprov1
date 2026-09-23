"use client";

import { useEffect, useState } from "react";
import {
  X, Copy, Check, Mail, Phone, MessageCircle, Loader2, Send, StickyNote, ArrowRightLeft,
  PackageCheck, Clock, User, ShoppingBag, ExternalLink,
} from "lucide-react";

const STATUS_STYLE = {
  PENDING: "bg-amber-500/15 text-amber-300",
  PAID: "bg-sky-500/15 text-sky-300",
  DELIVERED: "bg-emerald-500/15 text-emerald-300",
  REFUNDED: "bg-purple-500/15 text-purple-300",
  CANCELLED: "bg-zinc-500/20 text-zinc-300",
};
const STATUSES = ["PENDING", "PAID", "DELIVERED", "REFUNDED", "CANCELLED"];
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

export default function OrderDetail({ order, onClose, onSaved }) {
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

  const wa = digits(order.phone) ? `https://wa.me/${digits(order.phone)}` : null;

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
              value={status} disabled={statusBusy} onChange={(e) => changeStatus(e.target.value)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold border-0 outline-none cursor-pointer ${STATUS_STYLE[status]}`}
            >
              {STATUSES.map((s) => <option key={s} value={s} className="bg-panel text-fg">{s}</option>)}
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
              <Row label="Method" value={order.method} />
              <Row label="Transaction ID" value={order.txnId} copy />
              <Row label="Referred by" value={order.refCode} copy />
              <Row label="Commission" value={order.commission ? `৳${order.commission}` : null} />
              <Row label="Placed" value={fmtDate(order.createdAt)} />
            </div>
          </section>

          {order.note && (
            <section>
              <p className="text-xs font-semibold uppercase tracking-wide text-mist mb-2">Customer's note</p>
              <p className="rounded-xl border border-line bg-panel2/40 px-4 py-3 text-sm whitespace-pre-wrap">{order.note}</p>
            </section>
          )}

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
