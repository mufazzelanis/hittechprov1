"use client";

import { useState } from "react";
import { Key, Eye, EyeOff, Loader2, Check, AlertTriangle } from "lucide-react";

// SMMIU API key, editable right where the admin is already looking at the balance/sync panel - no .env
// file, no server restart. "Test" calls the real balance endpoint with whatever is typed (even unsaved),
// so a bad key is caught immediately instead of failing silently later when an order tries to place.
export default function SmmApiKeyCard({ initial }) {
  const [key, setKey] = useState(initial || "");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null); // { ok, text }
  const dirty = key !== (initial || "");

  async function test(keyToTest) {
    const r = await fetch(`/api/admin/smm/balance?key=${encodeURIComponent(keyToTest)}`);
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || "Could not connect");
    return j;
  }

  async function saveAndTest() {
    if (!key.trim() || busy) return;
    setBusy(true);
    setStatus(null);
    try {
      const r = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ smmiuApiKey: key.trim() }) });
      if (!r.ok) throw new Error("Could not save");
      const b = await test(key.trim());
      setStatus({ ok: true, text: `Saved and connected - balance ${b.balance.toFixed(2)} ${b.currency}.` });
      setTimeout(() => window.location.reload(), 900);
    } catch (e) {
      setStatus({ ok: false, text: e.message || "Could not connect with this key." });
    }
    setBusy(false);
  }

  return (
    <div className="rounded-2xl border border-line bg-panel p-5">
      <div className="flex items-center gap-3 mb-3">
        <span className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0"><Key size={18} /></span>
        <div className="min-w-0">
          <p className="font-display font-semibold">SMMIU API key</p>
          <p className="text-xs text-mist mt-0.5">From my.smmiu.com -&gt; Account. Saved here takes effect immediately - no file edit, no restart.</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <input
            type={show ? "text" : "password"}
            autoComplete="off"
            className="input pr-10"
            placeholder="Paste your SMMIU API key"
            value={key}
            onChange={(e) => { setKey(e.target.value); setStatus(null); }}
          />
          <button type="button" onClick={() => setShow((x) => !x)} aria-label={show ? "Hide" : "Show"} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-mist hover:text-fg">
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        <button type="button" onClick={saveAndTest} disabled={busy || !key.trim() || !dirty} className="shrink-0 flex items-center gap-2 rounded-lg bg-brand hover:bg-brand-dark disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 transition-colors">
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Save &amp; test
        </button>
      </div>
      {status && (
        <p className={`text-sm mt-3 flex items-center gap-1.5 ${status.ok ? "text-emerald-400" : "text-red-400"}`}>
          {status.ok ? <Check size={14} /> : <AlertTriangle size={14} />} {status.text}
        </p>
      )}
    </div>
  );
}
