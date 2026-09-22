"use client";

import { useMemo, useRef, useState } from "react";
import { Search, Check, Loader2, Clock, SlidersHorizontal, ShoppingBag } from "lucide-react";
import { useSelection, Check3, BulkBar, Modal, plural } from "./Bulk";

const STATUSES = [
  ["active", "Active", "bg-emerald-500/15 text-emerald-300"],
  ["limited", "Limited", "bg-amber-500/15 text-amber-300"],
  ["maintenance", "Maintenance", "bg-orange-500/15 text-orange-300"],
  ["down", "Down", "bg-red-500/15 text-red-300"],
];
const ACCESS = [["", "—"], ["Private", "Private"], ["Shared", "Shared"]];
const KIND = { tool: "Tools", bundle: "Bundles", plan: "Custom packs" };

export default function ToolLimitsManager({ initial }) {
  const [rows, setRows] = useState(initial);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState(""); // status key, "soon", or ""
  const [kind, setKind] = useState("");
  const [state, setState] = useState({}); // id -> "saving" | "saved" | "error"
  const timers = useRef({});
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bp, setBp] = useState({});

  const counts = useMemo(() => ({ ...Object.fromEntries(STATUSES.map(([k]) => [k, rows.filter((r) => r.kind === "tool" && r.status === k).length])), soon: rows.filter((r) => r.soon).length }), [rows]);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((r) => (!kind || r.kind === kind) && (!filter || (filter === "soon" ? r.soon : r.status === filter)) && (!s || r.name.toLowerCase().includes(s)));
  }, [rows, q, filter, kind]);

  function persist(row, delay = 500) {
    clearTimeout(timers.current[row.id]);
    setState((p) => ({ ...p, [row.id]: "saving" }));
    timers.current[row.id] = setTimeout(async () => {
      const r = await fetch("/api/admin/tool-limits", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId: row.id, status: row.status, limit: row.limit, access: row.access, note: row.note, soon: row.soon }),
      });
      setState((p) => ({ ...p, [row.id]: r.ok ? "saved" : "error" }));
      setTimeout(() => setState((p) => (p[row.id] === "saved" ? { ...p, [row.id]: "" } : p)), 1800);
    }, delay);
  }

  function change(id, patch, delay) {
    setRows((rs) => {
      const next = rs.map((r) => (r.id === id ? { ...r, ...patch } : r));
      persist(next.find((r) => r.id === id), delay);
      return next;
    });
  }

  const pick = useSelection(list.map((r) => ({ id: r.id })));

  // apply the same change to every selected product (each one is saved like a single edit)
  function applyMany(patch) {
    const chosen = new Set(pick.ids);
    setRows((rs) => {
      const next = rs.map((r) => {
        if (!chosen.has(r.id)) return r;
        const p = { ...patch };
        if (r.kind !== "tool") { delete p.status; delete p.access; delete p.limit; delete p.note; }
        return Object.keys(p).length ? { ...r, ...p } : r;
      });
      for (const r of next) if (chosen.has(r.id)) persist(r, 0);
      return next;
    });
  }

  const Indicator = ({ id }) =>
    state[id] === "saving" ? <Loader2 size={14} className="animate-spin text-mist" /> : state[id] === "saved" ? <Check size={14} className="text-emerald-400" /> : state[id] === "error" ? <span className="text-[11px] text-red-400">Failed</span> : null;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-line bg-panel p-4 sm:p-5 text-sm text-mist leading-relaxed space-y-2">
        <p>Set each product's status and limits. Changes save automatically and appear on the public <b className="text-fg">Tool Limits</b> page.</p>
        <p className="flex gap-2"><Clock size={16} className="text-amber-300 shrink-0 mt-0.5" /> <span><b className="text-fg">Coming soon</b> (the amber switch): the product stays visible on the site, but every buy button (Get Access, Order Now, Add to Cart, Buy now, Bundles) shows "Coming soon" and orders for it are blocked. Switch it off and the product sells normally again.</span></p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mist" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products..." className="input !pl-9" />
        </div>
        <label className="inline-flex items-center gap-2.5 text-xs text-mist cursor-pointer select-none">
          <Check3 checked={pick.all} indeterminate={pick.some} onChange={pick.toggleAll} label="Select all shown products" /> Select all {list.length}
        </label>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilter("")} className={`px-3.5 py-2 rounded-lg text-xs border ${filter === "" ? "bg-brand border-brand" : "border-line text-mist hover:text-fg"}`}>All {rows.length}</button>
          <button onClick={() => setFilter(filter === "soon" ? "" : "soon")} className={`px-3.5 py-2 rounded-lg text-xs border ${filter === "soon" ? "bg-amber-500 border-amber-500 text-black" : "border-amber-500/40 text-amber-300 hover:bg-amber-500/10"}`}>Coming soon {counts.soon}</button>
          {STATUSES.map(([k, l]) => (
            <button key={k} onClick={() => setFilter(filter === k ? "" : k)} className={`px-3.5 py-2 rounded-lg text-xs border ${filter === k ? "bg-brand border-brand" : "border-line text-mist hover:text-fg"}`}>{l} {counts[k]}</button>
          ))}
          <span className="hidden sm:block w-px h-8 bg-line mx-1" />
          {Object.entries(KIND).map(([k, l]) => (
            <button key={k} onClick={() => setKind(kind === k ? "" : k)} className={`px-3.5 py-2 rounded-lg text-xs border ${kind === k ? "bg-brand border-brand" : "border-line text-mist hover:text-fg"}`}>{l}</button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {list.length === 0 && <p className="rounded-2xl border border-line bg-panel py-12 text-center text-sm text-mist">No products match.</p>}
        {list.map((r) => {
          const st = STATUSES.find(([k]) => k === r.status);
          const isTool = r.kind === "tool";
          return (
            <div key={r.kind + r.id} className={`rounded-2xl border p-4 grid gap-3 lg:items-center transition-colors ${pick.has(r.id) ? "bg-brand/[0.07] border-brand/60" : r.soon ? "bg-panel border-amber-500/40" : "bg-panel border-line"} ${isTool ? "lg:grid-cols-[minmax(150px,1.1fr)_130px_150px_120px_1.3fr_1.3fr_24px]" : "lg:grid-cols-[minmax(150px,1.1fr)_130px_1fr_24px]"}`}>
              <div className="min-w-0 flex items-center gap-3">
                <Check3 checked={pick.has(r.id)} onChange={(e) => pick.toggle(r.id, e)} label={`Select ${r.name}`} />
                <div className="min-w-0">
                  <p className="font-medium truncate">{r.name}</p>
                  <p className="text-[11px] text-mist">{r.category || "—"}{!r.active && " · hidden on site"}</p>
                </div>
              </div>
              <button type="button" role="switch" aria-checked={r.soon} aria-label={`Coming soon for ${r.name}`} onClick={() => change(r.id, { soon: !r.soon }, 0)} className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold border transition-colors ${r.soon ? "bg-amber-500/15 border-amber-500/50 text-amber-300" : "border-line text-mist hover:text-fg"}`}>
                <span className="inline-flex items-center gap-1.5"><Clock size={13} /> {r.soon ? "Coming soon" : "On sale"}</span>
                <span className={`relative w-8 h-[18px] rounded-full ${r.soon ? "bg-amber-500" : "bg-panel2 border border-line"}`}><span className={`absolute top-[2px] w-3.5 h-3.5 rounded-full bg-white transition-all ${r.soon ? "left-[16px]" : "left-[2px]"}`} /></span>
              </button>
              {isTool ? (
                <>
                  <select value={r.status} onChange={(e) => change(r.id, { status: e.target.value })} aria-label={`Status of ${r.name}`} className={`rounded-lg px-3 py-2.5 text-sm font-semibold border-0 outline-none cursor-pointer ${st[2]}`}>
                    {STATUSES.map(([k, l]) => <option key={k} value={k} className="bg-panel text-fg">{l}</option>)}
                  </select>
                  <select value={r.access} onChange={(e) => change(r.id, { access: e.target.value })} aria-label={`Access type of ${r.name}`} className="input">
                    {ACCESS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                  <input className="input" value={r.limit} onChange={(e) => change(r.id, { limit: e.target.value })} placeholder="e.g. 10 downloads/day" aria-label={`Limit of ${r.name}`} />
                  <input className="input" value={r.note} onChange={(e) => change(r.id, { note: e.target.value })} placeholder="Note (optional)" aria-label={`Note for ${r.name}`} />
                </>
              ) : (
                <p className="text-[11px] text-mist">{r.kind === "bundle" ? "Bundle" : "Custom pack"}: only the Coming soon switch applies.</p>
              )}
              <div className="hidden lg:flex justify-center"><Indicator id={r.id} /></div>
              <div className="lg:hidden text-right h-4"><Indicator id={r.id} /></div>
            </div>
          );
        })}
      </div>

      <BulkBar
        count={pick.count} noun="product" onClear={pick.clear}
        actions={[
          { label: "Coming soon", icon: Clock, mobileIconOnly: true, onClick: () => applyMany({ soon: true }) },
          { label: "On sale", icon: ShoppingBag, mobileIconOnly: true, onClick: () => applyMany({ soon: false }) },
          { label: "Bulk edit", icon: SlidersHorizontal, onClick: () => { setBp({}); setBulkOpen(true); } },
        ]}
      />
      <Modal open={bulkOpen} onClose={() => setBulkOpen(false)} title={`Edit ${pick.count} ${plural("product", pick.count)}`} wide footer={
        <>
          <button type="button" className="btn-ghost" onClick={() => setBulkOpen(false)}>Cancel</button>
          <button type="button" disabled={!Object.keys(bp).length} onClick={() => { applyMany(bp); setBulkOpen(false); }} className="btn-primary">Apply to {pick.count}</button>
        </>
      }>
        <p className="text-xs text-mist mb-4">Only fields you change are updated. Status, access, limit and note apply to tools only; bundles and custom packs take the Coming soon switch.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="block text-xs text-mist mb-1.5">Sale state</label>
            <select className="input" value={bp.soon === undefined ? "" : String(bp.soon)} onChange={(e) => setBp((p) => { const n = { ...p }; if (!e.target.value) delete n.soon; else n.soon = e.target.value === "true"; return n; })}>
              <option value="">— No change —</option><option value="true">Coming soon</option><option value="false">On sale</option>
            </select></div>
          <div><label className="block text-xs text-mist mb-1.5">Status</label>
            <select className="input" value={bp.status || ""} onChange={(e) => setBp((p) => { const n = { ...p }; if (!e.target.value) delete n.status; else n.status = e.target.value; return n; })}>
              <option value="">— No change —</option>{STATUSES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select></div>
          <div><label className="block text-xs text-mist mb-1.5">Access type</label>
            <select className="input" value={bp.access === undefined ? "__" : bp.access} onChange={(e) => setBp((p) => { const n = { ...p }; if (e.target.value === "__") delete n.access; else n.access = e.target.value; return n; })}>
              <option value="__">— No change —</option>{ACCESS.map(([k, l]) => <option key={k} value={k}>{k ? l : "Clear (none)"}</option>)}
            </select></div>
          <div><label className="block text-xs text-mist mb-1.5">Limit text</label>
            <input className="input" placeholder="— No change — (type to set)" value={bp.limit ?? ""} onChange={(e) => setBp((p) => { const n = { ...p }; if (!e.target.value) delete n.limit; else n.limit = e.target.value; return n; })} /></div>
        </div>
      </Modal>
    </div>
  );
}
