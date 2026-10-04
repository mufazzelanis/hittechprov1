"use client";

import { useState } from "react";
import { Check, Clock, RefreshCw } from "lucide-react";
import { BuyButtons } from "./StoreBits";
import { fmtUsd, fmtTaka, serviceLineId } from "@/lib/catalog";

// Package tabs (Basic / Standard / Premium) with what each includes, and a buy button for the chosen one.
// packages: [{ key, name, price, usd, days, revisions, features }]
export default function ServicePackages({ service, packages }) {
  const [i, setI] = useState(Math.min(1, packages.length - 1)); // start on the middle package if there is one
  const p = packages[i];
  if (!p) return null;
  const item = { type: "service", id: serviceLineId(service.id, p.key), name: `${service.name} — ${p.name}`, price: p.price, usd: p.usd, image: service.image || null };

  return (
    <div className="rounded-2xl border border-line bg-panel overflow-hidden">
      {packages.length > 1 && (
        <div role="tablist" aria-label="Packages" className="grid border-b border-line" style={{ gridTemplateColumns: `repeat(${packages.length}, 1fr)` }}>
          {packages.map((x, j) => (
            <button key={x.key} role="tab" type="button" aria-selected={i === j} onClick={() => setI(j)}
              className={`relative py-3.5 text-sm font-semibold transition-colors ${i === j ? "text-fg bg-brand/[0.07]" : "text-mist hover:text-fg"}`}>
              {x.name}
              {i === j && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-brand" />}
            </button>
          ))}
        </div>
      )}
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
          <span className="font-display text-4xl font-bold">{p.usd ? fmtUsd(p.usd) : fmtTaka(p.price)}</span>
          {p.usd && <span className="text-sm text-mist pb-1.5">or {fmtTaka(p.price)} with bKash / Nagad</span>}
        </div>
        <div className="flex flex-wrap gap-4 mt-3 text-sm text-mist">
          {p.days && <span className="flex items-center gap-1.5"><Clock size={15} className="text-brand" /> {p.days}-day delivery</span>}
          {p.revisions && <span className="flex items-center gap-1.5"><RefreshCw size={15} className="text-brand" /> {/^\d+$/.test(p.revisions) ? `${p.revisions} revision${p.revisions === "1" ? "" : "s"}` : `${p.revisions} revisions`}</span>}
        </div>
        {p.features.length > 0 && (
          <ul className="mt-5 space-y-2.5">
            {p.features.map((f) => <li key={f} className="flex items-start gap-2.5 text-sm"><Check size={16} className="text-emerald-400 shrink-0 mt-0.5" /> {f}</li>)}
          </ul>
        )}
        <BuyButtons item={item} buyLabel={`Continue (${p.usd ? fmtUsd(p.usd) : fmtTaka(p.price)})`} className="mt-6" />
        <p className="text-[11px] text-mist mt-3 text-center">After payment you'll send us your requirements from your Client Area.</p>
      </div>
    </div>
  );
}
