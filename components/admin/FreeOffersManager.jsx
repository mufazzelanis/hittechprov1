"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X, Loader2, Gift, Users, Eye, EyeOff } from "lucide-react";
import { useSelection, Check3, BulkBar, ConfirmDelete } from "./Bulk";
import { BRAND, BrandIcon, JOIN_TYPES } from "@/components/Brand";
import { ImageInput } from "./ResourceManager";

const EMPTY = { name: "", badge: "FREE", desc: "", image: "", accent: "#E8352B", reward: "", cta: "", joins: [], max: 0, ends: "", active: true, sort: 0 };

export default function FreeOffersManager({ initial }) {
  const router = useRouter();
  const [offers, setOffers] = useState(initial);
  const [edit, setEdit] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const pick = useSelection(offers);
  const [confirmDel, setConfirmDel] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);

  async function reload() {
    const j = await (await fetch("/api/admin/free-offers")).json();
    setOffers(j.offers || []);
    router.refresh();
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const r = await fetch("/api/admin/free-offers", { method: edit.id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(edit) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setErr(j.error || "Could not save");
    setEdit(null);
    reload();
  }

  async function toggle(o) {
    setOffers((l) => l.map((x) => (x.id === o.id ? { ...x, active: !x.active } : x)));
    await fetch("/api/admin/free-offers", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: o.id, active: !o.active }) });
  }

  async function remove(o) {
    if (!confirm(`Delete "${o.name}"? People who already claimed it stay in Leads.`)) return;
    await fetch(`/api/admin/free-offers?id=${o.id}`, { method: "DELETE" });
    reload();
  }

  const set = (k, v) => setEdit((p) => ({ ...p, [k]: v }));

  async function bulkShow(active) {
    const ids = pick.ids;
    setBulkBusy(true);
    setOffers((l) => l.map((x) => (ids.includes(x.id) ? { ...x, active } : x)));
    await Promise.all(ids.map((id) => fetch("/api/admin/free-offers", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, active }) })));
    setBulkBusy(false);
    pick.clear();
    reload();
  }
  async function bulkDelete() {
    setBulkBusy(true);
    await Promise.all(pick.ids.map((id) => fetch(`/api/admin/free-offers?id=${id}`, { method: "DELETE" })));
    setBulkBusy(false);
    setConfirmDel(false);
    pick.clear();
    reload();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-mist">{offers.length} offer{offers.length === 1 ? "" : "s"} · claims are saved in <Link href="/admin/leads" className="text-brand hover:underline">Leads</Link></p>
        <button className="btn-primary" onClick={() => { setErr(""); setEdit({ ...EMPTY }); }}><Plus size={16} /> Add offer</button>
      </div>

      {offers.length > 1 && (
        <label className="inline-flex items-center gap-2.5 text-xs text-mist cursor-pointer select-none"><Check3 checked={pick.all} indeterminate={pick.some} onChange={pick.toggleAll} label="Select all offers" /> Select all {offers.length}</label>
      )}
      {offers.length === 0 && <p className="rounded-2xl border border-line bg-panel py-14 text-center text-sm text-mist">No offers yet. Click "Add offer" to create the first one.</p>}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
        {offers.map((o) => {
          const ended = o.ends && Date.now() > new Date(o.ends + "T23:59:59").getTime();
          return (
            <div key={o.id} className={`rounded-2xl border p-4 flex flex-wrap items-center gap-4 transition-colors ${pick.has(o.id) ? "border-brand/60 bg-brand/[0.07]" : "border-line bg-panel"}`}>
              <Check3 checked={pick.has(o.id)} onChange={(e) => pick.toggle(o.id, e)} label={`Select ${o.name}`} />
              <span className="w-14 h-14 rounded-xl shrink-0 overflow-hidden flex items-center justify-center text-white" style={{ background: `linear-gradient(135deg, ${o.accent}, #0b0b12 130%)` }}>
                {o.image ? <img src={o.image} alt="" className="w-full h-full object-cover" /> : <Gift size={22} />}
              </span>
              <div className="min-w-0 flex-1 basis-56">
                <p className="font-semibold truncate">{o.name} <span className="ml-1 text-[10px] font-bold bg-brand/20 text-brand px-1.5 py-0.5 rounded">{o.badge}</span></p>
                <p className="text-xs text-mist truncate">{o.desc || "No description"}</p>
                <p className="text-[11px] text-mist mt-1 flex flex-wrap gap-x-4">
                  <span className="inline-flex items-center gap-1"><Users size={11} /> {o.claims} claimed{o.max > 0 ? ` of ${o.max}` : ""}</span>
                  {o.ends && <span className={ended ? "text-red-400" : ""}>{ended ? "Ended" : "Ends"} {o.ends}</span>}
                </p>
              </div>
              <button type="button" role="switch" aria-checked={o.active} aria-label={`Show ${o.name}`} onClick={() => toggle(o)} className={`relative w-11 h-6 rounded-full transition-colors ${o.active ? "bg-brand" : "bg-panel2 border border-line"}`}>
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${o.active ? "left-[22px]" : "left-0.5"}`} />
              </button>
              <div>
                <button onClick={() => { setErr(""); setEdit({ ...o }); }} className="p-2.5 text-mist hover:text-fg" aria-label="Edit"><Pencil size={16} /></button>
                <button onClick={() => remove(o)} className="p-2.5 text-mist hover:text-red-400" aria-label="Delete"><Trash2 size={16} /></button>
              </div>
            </div>
          );
        })}
      </div>

      <BulkBar
        count={pick.count} noun="offer" onClear={pick.clear} busy={bulkBusy}
        actions={[
          { label: "Show", icon: Eye, mobileIconOnly: true, onClick: () => bulkShow(true) },
          { label: "Hide", icon: EyeOff, mobileIconOnly: true, onClick: () => bulkShow(false) },
          { label: "Delete", icon: Trash2, danger: true, mobileIconOnly: true, onClick: () => setConfirmDel(true) },
        ]}
      />
      <ConfirmDelete open={confirmDel} count={pick.count} noun="offer" busy={bulkBusy} names={offers.filter((o) => pick.has(o.id)).map((o) => o.name)} extra="People who already claimed these offers stay in Leads." onCancel={() => setConfirmDel(false)} onConfirm={bulkDelete} />

      {edit && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button className="flex-1 bg-black/60" aria-label="Close" onClick={() => setEdit(null)} />
          <form onSubmit={save} className="w-full max-w-lg bg-panel border-l border-line flex flex-col">
            <div className="flex items-center justify-between px-6 h-16 border-b border-line shrink-0">
              <h2 className="font-display font-semibold">{edit.id ? "Edit" : "Add"} free offer</h2>
              <button type="button" onClick={() => setEdit(null)} className="text-mist hover:text-fg"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div><label className="block text-xs text-mist mb-1.5">Offer name <span className="text-brand">*</span></label><input className="input" required value={edit.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Free Canva Pro for 7 days" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs text-mist mb-1.5">Badge</label><input className="input" value={edit.badge} onChange={(e) => set("badge", e.target.value)} placeholder="FREE" /></div>
                <div><label className="block text-xs text-mist mb-1.5">Button text (optional)</label><input className="input" value={edit.cta} onChange={(e) => set("cta", e.target.value)} placeholder="Claim for free" /></div>
              </div>
              <div>
                <label className="block text-xs text-mist mb-1.5">Channels people must join first (optional, up to 3)</label>
                <div className="space-y-2.5">
                  {(edit.joins || []).map((j, i) => (
                    <div key={i} className="rounded-xl border border-line p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0" style={{ background: `linear-gradient(135deg, ${BRAND[j.type].from}, ${BRAND[j.type].to})` }}><BrandIcon type={j.type} size={16} /></span>
                        <select className="input" value={j.type} onChange={(e) => set("joins", edit.joins.map((x, k) => (k === i ? { ...x, type: e.target.value } : x)))}>
                          {JOIN_TYPES.map((t) => <option key={t} value={t}>{BRAND[t].name}</option>)}
                        </select>
                        <button type="button" onClick={() => set("joins", edit.joins.filter((_, k) => k !== i))} className="p-2 text-mist hover:text-red-400" aria-label="Remove"><Trash2 size={15} /></button>
                      </div>
                      <input className="input" value={j.url} onChange={(e) => set("joins", edit.joins.map((x, k) => (k === i ? { ...x, url: e.target.value } : x)))} placeholder="Channel link, e.g. https://t.me/yourchannel" />
                      <input className="input" value={j.label} onChange={(e) => set("joins", edit.joins.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} placeholder="Text shown to visitors (optional)" />
                    </div>
                  ))}
                </div>
                {(edit.joins || []).length < 3 && <button type="button" onClick={() => set("joins", [...(edit.joins || []), { type: "telegram", url: "", label: "" }])} className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-brand hover:underline"><Plus size={13} /> Add a channel to join</button>}
                <p className="text-[11px] text-mist mt-2 leading-relaxed">The visitor taps the button, the channel opens in a new tab, and the offer unlocks after a short check. The app cannot confirm someone really joined; their Telegram username / WhatsApp number is saved in Leads so you can compare it with your member list.</p>
              </div>
              <div><label className="block text-xs text-mist mb-1.5">Description</label><textarea rows={3} className="input" value={edit.desc} onChange={(e) => set("desc", e.target.value)} /></div>
              <div><label className="block text-xs text-mist mb-1.5">Cover image (optional)</label><ImageInput value={edit.image} onChange={(v) => set("image", v)} /></div>
              <div>
                <label className="block text-xs text-mist mb-1.5">Card colour (used when there is no image)</label>
                <div className="flex gap-3"><input type="color" value={edit.accent} onChange={(e) => set("accent", e.target.value)} className="h-10 w-14 rounded bg-ink border border-line" /><input className="input" value={edit.accent} onChange={(e) => set("accent", e.target.value)} /></div>
              </div>
              <div>
                <label className="block text-xs text-mist mb-1.5">What the person gets after claiming</label>
                <textarea rows={3} className="input" value={edit.reward} onChange={(e) => set("reward", e.target.value)} placeholder="A coupon code, a download link, or instructions. Empty = 'We will contact you by email'." />
                <p className="text-[11px] text-mist mt-1.5">Only shown after they claim. It is never in the page source.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs text-mist mb-1.5">Max claims (0 = unlimited)</label><input type="number" min={0} className="input" value={edit.max} onChange={(e) => set("max", e.target.value)} /></div>
                <div><label className="block text-xs text-mist mb-1.5">Ends on (optional)</label><input type="date" className="input" value={edit.ends} onChange={(e) => set("ends", e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs text-mist mb-1.5">Sort order</label><input type="number" min={0} className="input" value={edit.sort} onChange={(e) => set("sort", e.target.value)} /></div>
                <label className="flex items-center justify-between rounded-lg border border-line px-4 mt-[22px] cursor-pointer"><span className="text-sm">Visible</span><input type="checkbox" checked={edit.active} onChange={(e) => set("active", e.target.checked)} className="w-4 h-4 accent-[#E8352B]" /></label>
              </div>
            </div>
            <div className="p-4 border-t border-line flex items-center gap-3 shrink-0">
              <p className="flex-1 text-sm text-red-400">{err}</p>
              <button type="button" className="btn-ghost" onClick={() => setEdit(null)}>Cancel</button>
              <button disabled={busy} className="btn-primary">{busy && <Loader2 size={15} className="animate-spin" />} Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
