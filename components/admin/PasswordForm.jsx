"use client";

import { useState } from "react";

export default function PasswordForm() {
  const [msg, setMsg] = useState(null);

  async function submit(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const r = await fetch("/api/admin/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current: f.get("current"), next: f.get("next") }),
    });
    const j = await r.json().catch(() => ({}));
    setMsg({ ok: r.ok, text: r.ok ? "Password updated" : j.error });
    if (r.ok) e.currentTarget.reset();
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-line bg-panel p-6 max-w-3xl">
      <h2 className="font-display font-semibold mb-5">Change admin password</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-mist mb-1.5">Current password</label>
          <input name="current" type="password" required className="input" />
        </div>
        <div>
          <label className="block text-xs text-mist mb-1.5">New password (min 8)</label>
          <input name="next" type="password" required minLength={8} className="input" />
        </div>
      </div>
      <div className="flex items-center gap-4 mt-5">
        <button className="btn-primary">Update password</button>
        {msg && <span className={`text-sm ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>{msg.text}</span>}
      </div>
    </form>
  );
}
