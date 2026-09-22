"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

// Big ON/OFF switch that saves one setting (e.g. affiliateOn, freeOffersOn) straight away.
export default function MasterToggle({ settingKey, initial, name, onText, offText }) {
  const router = useRouter();
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function flip() {
    const next = !on;
    setBusy(true);
    const r = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [settingKey]: next ? "true" : "false" }) });
    if (r.ok) {
      setOn(next);
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <div className={`rounded-2xl border p-5 flex flex-wrap items-center gap-4 ${on ? "border-emerald-500/40 bg-emerald-500/[0.06]" : "border-line bg-panel"}`}>
      <div className="flex-1 min-w-[240px]">
        <p className="font-display font-semibold">{name} is {on ? "ON" : "OFF"}</p>
        <p className="text-xs text-mist mt-1 leading-relaxed">{on ? onText : offText}</p>
      </div>
      <button type="button" role="switch" aria-checked={on} aria-label={`Turn ${name} ${on ? "off" : "on"}`} disabled={busy} onClick={flip} className={`relative w-14 h-8 rounded-full transition-colors ${on ? "bg-emerald-500" : "bg-panel2 border border-line"}`}>
        {busy ? <Loader2 size={16} className="absolute inset-0 m-auto animate-spin" /> : <span className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${on ? "left-7" : "left-1"}`} />}
      </button>
    </div>
  );
}
