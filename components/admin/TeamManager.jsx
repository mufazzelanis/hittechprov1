"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, ShieldCheck, Trash2, UserPlus, X } from "lucide-react";

const tk = (iso) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

// Adding another admin only happens from here - a signed-in admin creating a teammate's account - never
// through a public sign-up form. See app/api/admin/team/route.js for why that split matters.
export default function TeamManager() {
  const [rows, setRows] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [removing, setRemoving] = useState("");

  async function load() {
    const r = await fetch("/api/admin/team", { cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    setRows(j.rows || []);
  }
  useEffect(() => { load(); }, []);

  async function add(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const r = await fetch("/api/admin/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setErr(j.error || "Could not add admin");
    setForm({ name: "", email: "", password: "" });
    setOpen(false);
    load();
  }

  async function remove(id) {
    if (!confirm("Remove this admin's access? This can't be undone.")) return;
    setRemoving(id);
    const r = await fetch(`/api/admin/team/${id}`, { method: "DELETE" });
    const j = await r.json().catch(() => ({}));
    setRemoving("");
    if (!r.ok) return alert(j.error || "Could not remove");
    load();
  }

  return (
    <div className="rounded-2xl border border-line bg-panel p-6 max-w-3xl">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h2 className="font-display font-semibold flex items-center gap-2"><ShieldCheck size={17} className="text-brand" /> Admin team</h2>
        {!open && <button type="button" onClick={() => { setOpen(true); setErr(""); }} className="btn-ghost !py-1.5 !px-3 text-xs"><UserPlus size={14} /> Add admin</button>}
      </div>
      <p className="text-xs text-mist mb-5">People who can sign in to this control panel. Only add someone you trust with full access.</p>

      {open && (
        <form onSubmit={add} className="rounded-xl border border-line bg-panel2/40 p-4 mb-5 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <input required placeholder="Full name" className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <input required type="email" placeholder="Email address" className="input" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <input required type="password" minLength={8} placeholder="Password (min 8 characters)" className="input" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          {err && <p className="text-sm text-red-400">{err}</p>}
          <div className="flex items-center gap-3">
            <button disabled={busy} className="btn-primary !py-2 !px-4 text-sm">{busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Create account</button>
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost !py-2 !px-4 text-sm"><X size={14} /> Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {rows === null && <p className="text-sm text-mist">Loading…</p>}
        {rows?.map((u) => (
          <div key={u.id} className="flex items-center gap-3 rounded-xl border border-line bg-panel2/30 px-4 py-3">
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium truncate">{u.name}</span>
              <span className="block text-xs text-mist truncate">{u.email} · added {tk(u.createdAt)}</span>
            </span>
            <button
              type="button" onClick={() => remove(u.id)} disabled={removing === u.id || rows.length <= 1}
              title={rows.length <= 1 ? "At least one admin must remain" : "Remove access"}
              className="p-2 text-mist hover:text-red-400 disabled:opacity-30 disabled:hover:text-mist shrink-0"
            >
              {removing === u.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
