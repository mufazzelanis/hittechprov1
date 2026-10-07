"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Users, UserCheck, Repeat, AlertTriangle, Search, X, ChevronDown, MapPin, Monitor, Smartphone, Tablet,
  ShoppingBag, Loader2, Globe2, Fingerprint, Wifi,
} from "lucide-react";
import { downloadCsv } from "./Bulk";

const money = (n) => "৳" + Math.round(n || 0).toLocaleString("en-US");
const fmtDT = (iso) => new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const DEVICE_ICON = { mobile: Smartphone, tablet: Tablet, desktop: Monitor };

function timeAgo(iso) {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Count({ to, className = "" }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf, t0;
    const step = (t) => { t0 ??= t; const p = Math.min(1, (t - t0) / 600); setV(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <span className={className}>{v.toLocaleString("en-US")}</span>;
}

function CustomerRow({ row }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const DevIcon = DEVICE_ICON[row.device] || Monitor;

  async function toggle() {
    setOpen((o) => !o);
    if (!detail) {
      const r = await fetch(`/api/admin/customers/${encodeURIComponent(row.email)}`);
      setDetail(r.ok ? await r.json() : { timeline: [], ips: [], devices: [], orders: [] });
    }
  }

  return (
    <>
      <tr className="border-t border-line/60 hover:bg-panel2/40 cursor-pointer" onClick={toggle}>
        <td className="px-4 py-3 align-top">
          <div className="flex items-center gap-2">
            <ChevronDown size={14} className={`shrink-0 text-mist transition-transform ${open ? "rotate-180" : ""}`} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="font-medium truncate">{row.name || row.email}</p>
                {row.online && <span className="relative flex w-1.5 h-1.5 shrink-0" title="Online now"><span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75 animate-ping" /><span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-emerald-400" /></span>}
              </div>
              <p className="text-xs text-mist truncate">{row.email}</p>
              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                {row.orders?.count > 1 && <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 text-violet-300 px-1.5 py-0.5 text-[10px] font-semibold"><Repeat size={9} /> Repeat</span>}
                {row.flagged && <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-300 px-1.5 py-0.5 text-[10px] font-semibold" title={`${row.ipCount} IPs, ${row.locationCount} locations`}><AlertTriangle size={9} /> Multiple locations</span>}
                {row.account && <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 text-sky-300 px-1.5 py-0.5 text-[10px] font-semibold"><UserCheck size={9} /> Account</span>}
              </div>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 align-top text-xs text-mist whitespace-nowrap">{row.phone || "—"}</td>
        <td className="px-4 py-3 align-top text-xs text-mist whitespace-nowrap"><span className="flex items-center gap-1.5"><MapPin size={12} /> {row.location || "Unknown"}</span><span className="block mt-0.5">{row.ip}</span></td>
        <td className="px-4 py-3 align-top text-xs whitespace-nowrap"><span className="flex items-center gap-1.5"><DevIcon size={13} className="text-mist" /> {row.browser}</span><span className="block text-mist mt-0.5">{row.os}</span></td>
        <td className="px-4 py-3 align-top text-sm text-center whitespace-nowrap">{row.sessionCount} <span className="text-mist text-xs">sessions</span><span className="block text-mist text-xs">{row.pageCount} pages</span></td>
        <td className="px-4 py-3 align-top text-xs text-mist whitespace-nowrap">{fmtDT(row.lastSeen)}<span className="block mt-0.5">{timeAgo(row.lastSeen)}</span></td>
        <td className="px-4 py-3 align-top text-right">
          {row.orders ? <a href={`/admin/orders?q=${encodeURIComponent(row.email)}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-300 px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap"><ShoppingBag size={11} /> {row.orders.count} order{row.orders.count > 1 ? "s" : ""} · {money(row.orders.total)}</a> : <span className="text-[11px] text-mist">No orders yet</span>}
        </td>
      </tr>
      {open && (
        <tr className="border-t border-line/60 bg-panel2/20">
          <td colSpan={7} className="px-4 py-4">
            {!detail ? <Loader2 size={16} className="animate-spin text-mist" /> : (
              <div className="grid lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <p className="text-[11px] uppercase tracking-wider text-mist mb-2">Activity timeline ({detail.timeline.length}) · first seen {fmtDT(row.firstSeen)}</p>
                  <ol className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                    {detail.timeline.map((t, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs">
                        <span className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] mt-0.5 ${t.type === "order" ? "bg-emerald-500/15 text-emerald-300" : "bg-panel2 border border-line text-mist"}`}>{t.type === "order" ? <ShoppingBag size={10} /> : i + 1}</span>
                        {t.type === "order" ? (
                          <span className="min-w-0"><span className="font-semibold text-emerald-300">Order #{t.number}</span> <span className="text-fg/90">{t.itemName}</span> <span className="text-mist">— {money(t.amount)} ({t.status})</span></span>
                        ) : (
                          <span className="font-mono text-fg/90 truncate flex-1">{t.path}</span>
                        )}
                        <span className="text-mist shrink-0 ml-auto">{fmtDT(t.at)}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-mist mb-2 flex items-center gap-1.5"><Wifi size={11} /> IPs used ({detail.ips.length})</p>
                    <div className="space-y-1">
                      {detail.ips.slice(0, 8).map((ip) => (
                        <p key={ip.ip} className="text-xs flex items-center justify-between gap-2 rounded-lg bg-panel2 px-2.5 py-1.5"><span className="font-mono">{ip.ip}</span><span className="text-mist truncate">{ip.location || "Unknown"}</span></p>
                      ))}
                      {detail.ips.length === 0 && <p className="text-xs text-mist">No IP recorded.</p>}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-mist mb-2 flex items-center gap-1.5"><Fingerprint size={11} /> Devices used</p>
                    <div className="space-y-1">
                      {detail.devices.map((d) => (
                        <p key={d.key} className="text-xs flex items-center justify-between gap-2 rounded-lg bg-panel2 px-2.5 py-1.5"><span>{d.key}</span><span className="text-mist">{d.count}×</span></p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export default function CustomerActivity() {
  const [q, setQ] = useState("");
  const [days, setDays] = useState(null); // null = all time
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    const p = new URLSearchParams({ page: String(page), q });
    if (days) p.set("days", String(days));
    const r = await fetch(`/api/admin/customers?${p}`, { cache: "no-store" });
    setData(r.ok ? await r.json() : { rows: [], total: 0, pageSize: 25 });
  }, [page, q, days]);
  useEffect(() => { setPage(1); }, [q, days]);
  useEffect(() => { load(); }, [load]);

  function exportCsv() {
    if (!data?.rows?.length) return;
    downloadCsv(`customers-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Name", "Email", "Phone", "IP", "Location", "Device", "Browser", "OS", "Sessions", "Pages", "First seen", "Last seen", "Orders", "Lifetime value", "Has account"],
      data.rows.map((r) => [r.name || "", r.email, r.phone || "", r.ip || "", r.location || "", r.device || "", r.browser || "", r.os || "", r.sessionCount, r.pageCount, r.firstSeen, r.lastSeen, r.orders?.count || 0, r.orders?.total || 0, r.account ? "Yes" : "No"]));
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const stats = data ? {
    total: data.total,
    withAccount: data.rows.filter((r) => r.account).length,
    repeat: data.rows.filter((r) => r.orders?.count > 1).length,
    flagged: data.rows.filter((r) => r.flagged).length,
  } : null;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-line bg-panel p-4 sm:p-5 text-sm text-mist leading-relaxed">
        <p>Every visitor who has given a name, email or phone (via an order, lead or account) — merged across every device and session they've used. Anonymous browsing-only visitors stay in <a href="/admin/analytics" className="text-brand hover:underline">Analytics</a>.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Known customers", value: stats?.total, icon: Users, tone: "text-brand bg-brand/10" },
          { label: "With an account", value: stats?.withAccount, icon: UserCheck, tone: "text-sky-400 bg-sky-500/10" },
          { label: "Repeat buyers", value: stats?.repeat, icon: Repeat, tone: "text-violet-400 bg-violet-500/10" },
          { label: "Multiple locations", value: stats?.flagged, icon: AlertTriangle, tone: stats?.flagged > 0 ? "text-amber-400 bg-amber-500/10" : "text-mist bg-panel2" },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-line bg-panel p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-mist">{c.label}</span>
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${c.tone}`}><c.icon size={13} /></span>
            </div>
            <p className="font-display font-bold text-xl mt-1.5">{c.value != null ? <Count to={c.value} /> : "—"}</p>
            <p className="text-[11px] text-mist mt-1">this page</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-line bg-panel overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-line">
          <h2 className="font-display font-semibold flex items-center gap-2"><span className="w-7 h-7 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0"><Globe2 size={13} /></span> Customer activity</h2>
          <span className="text-xs text-mist">{data ? data.total.toLocaleString() : "…"} total</span>
          <div className="relative flex rounded-lg border border-line overflow-hidden text-xs ml-1">
            {[[null, "All time"], [30, "30 days"], [7, "7 days"]].map(([d, l]) => (
              <button key={l} type="button" onClick={() => setDays(d)} className="relative px-3 py-1.5 text-mist data-[on=true]:text-white transition-colors" data-on={days === d}>
                {days === d && <motion.span layoutId="custRangeActive" transition={{ type: "spring", stiffness: 450, damping: 32 }} className="absolute inset-0 bg-brand" />}
                <span className="relative">{l}</span>
              </button>
            ))}
          </div>
          <span className="flex-1" />
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mist" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone, IP…" className="input pl-9" />
            {q && <button type="button" onClick={() => setQ("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-mist hover:text-fg"><X size={14} /></button>}
          </div>
          <button type="button" onClick={exportCsv} disabled={!data?.rows?.length} className="btn-ghost !py-2 text-xs">Export CSV</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="text-xs text-mist"><tr className="text-left"><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Location / IP</th><th className="px-4 py-3">Device</th><th className="px-4 py-3 text-center">Activity</th><th className="px-4 py-3">Last seen</th><th className="px-4 py-3 text-right">Orders</th></tr></thead>
            <tbody>
              {!data && [0, 1, 2].map((i) => <tr key={i}><td colSpan={7} className="px-4 py-4"><div className="shimmer h-4 w-full" /></td></tr>)}
              {data?.rows.length === 0 && <tr><td colSpan={7} className="py-14 text-center text-mist">No identified customers match{q ? " this search" : " yet"}.</td></tr>}
              {data?.rows.map((r) => <CustomerRow key={r.email} row={r} />)}
            </tbody>
          </table>
        </div>
        {data && data.total > data.pageSize && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-line text-xs">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-ghost !py-1.5 !px-3 disabled:opacity-40">Previous</button>
            <span className="text-mist">Page {page} of {totalPages}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="btn-ghost !py-1.5 !px-3 disabled:opacity-40">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
