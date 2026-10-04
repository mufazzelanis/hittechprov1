"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Users, ShieldCheck, History, UserPlus, Loader2, X, Check, Copy, KeyRound, LogOut, Ban, RotateCcw, UserMinus,
  Plus, Pencil, Trash2, Lock, Search, MoreHorizontal, AlertTriangle, Eye, Settings2, LogIn, ShieldAlert, Crown,
} from "lucide-react";
import { PERMISSION_GROUPS, can, expand } from "@/lib/permissions";

const COLORS = ["#E8352B", "#7C3AED", "#0EA5E9", "#10B981", "#F59E0B", "#EC4899", "#64748B", "#14B8A6"];
const initials = (n = "", e = "") => (n || e).split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "A";
const ago = (iso) => {
  if (!iso) return "Never";
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};
const fullDate = (iso) => new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
function genPassword() {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*";
  const buf = new Uint32Array(16);
  crypto.getRandomValues(buf);
  return Array.from(buf, (x) => a[x % a.length]).join("");
}

async function api(url, method = "GET", body) {
  const r = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, ...j };
}

function RoleChip({ role, className = "" }) {
  if (!role) return <span className="text-xs text-mist">No role</span>;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${className}`} style={{ background: role.color + "22", color: role.color }}>
      {role.key === "owner" && <Crown size={11} />}{role.name}
    </span>
  );
}

function Modal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <button className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} aria-label="Close" />
      <div className={`relative w-full ${wide ? "sm:max-w-3xl" : "sm:max-w-md"} max-h-[92dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-line bg-panel shadow-2xl`}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 h-14 border-b border-line bg-panel">
          <h2 className="font-display font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="p-1.5 text-mist hover:text-fg" aria-label="Close"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div className={`fixed bottom-24 lg:bottom-6 right-4 lg:right-6 z-[80] flex items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-glow ${msg.err ? "bg-red-500/10 border-red-500/40 text-red-300" : "bg-panel2 border-line"}`}>
      {msg.err ? <AlertTriangle size={16} /> : <Check size={16} className="text-emerald-400" />} {msg.text}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------
export default function TeamAdmin() {
  const [tab, setTab] = useState("members");
  const [data, setData] = useState(null);
  const [toast, setToast] = useState(null);
  const flash = useCallback((text, err = false) => { setToast({ text, err }); setTimeout(() => setToast(null), 3200); }, []);
  const load = useCallback(async () => {
    const j = await api("/api/admin/team");
    if (j.ok) setData(j); else flash(j.error || "Could not load the team", true);
  }, [flash]);
  useEffect(() => { load(); }, [load]);

  const manage = data ? can(data.me.perms, "team.manage") : false;
  const tabs = [
    ["members", "Members", Users, data?.members.length],
    ["roles", "Roles & permissions", ShieldCheck, data?.roles.length],
    ["activity", "Activity log", History],
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Team & Roles</h1>
          <p className="text-sm text-mist mt-1">Who can use this control panel, what each person can do, and everything they did.</p>
        </div>
        {!manage && data && <span className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs text-mist"><Eye size={13} /> View only</span>}
      </div>

      <div role="tablist" className="flex gap-1 border-b border-line overflow-x-auto no-scrollbar">
        {tabs.map(([id, label, Icon, n]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
            className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${tab === id ? "text-fg" : "text-mist hover:text-fg"}`}>
            <Icon size={15} /> {label}
            {n != null && <span className="rounded-full bg-panel2 px-1.5 text-[11px] text-mist">{n}</span>}
            {tab === id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand" />}
          </button>
        ))}
      </div>

      {!data ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="shimmer h-20" />)}</div>
      ) : tab === "members" ? (
        <Members data={data} manage={manage} reload={load} flash={flash} />
      ) : tab === "roles" ? (
        <Roles data={data} manage={manage} reload={load} flash={flash} />
      ) : (
        <Activity members={data.members} />
      )}
      <Toast msg={toast} />
    </div>
  );
}

// ---- Members --------------------------------------------------------------------------------------
function Members({ data, manage, reload, flash }) {
  const { me, members, roles } = data;
  const roleById = Object.fromEntries(roles.map((r) => [r.id, r]));
  const [adding, setAdding] = useState(false);
  const [menu, setMenu] = useState(null); // member id with open actions menu
  const [pw, setPw] = useState(null); // member to set a password for
  const [confirm, setConfirm] = useState(null); // { member, action }
  const [busy, setBusy] = useState("");
  const [q, setQ] = useState("");

  const owners = members.filter((m) => roleById[m.adminRoleId]?.key === "owner" && m.active).length;
  const shown = members.filter((m) => !q || `${m.name} ${m.email} ${roleById[m.adminRoleId]?.name}`.toLowerCase().includes(q.toLowerCase()));

  // Can the signed-in admin change this member at all?
  const editable = (m) => manage && m.id !== me.id && (me.isOwner || roleById[m.adminRoleId]?.key !== "owner");
  // Roles they may hand out: never more than they hold themselves, and Owner only if they are one.
  const grantable = roles.filter((r) => (r.key === "owner" ? me.isOwner : me.isOwner || r.permissions.every((p) => can(me.perms, p))));

  async function patch(m, body, ok) {
    setBusy(m.id);
    const j = await api(`/api/admin/team/${m.id}`, "PATCH", body);
    setBusy("");
    if (!j.ok) return flash(j.error || "Could not update", true);
    flash(ok);
    reload();
  }
  async function remove(m) {
    setBusy(m.id);
    const j = await api(`/api/admin/team/${m.id}`, "DELETE");
    setBusy("");
    setConfirm(null);
    if (!j.ok) return flash(j.error || "Could not remove", true);
    flash(`${m.name || m.email} was removed from the team`);
    reload();
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ["Team members", members.length, Users, "text-sky-400 bg-sky-500/10"],
          ["Active", members.filter((m) => m.active).length, Check, "text-emerald-400 bg-emerald-500/10"],
          ["Suspended", members.filter((m) => !m.active).length, Ban, "text-amber-400 bg-amber-500/10"],
          ["Owners", owners, Crown, "text-brand bg-brand/10"],
        ].map(([l, v, I, tone]) => (
          <div key={l} className="rounded-xl border border-line bg-panel p-3.5">
            <div className="flex items-center justify-between"><span className="text-xs text-mist">{l}</span><span className={`w-7 h-7 rounded-lg flex items-center justify-center ${tone}`}><I size={13} /></span></div>
            <p className="font-display font-bold text-xl mt-1.5">{v}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mist" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search members…" className="input pl-9" />
        </div>
        <div className="flex-1" />
        {manage && <button className="btn-primary" onClick={() => setAdding(true)}><UserPlus size={16} /> Add member</button>}
      </div>

      <div className="rounded-2xl border border-line bg-panel divide-y divide-line">
        {shown.map((m) => {
          const role = roleById[m.adminRoleId];
          const can_ = editable(m);
          return (
            <div key={m.id} className={`flex flex-wrap items-center gap-x-4 gap-y-3 p-4 ${m.active ? "" : "opacity-70"}`}>
              <span className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: `linear-gradient(135deg, ${role?.color || "#64748B"}, ${role?.color || "#64748B"}99)` }}>{initials(m.name, m.email)}</span>
              <div className="min-w-0 flex-1 basis-48">
                <p className="font-semibold truncate flex items-center gap-2">
                  {m.name || "—"}
                  {m.id === me.id && <span className="rounded-full bg-brand/15 text-brand px-1.5 py-px text-[10px] font-bold">YOU</span>}
                  {!m.active && <span className="rounded-full bg-amber-500/15 text-amber-300 px-1.5 py-px text-[10px] font-bold">SUSPENDED</span>}
                </p>
                <p className="text-xs text-mist truncate">{m.email}</p>
              </div>
              <div className="w-44">
                {can_ ? (
                  <select value={m.adminRoleId || ""} disabled={busy === m.id} onChange={(e) => patch(m, { roleId: e.target.value }, `Role changed to ${roleById[e.target.value]?.name}`)}
                    className="input !py-1.5 text-sm" aria-label={`Role for ${m.name}`}>
                    {!grantable.some((r) => r.id === m.adminRoleId) && role && <option value={role.id}>{role.name}</option>}
                    {grantable.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                ) : <RoleChip role={role} />}
              </div>
              <div className="w-28 text-xs text-mist" title={m.lastLoginAt ? fullDate(m.lastLoginAt) : "Has never signed in"}>
                <span className="block text-[10px] uppercase tracking-wider">Last sign-in</span>{ago(m.lastLoginAt)}
              </div>
              <div className="relative ml-auto">
                {busy === m.id ? <Loader2 size={18} className="animate-spin text-mist m-2" /> : can_ ? (
                  <button type="button" onClick={() => setMenu(menu === m.id ? null : m.id)} aria-label={`Actions for ${m.name}`} aria-expanded={menu === m.id} className="p-2 rounded-lg text-mist hover:text-fg hover:bg-panel2"><MoreHorizontal size={18} /></button>
                ) : <span className="block w-9" />}
                {menu === m.id && (
                  <ActionMenu onClose={() => setMenu(null)} items={[
                    m.active
                      ? { icon: Ban, label: "Suspend access", onClick: () => setConfirm({ m, kind: "suspend" }) }
                      : { icon: RotateCcw, label: "Reactivate", onClick: () => patch(m, { active: true }, `${m.name} can sign in again`) },
                    { icon: LogOut, label: "Sign out of all devices", onClick: () => patch(m, { signOut: true }, `${m.name} was signed out everywhere`) },
                    { icon: KeyRound, label: "Set a new password", onClick: () => setPw(m) },
                    { icon: UserMinus, label: "Remove from team", danger: true, onClick: () => setConfirm({ m, kind: "remove" }) },
                  ]} />
                )}
              </div>
            </div>
          );
        })}
        {shown.length === 0 && <p className="p-10 text-center text-sm text-mist">No members match “{q}”.</p>}
      </div>

      <p className="text-xs text-mist flex items-start gap-2"><ShieldAlert size={14} className="shrink-0 mt-px" /> Changing someone's role, suspending them or setting their password signs them out of every device immediately. At least one active Owner always remains, and you can't change your own access.</p>

      {adding && <AddMember roles={grantable} onClose={() => setAdding(false)} onDone={(msg) => { setAdding(false); flash(msg); reload(); }} flash={flash} />}
      {pw && <SetPassword member={pw} onClose={() => setPw(null)} onSave={async (password) => { await patch(pw, { password }, `New password set for ${pw.name}`); setPw(null); }} />}
      {confirm && (
        <Modal title={confirm.kind === "remove" ? "Remove from team?" : "Suspend access?"} onClose={() => setConfirm(null)}>
          <p className="text-sm text-fg/85 leading-relaxed">
            {confirm.kind === "remove"
              ? <><b>{confirm.m.name || confirm.m.email}</b> loses access to the control panel right away. Their customer account and order history are kept.</>
              : <><b>{confirm.m.name || confirm.m.email}</b> is signed out now and can't sign in until you reactivate them. Nothing is deleted.</>}
          </p>
          <div className="flex justify-end gap-2 mt-6">
            <button className="btn-ghost" onClick={() => setConfirm(null)}>Cancel</button>
            <button className="btn-primary !bg-red-600 hover:!bg-red-700" onClick={() => (confirm.kind === "remove" ? remove(confirm.m) : (setConfirm(null), patch(confirm.m, { active: false }, `${confirm.m.name} was suspended`)))}>
              {confirm.kind === "remove" ? <><UserMinus size={15} /> Remove</> : <><Ban size={15} /> Suspend</>}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ActionMenu({ items, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const close = (e) => { if (!ref.current?.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [onClose]);
  return (
    <div ref={ref} role="menu" className="absolute right-0 top-full mt-1 z-30 w-56 rounded-xl border border-line bg-panel p-1.5 shadow-2xl">
      {items.map((it) => (
        <button key={it.label} role="menuitem" type="button" onClick={() => { onClose(); it.onClick(); }}
          className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-left ${it.danger ? "text-red-400 hover:bg-red-500/10" : "text-mist hover:text-fg hover:bg-panel2"}`}>
          <it.icon size={15} /> {it.label}
        </button>
      ))}
    </div>
  );
}

function PasswordInput({ value, onChange }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex gap-2">
      <input value={value} onChange={(e) => onChange(e.target.value)} className="input font-mono" autoComplete="new-password" placeholder="At least 10 characters" />
      <button type="button" className="btn-ghost shrink-0" onClick={() => onChange(genPassword())} title="Generate a strong password"><KeyRound size={15} /></button>
      <button type="button" className="btn-ghost shrink-0" disabled={!value} onClick={() => { navigator.clipboard?.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1400); }} title="Copy">
        {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
      </button>
    </div>
  );
}

function AddMember({ roles, onClose, onDone, flash }) {
  const [f, setF] = useState({ name: "", email: "", roleId: roles.find((r) => r.key === "support")?.id || roles[roles.length - 1]?.id || "", password: genPassword() });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [promote, setPromote] = useState(null); // { name } when the email belongs to a customer
  const role = roles.find((r) => r.id === f.roleId);

  async function submit(e, asPromote = false) {
    e?.preventDefault();
    setBusy(true);
    setErr("");
    const j = await api("/api/admin/team", "POST", { ...f, promote: asPromote });
    setBusy(false);
    if (j.code === "customer_exists") return setPromote({ name: j.name });
    if (!j.ok) return setErr(j.error || "Could not add");
    onDone(asPromote ? `${f.email} promoted to ${role?.name}` : `${f.name} added as ${role?.name}. Share their password securely.`);
  }

  if (promote) {
    return (
      <Modal title="Promote a customer account?" onClose={onClose}>
        <p className="text-sm leading-relaxed"><b>{f.email}</b> already has a customer account{promote.name ? ` (${promote.name})` : ""}. Promote it to <RoleChip role={role} />? They'll sign in to the control panel with <b>their existing password</b>.</p>
        {err && <p className="text-sm text-red-400 mt-3">{err}</p>}
        <div className="flex justify-end gap-2 mt-6">
          <button className="btn-ghost" onClick={() => setPromote(null)}>Back</button>
          <button className="btn-primary" disabled={busy} onClick={() => submit(null, true)}>{busy ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Promote</button>
        </div>
      </Modal>
    );
  }
  return (
    <Modal title="Add a team member" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-xs text-mist">Full name<input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="input mt-1.5" /></label>
        <label className="block text-xs text-mist">Email<input required type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className="input mt-1.5" /></label>
        <label className="block text-xs text-mist">Role
          <select value={f.roleId} onChange={(e) => setF({ ...f, roleId: e.target.value })} className="input mt-1.5">
            {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </label>
        {role?.description && <p className="rounded-lg bg-panel2/60 border border-line px-3 py-2 text-xs text-mist leading-relaxed">{role.description}</p>}
        <div>
          <p className="text-xs text-mist mb-1.5">Starting password</p>
          <PasswordInput value={f.password} onChange={(password) => setF({ ...f, password })} />
          <p className="text-[11px] text-mist mt-1.5">Copy it and send it privately. They can change it from Settings → Security after signing in.</p>
        </div>
        {err && <p className="text-sm text-red-400">{err}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy}>{busy ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />} Add member</button>
        </div>
      </form>
    </Modal>
  );
}

function SetPassword({ member, onClose, onSave }) {
  const [pw, setPw] = useState(genPassword());
  const [busy, setBusy] = useState(false);
  return (
    <Modal title={`New password for ${member.name || member.email}`} onClose={onClose}>
      <PasswordInput value={pw} onChange={setPw} />
      <p className="text-xs text-mist mt-2">They're signed out everywhere and must use this password next time. Share it privately.</p>
      <div className="flex justify-end gap-2 mt-6">
        <button className="btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn-primary" disabled={busy || pw.length < 10} onClick={async () => { setBusy(true); await onSave(pw); setBusy(false); }}>{busy ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />} Set password</button>
      </div>
    </Modal>
  );
}

// ---- Roles ----------------------------------------------------------------------------------------
function Roles({ data, manage, reload, flash }) {
  const { me, roles } = data;
  const [editing, setEditing] = useState(null); // role object, or {} for a new role
  const [del, setDel] = useState(null);
  const total = PERMISSION_GROUPS.reduce((n, g) => n + g.perms.length, 0);

  async function remove(r) {
    const j = await api(`/api/admin/roles/${r.id}`, "DELETE");
    setDel(null);
    if (!j.ok) return flash(j.error || "Could not delete", true);
    flash(`Role "${r.name}" deleted`);
    reload();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-mist max-w-2xl">A role is a set of permissions. Every member has exactly one. Changes apply to everyone with that role on their next click.</p>
        {manage && <button className="btn-primary" onClick={() => setEditing({})}><Plus size={16} /> Create role</button>}
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {roles.map((r) => {
          const all = r.permissions.includes("*");
          const n = all ? total : expand(r.permissions).length;
          return (
            <div key={r.id} className="rounded-2xl border border-line bg-panel p-5 flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: r.color + "22", color: r.color }}>{r.key === "owner" ? <Crown size={17} /> : <ShieldCheck size={17} />}</span>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{r.name}</p>
                    <p className="text-[11px] text-mist">{r.system ? "Built-in" : "Custom"} · {r.members} member{r.members === 1 ? "" : "s"}</p>
                  </div>
                </div>
                {manage && r.key !== "owner" && (
                  <div className="flex shrink-0">
                    <button onClick={() => setEditing(r)} className="p-2 text-mist hover:text-fg" aria-label={`Edit ${r.name}`}><Pencil size={15} /></button>
                    {!r.system && <button onClick={() => setDel(r)} className="p-2 text-mist hover:text-red-400" aria-label={`Delete ${r.name}`}><Trash2 size={15} /></button>}
                  </div>
                )}
                {r.key === "owner" && <Lock size={15} className="text-mist mt-2" aria-label="Locked" />}
              </div>
              {r.description && <p className="text-xs text-mist mt-3 leading-relaxed">{r.description}</p>}
              <div className="mt-auto pt-4">
                <div className="flex justify-between text-[11px] text-mist mb-1.5"><span>Permissions</span><span>{all ? "Everything" : `${n} of ${total}`}</span></div>
                <div className="h-1.5 rounded-full bg-panel2 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(n / total) * 100}%`, background: r.color }} /></div>
                <div className="flex flex-wrap gap-1 mt-3">
                  {PERMISSION_GROUPS.map((g) => {
                    const mg = g.perms.some(([p]) => p.endsWith(".manage") && (all || can(r.permissions, p)));
                    const vw = all || g.perms.some(([p]) => can(r.permissions, p));
                    if (!vw) return null;
                    return <span key={g.id} className={`rounded px-1.5 py-0.5 text-[10px] ${mg ? "bg-emerald-500/15 text-emerald-300" : "bg-panel2 text-mist"}`} title={mg ? "Can manage" : "View only"}>{g.label}</span>;
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {editing && <RoleEditor role={editing} roles={roles} me={me} onClose={() => setEditing(null)} onSaved={(msg) => { setEditing(null); flash(msg); reload(); }} />}
      {del && (
        <Modal title={`Delete "${del.name}"?`} onClose={() => setDel(null)}>
          <p className="text-sm">{del.members ? `${del.members} member(s) still have this role. Move them to another role first.` : "This custom role will be deleted. This can't be undone."}</p>
          <div className="flex justify-end gap-2 mt-6">
            <button className="btn-ghost" onClick={() => setDel(null)}>Cancel</button>
            {!del.members && <button className="btn-primary !bg-red-600 hover:!bg-red-700" onClick={() => remove(del)}><Trash2 size={15} /> Delete</button>}
          </div>
        </Modal>
      )}
    </div>
  );
}

function RoleEditor({ role, roles, me, onClose, onSaved }) {
  const isNew = !role.id;
  const [name, setName] = useState(role.name || "");
  const [description, setDescription] = useState(role.description || "");
  const [color, setColor] = useState(role.color || COLORS[2]);
  const [perms, setPerms] = useState(new Set(role.permissions || ["dashboard.view"]));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const mine = (p) => me.isOwner || can(me.perms, p);

  const toggle = (p, on) => {
    const next = new Set(perms);
    if (on) next.add(p); else next.delete(p);
    // "manage" implies "view" of the same area; un-ticking "view" also removes "manage".
    const [area, kind] = p.split(".");
    if (on && kind === "manage") next.delete(`${area}.view`);
    if (!on && kind === "view") { next.delete(`${area}.manage`); next.delete(`${area}.create`); }
    setPerms(next);
  };
  const startFrom = (id) => { const r = roles.find((x) => x.id === id); if (r) setPerms(new Set(r.permissions.filter((p) => p !== "*" && mine(p)))); };

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const body = { name, description, color, permissions: [...perms] };
    const j = isNew ? await api("/api/admin/roles", "POST", body) : await api(`/api/admin/roles/${role.id}`, "PUT", body);
    setBusy(false);
    if (!j.ok) return setErr(j.error || "Could not save");
    onSaved(isNew ? `Role "${name}" created` : `Role "${name}" updated`);
  }

  return (
    <Modal title={isNew ? "Create role" : `Edit ${role.name}`} onClose={onClose} wide>
      <form onSubmit={save} className="space-y-5">
        <div className="grid sm:grid-cols-[1fr_auto] gap-4">
          <label className="block text-xs text-mist">Role name<input required value={name} onChange={(e) => setName(e.target.value)} maxLength={40} className="input mt-1.5" placeholder="e.g. Order Handler" /></label>
          <div className="text-xs text-mist">Colour
            <div className="flex gap-1.5 mt-2.5">
              {COLORS.map((c) => <button key={c} type="button" onClick={() => setColor(c)} aria-label={`Colour ${c}`} className={`w-6 h-6 rounded-full transition-transform ${color === c ? "ring-2 ring-offset-2 ring-offset-panel scale-110" : ""}`} style={{ background: c, "--tw-ring-color": c }} />)}
            </div>
          </div>
        </div>
        <label className="block text-xs text-mist">What is this role for? (optional)<input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} className="input mt-1.5" placeholder="Handles customer orders and deliveries" /></label>
        {isNew && (
          <label className="block text-xs text-mist">Start from
            <select defaultValue="" onChange={(e) => startFrom(e.target.value)} className="input mt-1.5">
              <option value="" disabled>Copy permissions from a role…</option>
              {roles.filter((r) => r.key !== "owner").map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </label>
        )}

        <div className="rounded-xl border border-line overflow-hidden">
          <div className="grid grid-cols-[1fr_auto] gap-4 px-4 py-2.5 bg-panel2/50 text-[11px] font-semibold uppercase tracking-wider text-mist">
            <span>Area & permission</span><span>Allowed</span>
          </div>
          {PERMISSION_GROUPS.map((g) => (
            <div key={g.id} className="border-t border-line">
              <p className="px-4 pt-3 pb-1 text-sm font-semibold">{g.label}</p>
              {g.perms.map(([p, desc]) => {
                const on = can([...perms], p);
                const implied = on && !perms.has(p);
                const locked = !mine(p);
                return (
                  <label key={p} className={`grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-2 ${locked ? "opacity-50" : "cursor-pointer hover:bg-panel2/40"}`}>
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 text-sm">
                        {p.endsWith(".view") ? <Eye size={13} className="text-mist" /> : p.endsWith(".create") ? <Plus size={13} className="text-mist" /> : <Settings2 size={13} className="text-mist" />}
                        <span className="font-mono text-[12px] text-mist">{p}</span>
                        {implied && <span className="text-[10px] text-emerald-400">included by manage</span>}
                        {locked && <span className="text-[10px] text-amber-300" title="You can't grant a permission you don't have">you don't have this</span>}
                      </span>
                      <span className="block text-xs text-fg/70 mt-0.5">{desc}</span>
                    </span>
                    <input type="checkbox" checked={on} disabled={locked || implied} onChange={(e) => toggle(p, e.target.checked)} className="w-4 h-4 accent-[#E8352B]" />
                  </label>
                );
              })}
            </div>
          ))}
        </div>

        {err && <p className="text-sm text-red-400">{err}</p>}
        <div className="sticky bottom-0 -mx-5 -mb-5 px-5 py-4 border-t border-line bg-panel flex items-center justify-between gap-3">
          <span className="text-xs text-mist">{[...perms].length} permission{[...perms].length === 1 ? "" : "s"} ticked</span>
          <div className="flex gap-2">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn-primary" disabled={busy || !name.trim() || perms.size === 0}>{busy ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} {isNew ? "Create role" : "Save changes"}</button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

// ---- Activity log ---------------------------------------------------------------------------------
const AREAS = [["", "Everything"], ["auth", "Sign-ins"], ["team", "Team changes"], ["role", "Role changes"], ["settings", "Settings"], ["orders", "Orders"], ["products", "Digital products"], ["services", "Services"], ["tools", "Tools"]];
const LABEL = {
  "auth.login": "signed in", "auth.logout": "signed out", "auth.login_failed": "failed sign-in attempt", "auth.login_blocked": "blocked sign-in (suspended)",
  "auth.password_change": "changed their password", "auth.password_reset": "reset password by email",
  "team.add": "added a team member", "team.role_change": "changed a role", "team.suspend": "suspended", "team.reactivate": "reactivated",
  "team.sign_out": "signed out of all devices", "team.password_reset": "set a new password for", "team.remove": "removed from team",
  "role.create": "created role", "role.update": "edited role", "role.delete": "deleted role", "settings.update": "changed settings",
};
const describe = (a) => LABEL[a] || a.replace(/^(\w+)\.(\w+)$/, (_, area, act) => `${act.replace("_", " ")} in ${area}`);
const iconFor = (a) => (a.startsWith("auth.login_failed") || a.startsWith("auth.login_blocked") ? ShieldAlert : a.startsWith("auth.") ? LogIn : a.startsWith("team.") ? Users : a.startsWith("role.") ? ShieldCheck : a.startsWith("settings.") ? Settings2 : Pencil);

function Activity({ members }) {
  const [area, setArea] = useState("");
  const [actor, setActor] = useState("");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState(null);
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);

  const query = useMemo(() => new URLSearchParams({ ...(area && { area }), ...(actor && { actor }), ...(q.trim() && { q: q.trim() }) }), [area, actor, q]);
  const load = useCallback(async (append = false, before) => {
    setBusy(true);
    const p = new URLSearchParams(query);
    if (before) p.set("before", before);
    const j = await api(`/api/admin/audit?${p}`);
    setBusy(false);
    setRows((r) => (append ? [...(r || []), ...(j.rows || [])] : j.rows || []));
    setMore(!!j.more);
  }, [query]);
  useEffect(() => { const t = setTimeout(() => load(), q ? 300 : 0); return () => clearTimeout(t); }, [load, q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <select value={area} onChange={(e) => setArea(e.target.value)} className="input !w-auto">{AREAS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <select value={actor} onChange={(e) => setActor(e.target.value)} className="input !w-auto">
          <option value="">All members</option>
          {members.map((m) => <option key={m.id} value={m.id}>{m.name || m.email}</option>)}
        </select>
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mist" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search email, item, IP…" className="input pl-9" />
        </div>
      </div>
      <div className="rounded-2xl border border-line bg-panel divide-y divide-line/70">
        {rows === null && <div className="p-4 space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="shimmer h-10" />)}</div>}
        {rows?.length === 0 && <p className="p-10 text-center text-sm text-mist">Nothing logged yet for this filter.</p>}
        {rows?.map((r) => {
          const Icon = iconFor(r.action);
          const warn = r.action === "auth.login_failed" || r.action === "auth.login_blocked";
          return (
            <div key={r.id} className="flex gap-3 px-4 py-3">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${warn ? "bg-amber-500/15 text-amber-300" : "bg-panel2 text-mist"}`}><Icon size={14} /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm"><b>{r.actorName || "Someone"}</b> <span className="text-fg/80">{describe(r.action)}</span>{r.target && <> · <span className="font-medium break-all">{r.target}</span></>}</p>
                {r.detail && <p className="text-xs text-mist mt-0.5 break-words">{r.detail}</p>}
              </div>
              <div className="text-right shrink-0 text-[11px] text-mist" title={fullDate(r.createdAt)}>
                <p>{ago(r.createdAt)}</p>
                {r.ip && <p className="font-mono mt-0.5">{r.ip}</p>}
              </div>
            </div>
          );
        })}
      </div>
      {more && <button className="btn-ghost mx-auto flex" disabled={busy} onClick={() => load(true, rows[rows.length - 1]?.createdAt)}>{busy && <Loader2 size={15} className="animate-spin" />} Load older</button>}
    </div>
  );
}
