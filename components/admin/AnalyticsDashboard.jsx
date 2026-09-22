"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Eye, Users, UserCheck, UserPlus, Radio, Search, X, ChevronDown, MapPin, Monitor, Smartphone, Tablet,
  Globe2, Link2, ShoppingBag, Clock, TrendingUp, TrendingDown, Minus, Loader2, ExternalLink,
} from "lucide-react";
import { downloadCsv } from "./Bulk";

const money = (n) => "৳" + Math.round(n || 0).toLocaleString("en-US");
const fmtDay = (s) => new Date(s + "T00:00:00Z").toLocaleDateString("en-GB", { timeZone: "UTC", day: "numeric", month: "short" });
const fmtDT = (iso) => new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const DEVICE_ICON = { mobile: Smartphone, tablet: Tablet, desktop: Monitor };

function timeAgo(iso) {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
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

function Delta({ now, before }) {
  if (before === 0 && now === 0) return <span className="text-[11px] text-mist inline-flex items-center gap-1"><Minus size={12} /> no change</span>;
  if (before === 0) return <span className="text-[11px] text-emerald-400 inline-flex items-center gap-1"><TrendingUp size={12} /> new</span>;
  const p = Math.round(((now - before) / before) * 100);
  return <span className={`text-[11px] inline-flex items-center gap-1 ${p >= 0 ? "text-emerald-400" : "text-red-400"}`}>{p >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{p >= 0 ? "+" : ""}{p}% vs previous period</span>;
}

// Bars = page views, the overlaid line = unique visitors that day.
function DailyChart({ daily }) {
  const [hi, setHi] = useState(null);
  const maxV = Math.max(1, ...daily.map((d) => d.views));
  const maxU = Math.max(1, ...daily.map((d) => d.visitors));
  const W = 1000, H = 220, L = 40, B = 26, T = 10;
  const bw = (W - L) / daily.length;
  const y = (v, max) => T + (H - B - T) * (1 - v / max);
  const path = daily.map((d, i) => `${i ? "L" : "M"}${L + i * bw + bw / 2},${y(d.visitors, maxU)}`).join(" ");
  const every = Math.ceil(daily.length / 10);
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Daily page views and unique visitors" onMouseLeave={() => setHi(null)}>
        {[0, 0.5, 1].map((f) => <line key={f} x1={L} x2={W} y1={T + (H - B - T) * (1 - f)} y2={T + (H - B - T) * (1 - f)} stroke="rgb(var(--line))" strokeWidth="1" />)}
        {daily.map((d, i) => {
          const h = ((H - B - T) * d.views) / maxV;
          const x = L + i * bw;
          return (
            <g key={d.date} onMouseEnter={() => setHi(i)} onClick={() => setHi(i)}>
              <rect x={x} y={T} width={bw} height={H - B - T} fill="transparent" />
              <motion.rect x={x + bw * 0.15} width={bw * 0.7} rx={Math.min(4, bw * 0.2)} fill={hi === i ? "rgb(var(--brand-light))" : "rgb(var(--brand))"} fillOpacity={0.35} initial={{ y: H - B, height: 0 }} animate={{ y: H - B - h, height: h }} transition={{ duration: 0.5, delay: Math.min(i * 0.01, 0.4) }} />
              {i % every === 0 && <text x={x + bw / 2} y={H - 8} textAnchor="middle" fill="rgb(var(--mist))" fontSize="11">{fmtDay(d.date)}</text>}
            </g>
          );
        })}
        <motion.path d={path} fill="none" stroke="rgb(var(--brand))" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8 }} />
        {daily.map((d, i) => <circle key={d.date} cx={L + i * bw + bw / 2} cy={y(d.visitors, maxU)} r={hi === i ? 5 : 3} fill="rgb(var(--brand))" stroke="rgb(var(--panel))" strokeWidth="2" />)}
      </svg>
      <div className="flex items-center gap-4 mt-1 text-[11px] text-mist">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-brand/35" /> Page views</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-brand" /> Unique visitors</span>
      </div>
      <AnimatePresence>
        {hi !== null && daily[hi] && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute top-1 rounded-lg border border-line bg-panel2 px-3 py-2 text-xs shadow-lg" style={{ left: `clamp(0%, ${((L + hi * bw + bw / 2) / W) * 100}%, 80%)`, transform: "translateX(-50%)" }}>
            <p className="font-semibold">{fmtDay(daily[hi].date)}</p>
            <p className="text-brand">{daily[hi].views} views</p>
            <p className="text-mist">{daily[hi].visitors} visitors</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BreakdownList({ title, icon: Icon, rows, total, empty }) {
  return (
    <div className="bg-panel">
      <p className="px-4 py-3 text-xs text-mist border-b border-line flex items-center gap-1.5"><Icon size={13} /> {title}</p>
      {(!rows || rows.length === 0) && <p className="px-4 py-6 text-sm text-mist">{empty || "No data yet."}</p>}
      {rows?.map((r) => {
        const pct = total ? Math.round((r.count / total) * 100) : 0;
        return (
          <div key={r.key} className="px-4 py-2.5 border-t border-line/60">
            <div className="flex justify-between text-sm gap-3"><span className="truncate">{r.key}</span><span className="font-semibold shrink-0">{r.count}</span></div>
            <div className="h-1.5 rounded-full bg-panel2 mt-1.5 overflow-hidden"><motion.div className="h-full bg-brand" initial={{ width: 0 }} animate={{ width: pct + "%" }} transition={{ duration: 0.5 }} /></div>
          </div>
        );
      })}
    </div>
  );
}

function SessionRow({ row }) {
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState(null);
  const DevIcon = DEVICE_ICON[row.device] || Monitor;

  async function toggle() {
    setOpen((o) => !o);
    if (!path) {
      const r = await fetch(`/api/admin/analytics/sessions/${row.sessionId}`);
      const j = await r.json().catch(() => ({ rows: [] }));
      setPath(j.rows || []);
    }
  }

  return (
    <>
      <tr className="border-t border-line/60 hover:bg-panel2/40 cursor-pointer" onClick={toggle}>
        <td className="px-4 py-3 align-top">
          <div className="flex items-center gap-2">
            <ChevronDown size={14} className={`shrink-0 text-mist transition-transform ${open ? "rotate-180" : ""}`} />
            <div className="min-w-0">
              <p className="font-medium truncate">{row.name || "Anonymous visitor"}</p>
              <p className="text-xs text-mist truncate">{row.email || row.ip || "—"}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 align-top text-xs text-mist whitespace-nowrap"><span className="flex items-center gap-1.5"><MapPin size={12} /> {row.location || "Unknown"}</span><span className="block mt-0.5">{row.ip}</span></td>
        <td className="px-4 py-3 align-top text-xs whitespace-nowrap"><span className="flex items-center gap-1.5"><DevIcon size={13} className="text-mist" /> {row.browser}</span><span className="block text-mist mt-0.5">{row.os}</span></td>
        <td className="px-4 py-3 align-top text-xs text-mist whitespace-nowrap">{row.source}</td>
        <td className="px-4 py-3 align-top text-sm text-center">{row.pageCount}</td>
        <td className="px-4 py-3 align-top text-xs text-mist whitespace-nowrap">{fmtDT(row.lastSeen)}</td>
        <td className="px-4 py-3 align-top text-right">
          {row.orders ? <a href={`/admin/orders?q=${encodeURIComponent(row.email)}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-300 px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap"><ShoppingBag size={11} /> {row.orders.count} order{row.orders.count > 1 ? "s" : ""} · {money(row.orders.total)}</a> : <span className="text-[11px] text-mist">—</span>}
        </td>
      </tr>
      {open && (
        <tr className="border-t border-line/60 bg-panel2/20">
          <td colSpan={7} className="px-4 py-4">
            <p className="text-[11px] uppercase tracking-wider text-mist mb-2">Pages visited ({row.pageCount}) · first seen {fmtDT(row.firstSeen)}</p>
            {!path ? <Loader2 size={16} className="animate-spin text-mist" /> : (
              <ol className="space-y-1.5 max-h-64 overflow-y-auto">
                {path.map((p, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-xs">
                    <span className="w-5 h-5 shrink-0 rounded-full bg-panel2 border border-line flex items-center justify-center text-[10px] text-mist">{i + 1}</span>
                    <span className="font-mono text-fg/90 truncate flex-1">{p.path}</span>
                    <span className="text-mist shrink-0">{fmtDT(p.createdAt)}</span>
                  </li>
                ))}
              </ol>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export default function AnalyticsDashboard() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [sessions, setSessions] = useState(null);
  const [page, setPage] = useState(1);
  const [live, setLive] = useState([]);
  const [liveOn, setLiveOn] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/admin/analytics/summary?days=${days}`, { cache: "no-store" });
    setData(r.ok ? await r.json() : null);
    setLoading(false);
  }, [days]);
  useEffect(() => { load(); }, [load]);

  const loadSessions = useCallback(async () => {
    const r = await fetch(`/api/admin/analytics/sessions?days=${days}&q=${encodeURIComponent(q)}&page=${page}`, { cache: "no-store" });
    setSessions(r.ok ? await r.json() : { rows: [], total: 0 });
  }, [days, q, page]);
  useEffect(() => { setPage(1); }, [days, q]);
  useEffect(() => { loadSessions(); }, [loadSessions]);

  // live "who's on the site right now" feed
  useEffect(() => {
    if (typeof EventSource === "undefined") return;
    const es = new EventSource("/api/admin/analytics/stream");
    es.addEventListener("visit", (e) => {
      try { const row = JSON.parse(e.data); setLive((l) => [row, ...l].slice(0, 25)); } catch {}
    });
    return () => es.close();
  }, []);

  function exportSessions() {
    if (!sessions) return;
    downloadCsv(`visitors-${days}d-${new Date().toISOString().slice(0, 10)}.csv`, ["Name", "Email", "Phone", "IP", "Location", "Device", "Browser", "OS", "Source", "Pages", "First seen", "Last seen", "Orders", "Lifetime value"], sessions.rows.map((r) => [r.name || "", r.email || "", r.phone || "", r.ip || "", r.location || "", r.device || "", r.browser || "", r.os || "", r.source || "", r.pageCount, r.firstSeen, r.lastSeen, r.orders?.count || 0, r.orders?.total || 0]));
  }

  const S = data?.summary;
  const totalPages = sessions ? Math.max(1, Math.ceil(sessions.total / sessions.pageSize)) : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-line overflow-hidden text-sm">
          {[[7, "7 days"], [30, "30 days"], [90, "90 days"]].map(([d, l]) => (
            <button key={d} type="button" onClick={() => setDays(d)} className={`px-4 py-2 transition-colors ${days === d ? "bg-brand text-white" : "text-mist hover:text-fg"}`}>{l}</button>
          ))}
        </div>
        <span className="flex-1" />
        {S?.liveNow > 0 && (
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
            <span className="relative flex w-2 h-2"><span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75 animate-ping" /><span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-400" /></span>
            {S.liveNow} online right now
          </span>
        )}
      </div>

      {/* KPI cards */}
      <div className={`grid grid-cols-2 lg:grid-cols-5 gap-3 transition-opacity ${loading ? "opacity-50" : ""}`}>
        <div className="rounded-2xl border border-line bg-panel p-5"><p className="text-xs text-mist flex items-center gap-1.5"><Eye size={13} /> Page views</p><p className="font-display font-bold text-2xl mt-1">{S ? <Count to={S.views} /> : "—"}</p></div>
        <div className="rounded-2xl border border-brand/40 bg-brand/[0.06] p-5"><p className="text-xs text-mist flex items-center gap-1.5"><Users size={13} /> Unique visitors</p><p className="font-display font-bold text-2xl mt-1 text-brand">{S ? <Count to={S.visitors} /> : "—"}</p>{S && <Delta now={S.visitors} before={S.prevVisitors} />}</div>
        <div className="rounded-2xl border border-line bg-panel p-5"><p className="text-xs text-mist flex items-center gap-1.5"><UserCheck size={13} /> Identified</p><p className="font-display font-bold text-2xl mt-1">{S ? <Count to={S.identified} /> : "—"}</p><p className="text-[11px] text-mist mt-1">Name, email or phone known</p></div>
        <div className="rounded-2xl border border-line bg-panel p-5"><p className="text-xs text-mist flex items-center gap-1.5"><UserPlus size={13} /> New</p><p className="font-display font-bold text-2xl mt-1">{S ? <Count to={S.newVisitors} /> : "—"}</p><p className="text-[11px] text-mist mt-1">{S ? S.returningVisitors : "—"} returning</p></div>
        <div className="rounded-2xl border border-line bg-panel p-5"><p className="text-xs text-mist flex items-center gap-1.5"><Radio size={13} /> Live now</p><p className="font-display font-bold text-2xl mt-1">{S ? <Count to={S.liveNow} /> : "—"}</p><p className="text-[11px] text-mist mt-1">Last 5 minutes</p></div>
      </div>

      {/* chart + live feed */}
      <div className="grid xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-2xl border border-line bg-panel p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3"><h2 className="font-display font-semibold">Traffic per day</h2>{loading && <Loader2 size={16} className="animate-spin text-mist" />}</div>
          {data ? <DailyChart daily={data.daily} /> : <div className="shimmer h-52" />}
        </div>
        <div className="rounded-2xl border border-line bg-panel overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 px-4 h-12 border-b border-line shrink-0">
            <Radio size={14} className="text-emerald-400" />
            <p className="font-display font-semibold text-sm flex-1">Live activity</p>
            <button type="button" onClick={() => setLiveOn((o) => !o)} className="text-[11px] text-mist hover:text-fg">{liveOn ? "Pause" : "Resume"}</button>
          </div>
          <div className="max-h-[280px] xl:max-h-[320px] overflow-y-auto flex-1">
            {live.length === 0 && <p className="px-4 py-8 text-center text-xs text-mist">Watching for visitors… new page views will appear here the instant they happen.</p>}
            <AnimatePresence initial={false}>
              {(liveOn ? live : []).map((r) => (
                <motion.div key={r.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="px-4 py-2.5 border-b border-line/60 text-xs">
                  <p className="truncate"><span className="font-medium">{r.name || (r.city ? `${r.city}${r.country ? ", " + r.country : ""}` : "Someone")}</span> <span className="text-mist">viewed</span> <span className="font-mono text-brand">{r.path}</span></p>
                  <p className="text-mist mt-0.5">{[r.device, r.browser].filter(Boolean).join(" · ") || "—"} · {timeAgo(r.createdAt)}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* breakdowns */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-line overflow-hidden"><BreakdownList title="Top pages" icon={Eye} rows={data?.topPages} total={S?.views} /></div>
        <div className="rounded-2xl border border-line overflow-hidden"><BreakdownList title="Traffic sources" icon={Link2} rows={[...(data?.topSources || []), ...(data?.topReferrers || [])].slice(0, 8)} total={S?.visitors} empty="All direct traffic so far." /></div>
        <div className="rounded-2xl border border-line overflow-hidden"><BreakdownList title="Countries" icon={Globe2} rows={data?.countries} total={S?.visitors} empty="Location not resolved yet." /></div>
        <div className="rounded-2xl border border-line overflow-hidden"><BreakdownList title="Devices" icon={Smartphone} rows={data?.devices} total={S?.visitors} /></div>
        <div className="rounded-2xl border border-line overflow-hidden"><BreakdownList title="Browsers" icon={Monitor} rows={data?.browsers} total={S?.visitors} /></div>
        <div className="rounded-2xl border border-line overflow-hidden"><BreakdownList title="Operating systems" icon={Monitor} rows={data?.os} total={S?.visitors} /></div>
      </div>

      {/* visitor sessions table */}
      <div className="rounded-2xl border border-line bg-panel overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-line">
          <h2 className="font-display font-semibold">Visitor sessions</h2>
          <span className="text-xs text-mist">{sessions ? sessions.total.toLocaleString() : "…"} in this period</span>
          <span className="flex-1" />
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mist" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone, IP…" className="input pl-9" />
            {q && <button type="button" onClick={() => setQ("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-mist hover:text-fg"><X size={14} /></button>}
          </div>
          <button type="button" onClick={exportSessions} disabled={!sessions?.rows?.length} className="btn-ghost !py-2 text-xs">Export CSV</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="text-xs text-mist"><tr className="text-left"><th className="px-4 py-3">Visitor</th><th className="px-4 py-3">Location / IP</th><th className="px-4 py-3">Device</th><th className="px-4 py-3">Source</th><th className="px-4 py-3 text-center">Pages</th><th className="px-4 py-3">Last seen</th><th className="px-4 py-3 text-right">Orders</th></tr></thead>
            <tbody>
              {!sessions && [0, 1, 2].map((i) => <tr key={i}><td colSpan={7} className="px-4 py-4"><div className="shimmer h-4 w-full" /></td></tr>)}
              {sessions?.rows.length === 0 && <tr><td colSpan={7} className="py-14 text-center text-mist">No visits match this period{q ? " and search" : ""}.</td></tr>}
              {sessions?.rows.map((r) => <SessionRow key={r.sessionId} row={r} />)}
            </tbody>
          </table>
        </div>
        {sessions && sessions.total > sessions.pageSize && (
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
