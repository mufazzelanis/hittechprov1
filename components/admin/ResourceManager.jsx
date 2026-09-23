"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Plus, Search, Pencil, Trash2, X, Loader2, Upload, Check, SlidersHorizontal, Download, Eye, EyeOff, BarChart3 } from "lucide-react";
import { useSelection, Check3, BulkBar, Modal, ConfirmDelete, downloadCsv, plural } from "./Bulk";
import { RESOURCES, ICONS } from "@/lib/resources";
import ManualOrder from "./ManualOrder";
import OrderDetail from "./OrderDetail";

const STATUS_STYLE = {
  PENDING: "bg-amber-500/15 text-amber-300",
  PAID: "bg-sky-500/15 text-sky-300",
  DELIVERED: "bg-emerald-500/15 text-emerald-300",
  REFUNDED: "bg-purple-500/15 text-purple-300",
  CANCELLED: "bg-zinc-500/20 text-zinc-300",
  REJECTED: "bg-red-500/15 text-red-300",
};

const fmtDate = (d) =>
  new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

function emptyRow(res) {
  const o = {};
  for (const f of res.fields) {
    if (f.type === "readonly") continue;
    o[f.key] = f.def !== undefined ? f.def : f.type === "bool" ? false : f.type === "number" ? 0 : "";
  }
  return o;
}

export default function ResourceManager({ name, initialStatus = "", initialQ = "", initialEdit = "", initialNew = false }) {
  const res = RESOURCES[name];
  const [rows, setRows] = useState([]);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(initialQ);
  const [status, setStatus] = useState(initialStatus);
  const [editing, setEditing] = useState(null); // {id?, ...values}
  const [toast, setToast] = useState("");
  const [bulkEdit, setBulkEdit] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const pick = useSelection(rows);

  const flash = (m) => {
    setToast(m);
    setTimeout(() => setToast(""), 2200);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (status) p.set("status", status);
    const r = await fetch(`/api/admin/${name}?${p}`);
    const j = await r.json();
    setRows(j.rows || []);
    setLoading(false);
  }, [name, q, status]);

  useEffect(() => {
    const t = setTimeout(load, q ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  useEffect(() => {
    if (res.fields.some((f) => f.type === "category")) {
      fetch("/api/admin/categories").then((r) => r.json()).then((j) => setCats(j.rows || []));
    }
  }, [res]);

  async function patch(row, data) {
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, ...data } : r)));
    const r = await fetch(`/api/admin/${name}/${row.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!r.ok) {
      flash("Update failed");
      load();
    } else flash("Saved");
  }

  async function remove(row) {
    if (name === "orders") return;
    if (!confirm(`Delete "${row.name || row.question || "#" + row.number}"? This cannot be undone.`)) return;
    const r = await fetch(`/api/admin/${name}/${row.id}`, { method: "DELETE" });
    if (r.ok) {
      setRows((rs) => rs.filter((x) => x.id !== row.id));
      flash("Deleted");
    } else flash("Delete failed");
  }

  const listFields = res.fields.filter((f) => f.list);

  // opened from the global search: jump straight into the record or the add form
  const jumped = useRef(false);
  useEffect(() => {
    if (jumped.current || loading) return;
    if (initialNew && !res.noCreate) { jumped.current = true; setEditing(emptyRow(res)); }
    else if (initialEdit) { const row = rows.find((r) => r.id === initialEdit); if (row) { jumped.current = true; setEditing({ ...row }); } }
  }, [loading, rows, initialEdit, initialNew, res]);
  const rowName = (r) => r.name || r.question || r.userName || r.itemName || (r.number ? "#" + r.number : r.id);
  const hasActive = res.fields.some((f) => f.key === "active" && f.type === "bool");
  const bulkFields = res.fields.filter((f) => ["bool", "select", "status", "category", "icon", "soon"].includes(f.type));
  const hasPrice = ["tools", "bundles", "plans"].includes(name);

  async function bulk(action, data) {
    setBulkBusy(true);
    const r = await fetch(`/api/admin/${name}/bulk`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ids: pick.ids, data }) });
    const j = await r.json().catch(() => ({}));
    setBulkBusy(false);
    if (!r.ok) { flash(j.error || "Bulk action failed"); return false; }
    flash(action === "delete" ? `Deleted ${j.affected}${j.failed ? `, ${j.failed} could not be deleted (still in use)` : ""}` : `Updated ${pick.count} ${plural(res.singular.toLowerCase(), pick.count)}`);
    pick.clear();
    await load();
    return true;
  }

  function exportCsv(list, label) {
    const cols = res.fields.filter((f) => f.type !== "image" && f.type !== "soon");
    const val = (r, f) => (f.type === "category" ? r.category?.name || "" : f.list === "date" || f.key === "createdAt" ? (r[f.key] ? new Date(r[f.key]).toISOString() : "") : r[f.key]);
    downloadCsv(`${name}-${label}-${new Date().toISOString().slice(0, 10)}.csv`, cols.map((f) => f.label), list.map((r) => cols.map((f) => val(r, f))));
  }

  function cell(row, f) {
    const v = row[f.key];
    switch (f.list) {
      case "image":
        return v ? <img src={v} alt="" className="w-12 h-9 rounded object-cover border border-line" /> : <div className="w-12 h-9 rounded border border-line bg-panel2" />;
      case "category":
        return <span className="text-mist">{row.category?.name || "—"}</span>;
      case "money":
        return <span className="font-semibold">৳{Number(v).toLocaleString()}</span>;
      case "source":
        return v === "manual" ? <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold bg-amber-500/15 text-amber-300">Manual</span> : <span className="text-mist text-xs">Website</span>;
      case "orderno":
        return <span className="text-mist">#{v}</span>;
      case "date":
        return <span className="text-mist text-xs whitespace-nowrap">{fmtDate(v)}</span>;
      case "status":
        return res.noCreate ? (
          <select
            value={v}
            onChange={(e) => patch(row, { status: e.target.value })}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold border-0 outline-none cursor-pointer ${STATUS_STYLE[v]}`}
          >
            {f.options.map((o) => (
              <option key={o} value={o} className="bg-panel text-fg">{o}</option>
            ))}
          </select>
        ) : null;
      case "soon":
        return (
          <button
            onClick={() => patch(row, { soon: !v })}
            title={v ? "Coming soon is ON, click to allow orders" : "Click to mark Coming soon"}
            className={`w-10 h-6 rounded-full relative transition-colors after:absolute after:-inset-x-1.5 after:-inset-y-3 after:content-[''] ${v ? "bg-amber-500" : "bg-panel2 border border-line"}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${v ? "left-[18px]" : "left-0.5"}`} />
          </button>
        );
      case "badge":
        return (
          <button
            onClick={() => patch(row, { [f.key]: !v })}
            title="Click to toggle"
            className={`w-10 h-6 rounded-full relative transition-colors after:absolute after:-inset-x-1.5 after:-inset-y-3 after:content-[''] ${v ? "bg-brand" : "bg-panel2 border border-line"}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${v ? "left-[18px]" : "left-0.5"}`} />
          </button>
        );
      default:
        return <span className={f.key === "name" || f.key === "question" ? "font-medium" : "text-mist"}>{String(v ?? "").slice(0, 70)}</span>;
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mist" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${res.title.toLowerCase()}…`} className="input pl-9" />
        </div>
        {res.fields.some((f) => f.key === "status") && (
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="input !w-auto">
            <option value="">All statuses</option>
            {name === "orders" && <option value="PAID,DELIVERED">Paid + delivered</option>}
            {res.fields.find((f) => f.key === "status").options.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        )}
        <div className="flex-1" />
        {rows.length > 0 && <button type="button" onClick={() => exportCsv(rows, "all")} className="btn-ghost" title="Download the listed rows as a spreadsheet file"><Download size={15} /> <span className="hidden sm:inline">Export</span></button>}
        {name === "orders" && <a href="/admin/sales" className="btn-ghost"><BarChart3 size={15} /> <span className="hidden sm:inline">Sales report</span></a>}
        {name === "orders" && <ManualOrder onCreated={(n) => { flash(`Manual order #${n} created`); load(); }} />}
        {!res.noCreate && (
          <button className="btn-primary" onClick={() => setEditing(emptyRow(res))}>
            <Plus size={16} /> Add {res.singular.toLowerCase()}
          </button>
        )}
      </div>

      <div className="hidden md:block rounded-2xl border border-line bg-panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-mist border-b border-line">
              <th className="pl-4 pr-1 py-3 w-10"><Check3 checked={pick.all} indeterminate={pick.some} onChange={pick.toggleAll} label="Select all" /></th>
              {listFields.map((f) => (
                <th key={f.key} className="px-4 py-3 font-medium whitespace-nowrap">{f.label}</th>
              ))}
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="border-b border-line/60">
                <td className="pl-4 py-4"><div className="shimmer h-4 w-4" /></td>
                {listFields.map((f) => <td key={f.key} className="px-4 py-4"><div className="shimmer h-4 w-full max-w-[140px]" /></td>)}
                <td className="px-4 py-4"><div className="shimmer h-4 w-12 ml-auto" /></td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={listFields.length + 2} className="py-16 text-center text-mist">Nothing here yet.</td></tr>
            )}
            {!loading &&
              rows.map((row) => (
                <tr key={row.id} className={`border-b border-line/60 last:border-0 transition-colors ${pick.has(row.id) ? "bg-brand/[0.08]" : "hover:bg-panel2/50"}`}>
                  <td className="pl-4 pr-1 py-3 align-middle w-10"><Check3 checked={pick.has(row.id)} onChange={(e) => pick.toggle(row.id, e)} label={`Select ${rowName(row)}`} /></td>
                  {listFields.map((f) => (
                    <td key={f.key} className="px-4 py-3 align-middle">{cell(row, f)}</td>
                  ))}
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => setEditing({ ...row })} className="p-2 text-mist hover:text-fg" aria-label="Edit">
                      <Pencil size={15} />
                    </button>
                    {name !== "orders" && (
                      <button onClick={() => remove(row)} className="p-2 text-mist hover:text-red-400" aria-label="Delete">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Phones: one card per row instead of a wide table */}
      <div className="md:hidden space-y-3">
        {loading && [0, 1, 2, 3].map((i) => <div key={i} className="shimmer h-28" />)}
        {!loading && rows.length === 0 && <p className="rounded-2xl border border-line bg-panel py-12 text-center text-mist text-sm">Nothing here yet.</p>}
        {!loading &&
          rows.map((row) => (
            <div key={row.id} className={`rounded-2xl border p-4 transition-colors ${pick.has(row.id) ? "border-brand/60 bg-brand/[0.07]" : "border-line bg-panel"}`}>
              <div className="flex items-start justify-between gap-3">
                <Check3 className="mt-0.5" checked={pick.has(row.id)} onChange={(e) => pick.toggle(row.id, e)} label={`Select ${rowName(row)}`} />
                <div className="min-w-0 flex-1 font-medium">{cell(row, listFields[0])}</div>
                <div className="shrink-0 -mr-2 -mt-2">
                  <button onClick={() => setEditing({ ...row })} className="p-3 text-mist hover:text-fg" aria-label="Edit"><Pencil size={17} /></button>
                  {name !== "orders" && <button onClick={() => remove(row)} className="p-3 text-mist hover:text-red-400" aria-label="Delete"><Trash2 size={17} /></button>}
                </div>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
                {listFields.slice(1).map((f) => (
                  <div key={f.key} className="min-w-0">
                    <dt className="text-[11px] text-mist mb-1">{f.label}</dt>
                    <dd className="text-sm break-words">{cell(row, f)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
      </div>

      {editing && name === "orders" && (
        <OrderDetail order={editing} onClose={() => setEditing(null)} onSaved={load} />
      )}
      {editing && name !== "orders" && (
        <EditDrawer
          res={res}
          name={name}
          cats={cats}
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            flash("Saved");
            load();
          }}
        />
      )}

      <BulkBar
        count={pick.count} noun={res.singular.toLowerCase()} onClear={pick.clear} busy={bulkBusy}
        actions={[
          ...(hasActive ? [{ label: "Show", icon: Eye, mobileIconOnly: true, onClick: () => bulk("update", { active: true }) }, { label: "Hide", icon: EyeOff, mobileIconOnly: true, onClick: () => bulk("update", { active: false }) }] : []),
          ...(bulkFields.length || hasPrice ? [{ label: "Bulk edit", icon: SlidersHorizontal, onClick: () => setBulkEdit(true) }] : []),
          { label: "Export", icon: Download, mobileIconOnly: true, onClick: () => exportCsv(rows.filter((r) => pick.has(r.id)), "selected") },
          ...(name === "orders" ? [] : [{ label: "Delete", icon: Trash2, danger: true, mobileIconOnly: true, onClick: () => setConfirmDel(true) }]),
        ]}
      />
      <ConfirmDelete
        open={confirmDel} count={pick.count} noun={res.singular.toLowerCase()} busy={bulkBusy}
        names={rows.filter((r) => pick.has(r.id)).map(rowName)}
        extra={name === "orders" ? "Deleting orders removes them from your sales totals and affiliate records." : name === "categories" ? "A category that still has tools cannot be deleted; those are skipped." : undefined}
        onCancel={() => setConfirmDel(false)}
        onConfirm={async () => { if (await bulk("delete")) setConfirmDel(false); }}
      />
      <BulkEditModal open={bulkEdit} onClose={() => setBulkEdit(false)} count={pick.count} fields={bulkFields} cats={cats} hasPrice={hasPrice} noun={res.singular.toLowerCase()} busy={bulkBusy}
        onApply={async (data) => { if (await bulk("update", data)) setBulkEdit(false); }} />

      {toast && (
        <div className="fixed bottom-24 lg:bottom-6 right-4 lg:right-6 z-[60] flex items-center gap-2 rounded-lg bg-panel2 border border-line px-4 py-3 text-sm shadow-glow">
          <Check size={16} className="text-emerald-400" /> {toast}
        </div>
      )}
    </div>
  );
}

// "Change many at once": every control starts on "no change"; only what you set is applied.
function BulkEditModal({ open, onClose, count, fields, cats, hasPrice, noun, busy, onApply }) {
  const [v, setV] = useState({});
  useEffect(() => { if (open) setV({}); }, [open]);
  const set = (k, x) => setV((p) => (x === "" ? Object.fromEntries(Object.entries(p).filter(([kk]) => kk !== k)) : { ...p, [k]: x }));
  const chosen = Object.keys(v).length;
  const priceOk = !v.priceMode || (v.priceValue !== undefined && v.priceValue !== "");

  const sel = (f, opts) => (
    <div key={f.key}>
      <label className="block text-xs text-mist mb-1.5">{f.label.replace(/ \(.*\)$/, "")}</label>
      <select className="input" value={v[f.key] === undefined ? "" : String(v[f.key])} onChange={(e) => { const x = e.target.value; set(f.key, x === "" ? "" : x === "true" ? true : x === "false" ? false : x); }}>
        <option value="">— No change —</option>
        {opts.map(([val, label]) => <option key={String(val)} value={String(val)}>{label}</option>)}
      </select>
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title={`Edit ${count} ${plural(noun, count)}`} wide footer={
      <>
        <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
        <button type="button" disabled={busy || !chosen || !priceOk} onClick={() => onApply(v)} className="btn-primary">{busy && <Loader2 size={15} className="animate-spin" />} Apply to {count}</button>
      </>
    }>
      <p className="text-xs text-mist mb-4">Only the fields you change are updated. Everything set to “No change” stays as it is.</p>
      <div className="grid sm:grid-cols-2 gap-4">
        {fields.map((f) =>
          f.type === "bool" || f.type === "soon" ? sel(f, [[true, "On"], [false, "Off"]])
          : f.type === "category" ? sel(f, [["", "— None —"], ...cats.map((c) => [c.id, c.name])].filter((o) => o[0] !== ""))
          : f.type === "icon" ? sel(f, ICONS.map((i) => [i, i]))
          : sel(f, (f.options || []).map((o) => [o, o]))
        )}
        {hasPrice && (
          <div className="sm:col-span-2 rounded-xl border border-line p-4">
            <label className="block text-xs text-mist mb-1.5">Price</label>
            <div className="flex gap-2">
              <select className="input !w-auto" value={v.priceMode || ""} onChange={(e) => setV((p) => { const n = { ...p }; if (!e.target.value) { delete n.priceMode; delete n.priceValue; } else n.priceMode = e.target.value; return n; })}>
                <option value="">— No change —</option>
                <option value="set">Set every price to</option>
                <option value="pct">Change by percent (+/-)</option>
              </select>
              {v.priceMode && <input type="number" className="input" placeholder={v.priceMode === "set" ? "৳ amount" : "e.g. 10 or -15"} value={v.priceValue ?? ""} onChange={(e) => setV((p) => ({ ...p, priceValue: e.target.value }))} />}
            </div>
            {v.priceMode === "pct" && <p className="text-[11px] text-mist mt-1.5">10 raises every price by 10%; -15 lowers every price by 15%.</p>}
          </div>
        )}
      </div>
    </Modal>
  );
}

function EditDrawer({ res, name, cats, initial, onClose, onSaved }) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const isNew = !initial.id;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const r = await fetch(isNew ? `/api/admin/${name}` : `/api/admin/${name}/${initial.id}`, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (r.ok) return onSaved();
    setErr((await r.json().catch(() => ({}))).error || "Could not save");
    setBusy(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button className="flex-1 bg-black/60" onClick={onClose} aria-label="Close" />
      <form onSubmit={save} className="w-full max-w-lg bg-panel border-l border-line flex flex-col">
        <div className="flex items-center justify-between px-6 h-16 border-b border-line">
          <h2 className="font-display font-semibold">{isNew ? "Add" : "Edit"} {res.singular.toLowerCase()}</h2>
          <button type="button" onClick={onClose} className="text-mist hover:text-fg"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {res.fields.map((f) => (
            <Field key={f.key} f={f} value={form[f.key]} onChange={(v) => set(f.key, v)} cats={cats} />
          ))}
        </div>

        <div className="p-4 border-t border-line flex items-center gap-3">
          {err && <p className="text-sm text-red-400 flex-1">{err}</p>}
          <div className="flex-1" />
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button disabled={busy} className="btn-primary">
            {busy && <Loader2 size={15} className="animate-spin" />} Save
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ f, value, onChange, cats }) {
  const label = <label className="block text-xs text-mist mb-1.5">{f.label}{f.required && <span className="text-brand"> *</span>}</label>;
  switch (f.type) {
    case "readonly":
      return (
        <div>
          {label}
          <p className="text-sm whitespace-pre-wrap">
            {f.key === "createdAt" ? fmtDate(value) : value ?? "—"}
          </p>
        </div>
      );
    case "textarea":
      return <div>{label}<textarea rows={f.key === "tools" ? 8 : 4} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="input" required={f.required} /></div>;
    case "number":
      return <div>{label}<input type="number" min={0} value={value ?? 0} onChange={(e) => onChange(e.target.value)} className="input" /></div>;
    case "soon":
      return (
        <label className={`flex items-center justify-between gap-4 rounded-lg border px-4 py-3 cursor-pointer ${value ? "border-amber-500/60 bg-amber-500/10" : "border-line"}`}>
          <span className="text-sm">
            <span className="font-medium">{value ? "Coming soon: ON" : "Coming soon: OFF"}</span>
            <span className="block text-xs text-mist mt-0.5">ON = product stays visible, but every Get Access / Order button shows "Coming soon" and orders are blocked.</span>
          </span>
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 accent-amber-500 shrink-0" />
        </label>
      );
    case "bool":
      return (
        <label className="flex items-center justify-between rounded-lg border border-line px-4 py-3 cursor-pointer">
          <span className="text-sm">{f.label}</span>
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 accent-[#E8352B]" />
        </label>
      );
    case "select":
    case "status":
      return (
        <div>{label}
          <select value={value} onChange={(e) => onChange(e.target.value)} className="input">
            {f.options.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
      );
    case "category":
      return (
        <div>{label}
          <select value={value || ""} onChange={(e) => onChange(e.target.value)} className="input">
            <option value="">— None —</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      );
    case "icon":
      return (
        <div>{label}
          <select value={value} onChange={(e) => onChange(e.target.value)} className="input">
            {ICONS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
      );
    case "color":
      return (
        <div>{label}
          <div className="flex gap-3">
            <input type="color" value={value || "#E8352B"} onChange={(e) => onChange(e.target.value)} className="h-10 w-14 rounded bg-ink border border-line" />
            <input value={value || ""} onChange={(e) => onChange(e.target.value)} className="input" />
          </div>
        </div>
      );
    case "image":
      return <div>{label}<ImageInput value={value} onChange={onChange} /></div>;
    default:
      return <div>{label}<input value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="input" required={f.required} /></div>;
  }
}

export function ImageInput({ value, onChange }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function upload(file) {
    if (!file) return;
    setBusy(true);
    setErr("");
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const j = await r.json().catch(() => ({}));
    if (r.ok) onChange(j.url);
    else setErr(j.error || "Upload failed");
    setBusy(false);
  }

  return (
    <div className="space-y-2">
      {value && <img src={value} alt="" className="h-28 rounded-lg border border-line object-cover" />}
      <div className="flex gap-2">
        <input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="Paste image URL or upload →" className="input" />
        <label className="btn-ghost cursor-pointer shrink-0">
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} Upload
          <input type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
        </label>
      </div>
      {err && <p className="text-xs text-red-400">{err}</p>}
    </div>
  );
}
