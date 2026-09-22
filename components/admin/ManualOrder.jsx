"use client";

import { useEffect, useMemo, useState } from "react";
import { PhoneCall, X, Search, Plus, Trash2, Loader2 } from "lucide-react";

const STATUSES = ["PENDING", "PAID", "DELIVERED", "REFUNDED", "CANCELLED"];
const METHODS = ["Cash", "bKash", "Nagad", "Rocket", "Bank Transfer", "Other"];

export default function ManualOrder({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [catalog, setCatalog] = useState({ tool: [], bundle: [], plan: [] });
  const [tab, setTab] = useState("tool");
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState([]); // {type,id,name,price}
  const [custom, setCustom] = useState([]); // {name,amount}
  const [f, setF] = useState({ name: "", phone: "", email: "", method: "Cash", txnId: "", status: "PENDING", note: "" });
  const [override, setOverride] = useState(null); // null = auto total
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open || catalog.tool.length) return;
    Promise.all(["tools", "bundles", "plans"].map((r) => fetch(`/api/admin/${r}`).then((x) => x.json()))).then(([t, b, p]) =>
      setCatalog({ tool: t.rows || [], bundle: b.rows || [], plan: p.rows || [] })
    );
  }, [open, catalog.tool.length]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return catalog[tab].filter((r) => !s || r.name.toLowerCase().includes(s));
  }, [catalog, tab, q]);

  const sum = picked.reduce((n, x) => n + x.price, 0) + custom.reduce((n, c) => n + (parseInt(c.amount, 10) || 0), 0);
  const total = override === null ? sum : override;
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const isPicked = (type, id) => picked.some((x) => x.type === type && x.id === id);
  const toggle = (type, r) => setPicked((p) => (isPicked(type, r.id) ? p.filter((x) => !(x.type === type && x.id === r.id)) : [...p, { type, id: r.id, name: r.name, price: r.price }]));

  function reset() {
    setPicked([]); setCustom([]); setOverride(null); setErr(""); setQ("");
    setF({ name: "", phone: "", email: "", method: "Cash", txnId: "", status: "PENDING", note: "" });
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const r = await fetch("/api/admin/manual-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, items: picked.map(({ type, id }) => ({ type, id })), custom, amount: override === null ? "" : override }),
    });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setErr(j.error || "Could not save the order");
    setOpen(false);
    reset();
    onCreated?.(j.number);
  }

  return (
    <>
      <button type="button" className="btn-primary" onClick={() => setOpen(true)}><PhoneCall size={16} /> New manual order</button>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button className="flex-1 bg-black/60" aria-label="Close" onClick={() => setOpen(false)} />
          <form onSubmit={submit} className="w-full max-w-xl bg-panel border-l border-line flex flex-col">
            <div className="flex items-center justify-between px-6 h-16 border-b border-line shrink-0">
              <div>
                <h2 className="font-display font-semibold">New manual order</h2>
                <p className="text-[11px] text-mist">For orders taken by phone or chat</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-mist hover:text-fg"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <section className="grid sm:grid-cols-2 gap-4">
                <div><label className="block text-xs text-mist mb-1.5">Customer name <span className="text-brand">*</span></label><input className="input" value={f.name} onChange={(e) => set("name", e.target.value)} required /></div>
                <div><label className="block text-xs text-mist mb-1.5">Phone <span className="text-brand">*</span></label><input className="input" value={f.phone} onChange={(e) => set("phone", e.target.value)} required /></div>
                <div className="sm:col-span-2"><label className="block text-xs text-mist mb-1.5">Email (optional, links to their account if they have one)</label><input type="email" className="input" value={f.email} onChange={(e) => set("email", e.target.value)} /></div>
              </section>

              <section>
                <p className="text-xs text-mist mb-2">Items <span className="text-brand">*</span></p>
                <div className="flex gap-2 mb-3">
                  {[["tool", "Tools"], ["bundle", "Bundles"], ["plan", "Custom packs"]].map(([k, l]) => (
                    <button key={k} type="button" onClick={() => setTab(k)} className={`px-3.5 py-1.5 rounded-lg text-xs border ${tab === k ? "bg-brand border-brand" : "border-line text-mist hover:text-fg"}`}>{l}</button>
                  ))}
                </div>
                <div className="relative mb-2"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mist" /><input className="input !pl-9" placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
                <div className="max-h-52 overflow-y-auto rounded-xl border border-line divide-y divide-line">
                  {list.length === 0 && <p className="text-xs text-mist text-center py-6">Nothing found.</p>}
                  {list.map((r) => {
                    const on = isPicked(tab, r.id);
                    return (
                      <button type="button" key={r.id} onClick={() => toggle(tab, r)} className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm text-left transition-colors ${on ? "bg-brand/15" : "hover:bg-panel2"}`}>
                        <span className="truncate">{r.name}{r.active === false && <span className="text-[10px] text-mist ml-2">(hidden)</span>}</span>
                        <span className="shrink-0 text-mist">৳{r.price.toLocaleString()} {on && <span className="text-brand ml-1">✓</span>}</span>
                      </button>
                    );
                  })}
                </div>

                {(picked.length > 0 || custom.length > 0) && (
                  <ul className="mt-3 rounded-xl border border-line divide-y divide-line text-sm">
                    {picked.map((x) => (
                      <li key={x.type + x.id} className="flex items-center justify-between gap-3 px-3.5 py-2"><span className="truncate">{x.name}</span><span className="flex items-center gap-2 shrink-0">৳{x.price.toLocaleString()}<button type="button" onClick={() => toggle(x.type, x)} className="text-mist hover:text-red-400"><Trash2 size={14} /></button></span></li>
                    ))}
                    {custom.map((c, i) => (
                      <li key={i} className="flex items-center gap-2 px-3 py-2">
                        <input className="input !py-1.5" placeholder="Item name" value={c.name} onChange={(e) => setCustom((p) => p.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                        <input className="input !py-1.5 !w-28" type="number" min={0} placeholder="৳ price" value={c.amount} onChange={(e) => setCustom((p) => p.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))} />
                        <button type="button" onClick={() => setCustom((p) => p.filter((_, j) => j !== i))} className="text-mist hover:text-red-400"><Trash2 size={14} /></button>
                      </li>
                    ))}
                  </ul>
                )}
                <button type="button" onClick={() => setCustom((p) => [...p, { name: "", amount: "" }])} className="mt-3 inline-flex items-center gap-1.5 text-xs text-brand hover:underline"><Plus size={13} /> Add an item that is not in the list</button>
              </section>

              <section className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-mist mb-1.5">Total amount (৳)</label>
                  <input className="input" type="number" min={0} value={total} onChange={(e) => setOverride(e.target.value === "" ? 0 : parseInt(e.target.value, 10))} />
                  <p className="text-[11px] text-mist mt-1.5">
                    Items add up to ৳{sum.toLocaleString()}.{" "}
                    {override !== null && override !== sum && <button type="button" className="text-brand hover:underline" onClick={() => setOverride(null)}>Use item total</button>}
                  </p>
                </div>
                <div><label className="block text-xs text-mist mb-1.5">Status</label><select className="input" value={f.status} onChange={(e) => set("status", e.target.value)}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
                <div><label className="block text-xs text-mist mb-1.5">Payment method</label><input className="input" list="mo-methods" value={f.method} onChange={(e) => set("method", e.target.value)} /><datalist id="mo-methods">{METHODS.map((m) => <option key={m} value={m} />)}</datalist></div>
                <div><label className="block text-xs text-mist mb-1.5">Transaction ID (optional)</label><input className="input" value={f.txnId} onChange={(e) => set("txnId", e.target.value)} /></div>
                <div className="sm:col-span-2"><label className="block text-xs text-mist mb-1.5">Note (optional)</label><textarea rows={2} className="input" value={f.note} onChange={(e) => set("note", e.target.value)} placeholder="e.g. Called at 3pm, will pay by bKash tonight" /></div>
              </section>
            </div>

            <div className="p-4 border-t border-line flex items-center gap-3 shrink-0">
              <p className="flex-1 text-sm">{err ? <span className="text-red-400">{err}</span> : <span className="text-mist">Total <b className="text-fg">৳{total.toLocaleString()}</b></span>}</p>
              <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
              <button disabled={busy} className="btn-primary">{busy && <Loader2 size={15} className="animate-spin" />} Save order</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
