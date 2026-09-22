"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, FileSpreadsheet, TrendingUp, TrendingDown, ShoppingBag, Receipt, Package, CalendarDays, Loader2, Trophy, Minus } from "lucide-react";
import { dhakaDay, addDays } from "@/lib/dhaka";
import { buildXlsx } from "@/lib/xlsx";
import { downloadCsv } from "./Bulk";

const STATUS = [
  ["PAID", "Paid"], ["DELIVERED", "Delivered"], ["PENDING", "Pending"], ["REFUNDED", "Refunded"], ["CANCELLED", "Cancelled"], ["REJECTED", "Rejected"],
];
const money = (n) => "৳" + Math.round(n || 0).toLocaleString("en-US");
const fmtDay = (s, o = { weekday: "short", day: "numeric", month: "short", year: "numeric" }) => new Date(s + "T00:00:00Z").toLocaleDateString("en-GB", { timeZone: "UTC", ...o });
const weekday = (s) => new Date(s + "T00:00:00Z").toLocaleDateString("en-GB", { timeZone: "UTC", weekday: "long" });

function presets() {
  const t = dhakaDay(new Date());
  const ms = t.slice(0, 8) + "01";
  const lmEnd = addDays(ms, -1);
  return [
    ["today", "Today", t, t], ["yesterday", "Yesterday", addDays(t, -1), addDays(t, -1)], ["7", "Last 7 days", addDays(t, -6), t],
    ["30", "Last 30 days", addDays(t, -29), t], ["month", "This month", ms, t], ["lastmonth", "Last month", lmEnd.slice(0, 8) + "01", lmEnd],
    ["year", "This year", t.slice(0, 5) + "01-01", t],
  ];
}

function Count({ to, prefix = "", className = "" }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf, t0;
    const from = 0;
    const step = (t) => { t0 ??= t; const p = Math.min(1, (t - t0) / 650); setV(Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <span className={className}>{prefix}{v.toLocaleString("en-US")}</span>;
}

function Delta({ now, before }) {
  if (before === 0 && now === 0) return <span className="text-[11px] text-mist inline-flex items-center gap-1"><Minus size={12} /> no change</span>;
  if (before === 0) return <span className="text-[11px] text-emerald-400 inline-flex items-center gap-1"><TrendingUp size={12} /> new</span>;
  const p = Math.round(((now - before) / before) * 100);
  const up = p >= 0;
  return <span className={`text-[11px] inline-flex items-center gap-1 ${up ? "text-emerald-400" : "text-red-400"}`}>{up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{up ? "+" : ""}{p}% vs previous period</span>;
}

function Chart({ daily }) {
  const [hi, setHi] = useState(null);
  const max = Math.max(1, ...daily.map((d) => d.revenue));
  const nice = (() => { const p = Math.pow(10, Math.floor(Math.log10(max))); return Math.ceil(max / p) * p; })();
  const W = 1000, H = 220, L = 46, B = 26, T = 10;
  const bw = (W - L) / daily.length;
  const every = Math.ceil(daily.length / 10);
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Daily sales chart" onMouseLeave={() => setHi(null)}>
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const y = T + (H - B - T) * (1 - f);
          return <g key={f}><line x1={L} x2={W} y1={y} y2={y} stroke="currentColor" className="text-line" strokeWidth="1" /><text x={L - 6} y={y + 4} textAnchor="end" className="fill-mist" fontSize="11">{Math.round(nice * f).toLocaleString("en-US")}</text></g>;
        })}
        {daily.map((d, i) => {
          const h = ((H - B - T) * d.revenue) / nice;
          const x = L + i * bw;
          return (
            <g key={d.date} onMouseEnter={() => setHi(i)} onClick={() => setHi(i)}>
              <rect x={x} y={T} width={bw} height={H - B - T} fill="transparent" />
              <motion.rect x={x + bw * 0.15} width={bw * 0.7} rx={Math.min(4, bw * 0.2)} fill={hi === i ? "#FF6A5C" : "#E8352B"} initial={{ y: H - B, height: 0 }} animate={{ y: H - B - h, height: h }} transition={{ duration: 0.6, delay: Math.min(i * 0.012, 0.5) }} />
              {i % every === 0 && <text x={x + bw / 2} y={H - 8} textAnchor="middle" className="fill-mist" fontSize="11">{fmtDay(d.date, { day: "numeric", month: "short" })}</text>}
            </g>
          );
        })}
      </svg>
      <AnimatePresence>
        {hi !== null && daily[hi] && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute top-1 rounded-lg border border-line bg-panel2 px-3 py-2 text-xs shadow-lg" style={{ left: `clamp(0%, ${((L + hi * bw + bw / 2) / W) * 100}%, 82%)`, transform: "translateX(-50%)" }}>
            <p className="font-semibold">{fmtDay(daily[hi].date)}</p>
            <p className="text-brand font-bold">{money(daily[hi].revenue)}</p>
            <p className="text-mist">{daily[hi].orders} order{daily[hi].orders === 1 ? "" : "s"}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SalesReport({ initialPreset = "" }) {
  const P = useMemo(presets, []);
  const start = P.find((x) => x[0] === initialPreset) || P[3];
  const [preset, setPreset] = useState(start[0]);
  const [from, setFrom] = useState(start[2]);
  const [to, setTo] = useState(start[3]);
  const [statuses, setStatuses] = useState(["PAID", "DELIVERED"]);
  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("daily");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setErr("");
    const r = await fetch(`/api/admin/sales?from=${from}&to=${to}&status=${statuses.join(",")}`, { cache: "no-store" });
    if (!r.ok) { setErr("Could not load the report"); setLoading(false); return; }
    setD(await r.json()); setLoading(false);
  }, [from, to, statuses]);
  useEffect(() => { load(); }, [load]);

  const pick = (key, a, b) => { setPreset(key); setFrom(a); setTo(b); };
  const toggleStatus = (s) => setStatuses((cur) => (cur.includes(s) ? (cur.length > 1 ? cur.filter((x) => x !== s) : cur) : [...cur, s]));
  const statusText = statuses.map((s) => STATUS.find((x) => x[0] === s)[1]).join(" + ");

  function exportXlsx() {
    const S = d.summary;
    const head = (...c) => c.map((v) => ({ v, s: "head" }));
    const summary = [
      [{ v: "Sales report", s: "title" }],
      ["Period", `${fmtDay(d.range.from)} to ${fmtDay(d.range.to)} (${d.range.days} days, Bangladesh time)`],
      ["Orders counted", statusText],
      ["Generated", new Date(d.generated).toLocaleString("en-GB")],
      [],
      head("Metric", "Value"),
      ["Total sales (৳)", { v: S.revenue, s: "boldint" }],
      ["Orders", { v: S.orders, s: "int" }],
      ["Average order (৳)", { v: S.avg, s: "int" }],
      ["Items sold", { v: S.items, s: "int" }],
      ["Affiliate commission (৳)", { v: S.commission, s: "int" }],
      ["Best day", S.best && S.best.revenue > 0 ? `${fmtDay(S.best.date)}: ৳${S.best.revenue.toLocaleString("en-US")}` : "—"],
      [`Previous period (${fmtDay(d.prev.from, { day: "numeric", month: "short" })} - ${fmtDay(d.prev.to, { day: "numeric", month: "short", year: "numeric" })}) sales (৳)`, { v: d.prev.revenue, s: "int" }],
      [],
      head("Quick view (paid + delivered)", "Sales (৳)", "Orders"),
      ...[["Today", d.quick.today], ["Yesterday", d.quick.yesterday], ["This month", d.quick.month], ["Last month", d.quick.lastMonth]].map(([l, q]) => [l, { v: q.revenue, s: "int" }, { v: q.orders, s: "int" }]),
      [],
      head("All orders in period by status", "Orders", "Amount (৳)"),
      ...d.byStatus.map((x) => [x.status, { v: x.orders, s: "int" }, { v: x.amount, s: "int" }]),
    ];
    const daily = [head("Date", "Day", "Orders", "Sales (৳)", "Average order (৳)"), ...d.daily.map((x) => [x.date, weekday(x.date), { v: x.orders, s: "int" }, { v: x.revenue, s: "int" }, { v: x.orders ? Math.round(x.revenue / x.orders) : 0, s: "int" }]), [{ v: "TOTAL", s: "bold" }, "", { v: S.orders, s: "boldint" }, { v: S.revenue, s: "boldint" }, { v: S.avg, s: "boldint" }]];
    const items = [head("Item", "Orders containing it"), ...d.topItems.map((x) => [x.name, { v: x.orders, s: "int" }])];
    const split = [head("Payment method", "Orders", "Sales (৳)"), ...d.byMethod.map((x) => [x.key, { v: x.orders, s: "int" }, { v: x.revenue, s: "int" }]), [], head("Order type", "Orders", "Sales (৳)"), ...d.bySource.map((x) => [x.key, { v: x.orders, s: "int" }, { v: x.revenue, s: "int" }])];
    const orders = [head("Order #", "Date", "Customer", "Email", "Phone", "Item(s)", "Amount (৳)", "Payment method", "Transaction ID", "Status", "Referral code", "Commission (৳)"), ...d.orders.map((o) => [{ v: o.number, s: "int" }, o.day, o.name, o.email, o.phone, o.item, { v: o.amount, s: "int" }, o.method, o.txnId, o.status, o.refCode, { v: o.commission, s: "int" }])];
    const bytes = buildXlsx([
      { name: "Summary", rows: summary, widths: [46, 44, 14] },
      { name: "Daily Sales", rows: daily, widths: [14, 14, 10, 14, 18] },
      { name: "Items", rows: items, widths: [46, 20] },
      { name: "Payment & Type", rows: split, widths: [28, 10, 14] },
      { name: "Orders", rows: orders, widths: [10, 12, 22, 28, 18, 44, 13, 16, 20, 12, 14, 14] },
    ]);
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    const a = document.createElement("a");
    a.href = url; a.download = `sales-${d.range.from}_to_${d.range.to}.xlsx`; a.click();
    URL.revokeObjectURL(url);
  }
  function exportCsv() {
    downloadCsv(`sales-orders-${d.range.from}_to_${d.range.to}.csv`, ["Order #", "Date", "Customer", "Email", "Phone", "Item(s)", "Amount", "Payment method", "Transaction ID", "Status", "Referral code", "Commission"], d.orders.map((o) => [o.number, o.day, o.name, o.email, o.phone, o.item, o.amount, o.method, o.txnId, o.status, o.refCode, o.commission]));
  }

  const S = d?.summary;
  const quick = d && [["Today", d.quick.today, P[0]], ["Yesterday", d.quick.yesterday, P[1]], ["This month", d.quick.month, P[4]], ["Last month", d.quick.lastMonth, P[5]]];

  return (
    <div className="space-y-6">
      {/* controls */}
      <div className="rounded-2xl border border-line bg-panel p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap gap-2">
          {P.map(([k, l, a, b]) => (
            <button key={k} type="button" onClick={() => pick(k, a, b)} className={`px-3.5 py-2 rounded-lg text-xs border transition-colors ${preset === k ? "bg-brand border-brand text-white" : "border-line text-mist hover:text-fg"}`}>{l}</button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div><label className="block text-[11px] text-mist mb-1">From</label><input type="date" className="input !w-auto" value={from} max={to} onChange={(e) => { setPreset("custom"); setFrom(e.target.value); }} /></div>
          <div><label className="block text-[11px] text-mist mb-1">To</label><input type="date" className="input !w-auto" value={to} min={from} max={dhakaDay(new Date())} onChange={(e) => { setPreset("custom"); setTo(e.target.value); }} /></div>
          <div className="flex-1" />
          <button type="button" disabled={!d || loading} onClick={exportXlsx} className="btn-primary"><FileSpreadsheet size={16} /> Export to Excel</button>
          <button type="button" disabled={!d || loading} onClick={exportCsv} className="btn-ghost" title="Order list as CSV"><Download size={15} /> CSV</button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-mist mr-1">Count orders that are:</span>
          {STATUS.map(([k, l]) => (
            <button key={k} type="button" onClick={() => toggleStatus(k)} aria-pressed={statuses.includes(k)} className={`px-3 py-1.5 rounded-full text-[11px] border transition-colors ${statuses.includes(k) ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-300" : "border-line text-mist hover:text-fg"}`}>{l}</button>
          ))}
        </div>
      </div>

      {err && <p className="text-sm text-red-400">{err}</p>}

      {/* quick cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(quick || [0, 1, 2, 3].map(() => null)).map((q, i) => (
          <button key={i} type="button" disabled={!q} onClick={() => q && pick(q[2][0], q[2][2], q[2][3])} className="text-left rounded-2xl border border-line bg-panel p-4 hover:border-brand/50 transition-colors">
            {q ? (<><p className="text-[11px] text-mist flex items-center gap-1.5"><CalendarDays size={12} /> {q[0]}</p><p className="font-display font-bold text-xl mt-1">{money(q[1].revenue)}</p><p className="text-[11px] text-mist">{q[1].orders} order{q[1].orders === 1 ? "" : "s"}</p></>) : <div className="shimmer h-14" />}
          </button>
        ))}
      </div>

      {/* KPIs for the chosen range */}
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 transition-opacity ${loading ? "opacity-50" : ""}`}>
        <div className="col-span-2 lg:col-span-1 rounded-2xl border border-brand/40 bg-brand/[0.07] p-5">
          <p className="text-xs text-mist flex items-center gap-1.5"><Receipt size={13} /> Total sales</p>
          <p className="font-display font-bold text-3xl mt-1 text-brand">{S ? <Count to={S.revenue} prefix="৳" /> : "—"}</p>
          {S && <div className="mt-1"><Delta now={S.revenue} before={d.prev.revenue} /></div>}
        </div>
        {[
          ["Orders", S && S.orders, <ShoppingBag size={13} key="i" />, S && <Delta now={S.orders} before={d.prev.orders} />],
          ["Average order", S && S.avg, <Receipt size={13} key="i" />, null, "৳"],
          ["Items sold", S && S.items, <Package size={13} key="i" />, null],
        ].map(([l, v, ic, dl, pre]) => (
          <div key={l} className="rounded-2xl border border-line bg-panel p-5">
            <p className="text-xs text-mist flex items-center gap-1.5">{ic} {l}</p>
            <p className="font-display font-bold text-2xl mt-1">{S ? <Count to={v} prefix={pre || ""} /> : "—"}</p>
            {dl && <div className="mt-1">{dl}</div>}
          </div>
        ))}
      </div>
      {S?.best && S.best.revenue > 0 && (
        <p className="text-xs text-mist flex flex-wrap items-center gap-x-3 gap-y-1"><span className="inline-flex items-center gap-1.5 text-amber-300"><Trophy size={13} /> Best day: {fmtDay(S.best.date)} ({money(S.best.revenue)}, {S.best.orders} orders)</span><span>Counting: {statusText}</span>{S.commission > 0 && <span>Affiliate commission in period: {money(S.commission)}</span>}</p>
      )}

      {/* chart */}
      <div className={`rounded-2xl border border-line bg-panel p-4 sm:p-5 transition-opacity ${loading ? "opacity-50" : ""}`}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold">Sales per day</h2>
          {loading && <Loader2 size={16} className="animate-spin text-mist" />}
        </div>
        {d ? <Chart daily={d.daily} /> : <div className="shimmer h-52" />}
      </div>

      {/* tables */}
      {d && (
        <div className="rounded-2xl border border-line bg-panel overflow-hidden">
          <div className="flex gap-1 p-2 border-b border-line overflow-x-auto no-scrollbar">
            {[["daily", "Day by day"], ["items", "Items"], ["split", "Payment & type"], ["orders", `Orders (${d.orders.length})`], ["status", "By status"]].map(([k, l]) => (
              <button key={k} type="button" onClick={() => setTab(k)} className={`shrink-0 px-4 py-2 rounded-lg text-sm transition-colors ${tab === k ? "bg-brand/15 text-fg" : "text-mist hover:text-fg"}`}>{l}</button>
            ))}
          </div>
          <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
            {tab === "daily" && (
              <table className="w-full text-sm"><thead className="sticky top-0 bg-panel text-xs text-mist"><tr className="text-left"><th className="px-4 py-3">Date</th><th className="px-4 py-3 text-right">Orders</th><th className="px-4 py-3 text-right">Sales</th><th className="px-4 py-3 text-right">Avg order</th></tr></thead>
                <tbody>{[...d.daily].reverse().map((x) => (
                  <tr key={x.date} className="border-t border-line/60 hover:bg-panel2/40"><td className="px-4 py-2.5">{fmtDay(x.date)}</td><td className="px-4 py-2.5 text-right">{x.orders}</td><td className={`px-4 py-2.5 text-right font-semibold ${x.revenue ? "" : "text-mist"}`}>{money(x.revenue)}</td><td className="px-4 py-2.5 text-right text-mist">{x.orders ? money(x.revenue / x.orders) : "—"}</td></tr>
                ))}</tbody>
                <tfoot><tr className="border-t border-line font-bold bg-panel2/40"><td className="px-4 py-3">Total</td><td className="px-4 py-3 text-right">{S.orders}</td><td className="px-4 py-3 text-right text-brand">{money(S.revenue)}</td><td className="px-4 py-3 text-right">{money(S.avg)}</td></tr></tfoot></table>
            )}
            {tab === "items" && (d.topItems.length ? <table className="w-full text-sm"><thead className="sticky top-0 bg-panel text-xs text-mist"><tr className="text-left"><th className="px-4 py-3">Item</th><th className="px-4 py-3 text-right">Orders containing it</th></tr></thead><tbody>{d.topItems.map((x) => <tr key={x.name} className="border-t border-line/60"><td className="px-4 py-2.5">{x.name}</td><td className="px-4 py-2.5 text-right font-semibold">{x.orders}</td></tr>)}</tbody></table> : <p className="py-12 text-center text-sm text-mist">No sales in this period.</p>)}
            {tab === "split" && (
              <div className="grid md:grid-cols-2 gap-px bg-line">
                {[["Payment method", d.byMethod], ["Order type", d.bySource]].map(([t, list]) => (
                  <div key={t} className="bg-panel"><p className="px-4 py-3 text-xs text-mist border-b border-line">{t}</p>
                    {list.length === 0 && <p className="px-4 py-6 text-sm text-mist">No sales.</p>}
                    {list.map((x) => { const pct = S.revenue ? Math.round((x.revenue / S.revenue) * 100) : 0; return (
                      <div key={x.key} className="px-4 py-3 border-t border-line/60"><div className="flex justify-between text-sm"><span>{x.key} <span className="text-mist text-xs">· {x.orders} orders</span></span><span className="font-semibold">{money(x.revenue)}</span></div><div className="h-1.5 rounded-full bg-panel2 mt-2 overflow-hidden"><motion.div className="h-full bg-brand" initial={{ width: 0 }} animate={{ width: pct + "%" }} transition={{ duration: 0.6 }} /></div></div>
                    ); })}
                  </div>
                ))}
              </div>
            )}
            {tab === "orders" && (d.orders.length ? <table className="w-full text-sm whitespace-nowrap"><thead className="sticky top-0 bg-panel text-xs text-mist"><tr className="text-left"><th className="px-4 py-3">#</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Item(s)</th><th className="px-4 py-3">Method</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Amount</th></tr></thead><tbody>{d.orders.map((o) => <tr key={o.number} className="border-t border-line/60 hover:bg-panel2/40"><td className="px-4 py-2.5 text-mist">#{o.number}</td><td className="px-4 py-2.5">{fmtDay(o.day, { day: "numeric", month: "short" })}</td><td className="px-4 py-2.5">{o.name}</td><td className="px-4 py-2.5 max-w-[260px] truncate" title={o.item}>{o.item}</td><td className="px-4 py-2.5 text-mist">{o.method || "—"}</td><td className="px-4 py-2.5 text-xs">{o.status}</td><td className="px-4 py-2.5 text-right font-semibold">{money(o.amount)}</td></tr>)}</tbody></table> : <p className="py-12 text-center text-sm text-mist">No orders in this period.</p>)}
            {tab === "status" && <table className="w-full text-sm"><thead className="text-xs text-mist"><tr className="text-left"><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Orders</th><th className="px-4 py-3 text-right">Amount</th></tr></thead><tbody>{d.byStatus.map((x) => <tr key={x.status} className="border-t border-line/60"><td className="px-4 py-2.5">{x.status}</td><td className="px-4 py-2.5 text-right">{x.orders}</td><td className="px-4 py-2.5 text-right font-semibold">{money(x.amount)}</td></tr>)}{d.byStatus.length === 0 && <tr><td colSpan={3} className="py-10 text-center text-mist">No orders in this period.</td></tr>}</tbody></table>}
          </div>
        </div>
      )}
    </div>
  );
}
