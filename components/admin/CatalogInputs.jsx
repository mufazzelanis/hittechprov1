"use client";

import { useState } from "react";
import { Loader2, Upload, X, FileDown, Plus, Lock, ArrowLeft, ArrowRight } from "lucide-react";
import { images, parseFiles, parseJson, fmtSize } from "@/lib/catalog";

async function upload(url, file) {
  const fd = new FormData();
  fd.append("file", file);
  const r = await fetch(url, { method: "POST", body: fd });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "Upload failed");
  return j;
}

// Preview images (public), stored as one URL per line.
export function GalleryInput({ value, onChange }) {
  const list = images(value);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [url, setUrl] = useState("");
  const save = (next) => onChange(next.join("\n"));

  async function add(files) {
    setBusy(true);
    setErr("");
    const added = [];
    for (const f of Array.from(files || []).slice(0, 12 - list.length)) {
      try { added.push((await upload("/api/admin/upload", f)).url); } catch (e) { setErr(e.message); }
    }
    save([...list, ...added]);
    setBusy(false);
  }
  const move = (i, d) => { const n = [...list]; [n[i], n[i + d]] = [n[i + d], n[i]]; save(n); };

  return (
    <div className="space-y-2">
      {list.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {list.map((u, i) => (
            <div key={u + i} className="group relative aspect-[3/4] rounded-lg overflow-hidden border border-line bg-panel2">
              <img src={u} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex justify-between p-1 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move left" className="p-1 rounded text-white disabled:opacity-30"><ArrowLeft size={12} /></button>
                <button type="button" disabled={i === list.length - 1} onClick={() => move(i, 1)} aria-label="Move right" className="p-1 rounded text-white disabled:opacity-30"><ArrowRight size={12} /></button>
              </div>
              <button type="button" onClick={() => save(list.filter((_, j) => j !== i))} aria-label="Remove image" className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-500"><X size={12} /></button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste an image URL…" className="input"
          onKeyDown={(e) => { if (e.key === "Enter" && url.trim()) { e.preventDefault(); save([...list, url.trim()]); setUrl(""); } }} />
        {url.trim() && <button type="button" className="btn-ghost shrink-0" onClick={() => { save([...list, url.trim()]); setUrl(""); }}><Plus size={15} /> Add</button>}
        <label className="btn-ghost cursor-pointer shrink-0">
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} Upload
          <input type="file" accept="image/*" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
        </label>
      </div>
      {err && <p className="text-xs text-red-400">{err}</p>}
    </div>
  );
}

// Private paid files, stored as a JSON list of references. Uploads go to /api/admin/files (not /public).
export function FilesInput({ value, onChange }) {
  const list = parseFiles(value);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const save = (next) => onChange(JSON.stringify(next));

  async function add(files) {
    setErr("");
    let next = list;
    for (const f of Array.from(files || [])) {
      setBusy(f.name);
      try { next = [...next, (await upload("/api/admin/files", f)).file]; save(next); } catch (e) { setErr(e.message); }
    }
    setBusy("");
  }

  return (
    <div className="space-y-2">
      {list.length > 0 && (
        <ul className="rounded-lg border border-line divide-y divide-line">
          {list.map((f) => (
            <li key={f.id} className="flex items-center gap-3 px-3 py-2">
              <FileDown size={15} className="text-brand shrink-0" />
              <span className="flex-1 min-w-0 text-sm truncate">{f.name}</span>
              <span className="text-[11px] text-mist shrink-0">{fmtSize(f.size)}</span>
              <button type="button" onClick={() => save(list.filter((x) => x.id !== f.id))} aria-label={`Remove ${f.name}`} className="p-1 text-mist hover:text-red-400"><X size={14} /></button>
            </li>
          ))}
        </ul>
      )}
      <label className={`flex items-center justify-center gap-2 rounded-lg border border-dashed border-line px-4 py-4 text-sm text-mist cursor-pointer hover:border-brand hover:text-fg transition-colors ${busy ? "pointer-events-none opacity-70" : ""}`}>
        {busy ? <><Loader2 size={15} className="animate-spin" /> Uploading {busy}…</> : <><Upload size={15} /> Upload files (ZIP, PDF, PSD, AI, FIG, images… up to 200 MB each)</>}
        <input type="file" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
      </label>
      <p className="text-[11px] text-mist flex items-center gap-1.5"><Lock size={11} /> Stored privately. Buyers download them from their Client Area once the order is paid.</p>
      {err && <p className="text-xs text-red-400">{err}</p>}
    </div>
  );
}

const PRESETS = [
  { name: "Basic", price: "", priceUsd: "", days: 3, revisions: "1", features: "" },
  { name: "Standard", price: "", priceUsd: "", days: 5, revisions: "3", features: "" },
  { name: "Premium", price: "", priceUsd: "", days: 7, revisions: "Unlimited", features: "" },
];

// Up to three packages (Basic / Standard / Premium), saved as JSON.
export function PackagesInput({ value, onChange }) {
  const [list, setList] = useState(() => {
    const raw = parseJson(value, []);
    return Array.isArray(raw) && raw.length
      ? raw.map((p) => ({ ...p, features: Array.isArray(p.features) ? p.features.join("\n") : p.features || "" }))
      : [{ ...PRESETS[0] }];
  });
  const commit = (next) => {
    setList(next);
    onChange(JSON.stringify(next.map((p) => ({ ...p, features: String(p.features || "").split(/\r?\n/).map((x) => x.trim()).filter(Boolean) }))));
  };
  const set = (i, k, v) => commit(list.map((p, j) => (j === i ? { ...p, [k]: v } : p)));

  return (
    <div className="space-y-3">
      {list.map((p, i) => (
        <div key={i} className="rounded-xl border border-line p-3 space-y-2.5 bg-panel2/30">
          <div className="flex items-center gap-2">
            <input value={p.name} onChange={(e) => set(i, "name", e.target.value)} placeholder="Package name" className="input !py-2 font-semibold" />
            {list.length > 1 && <button type="button" onClick={() => commit(list.filter((_, j) => j !== i))} aria-label="Remove package" className="p-2 text-mist hover:text-red-400 shrink-0"><X size={15} /></button>}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <label className="text-[11px] text-mist">Price ৳ *<input type="number" min={0} value={p.price} onChange={(e) => set(i, "price", e.target.value)} className="input !py-2 mt-1" /></label>
            <label className="text-[11px] text-mist">Price $<input type="number" min={0} step="0.01" value={p.priceUsd} onChange={(e) => set(i, "priceUsd", e.target.value)} placeholder="auto" className="input !py-2 mt-1" /></label>
            <label className="text-[11px] text-mist">Delivery (days)<input type="number" min={0} value={p.days ?? ""} onChange={(e) => set(i, "days", e.target.value)} className="input !py-2 mt-1" /></label>
            <label className="text-[11px] text-mist">Revisions<input value={p.revisions ?? ""} onChange={(e) => set(i, "revisions", e.target.value)} placeholder="e.g. 3" className="input !py-2 mt-1" /></label>
          </div>
          <label className="block text-[11px] text-mist">What's included (one per line)
            <textarea rows={3} value={p.features} onChange={(e) => set(i, "features", e.target.value)} placeholder={"3 logo concepts\nSource files (AI, PNG, SVG)\nCommercial use"} className="input mt-1" />
          </label>
        </div>
      ))}
      {list.length < 3 && (
        <button type="button" onClick={() => commit([...list, { ...PRESETS[list.length] }])} className="btn-ghost w-full justify-center"><Plus size={15} /> Add {PRESETS[list.length].name} package</button>
      )}
    </div>
  );
}
