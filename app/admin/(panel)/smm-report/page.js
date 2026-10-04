import Link from "next/link";
import { Share2, Wallet, TrendingUp, ShoppingCart, AlertTriangle, Send, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { smmBalance } from "@/lib/smmiu";
import { dhakaDay, dhakaStart, addDays } from "@/lib/dhaka";
import RevenueChart from "@/components/admin/RevenueChart";
import CountUp from "@/components/CountUp";
import { requirePage } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

const PAID_STATES = ["PAID", "IN_PROGRESS", "COMPLETED", "DELIVERED"];
const PROVIDER_STYLE = {
  Pending: "bg-amber-500/15 text-amber-300",
  "In progress": "bg-sky-500/15 text-sky-300",
  Processing: "bg-sky-500/15 text-sky-300",
  Completed: "bg-emerald-500/15 text-emerald-300",
  Partial: "bg-orange-500/15 text-orange-300",
  Canceled: "bg-zinc-500/20 text-zinc-300",
  Cancelled: "bg-zinc-500/20 text-zinc-300",
  "Not sent": "bg-zinc-500/20 text-zinc-300",
};

export default async function SmmReportPage() {
  const admin = await requirePage("growth.view");
  const [smmOrders, s] = await Promise.all([
    prisma.smmOrder.findMany({ include: { order: true, service: true }, orderBy: { createdAt: "desc" } }).catch(() => []),
    getSettings(),
  ]);
  // The provider returns balance as a numeric string (e.g. "0.0000000"), not a number - must be parsed
  // before any arithmetic or .toFixed() call, or it throws at render time.
  const rawBalance = await smmBalance().catch(() => null);
  const balance = rawBalance ? { balance: parseFloat(rawBalance.balance) || 0, currency: rawBalance.currency || "USD" } : null;
  const usdRate = parseFloat(s.usdRate) || 120;

  const paid = smmOrders.filter((o) => PAID_STATES.includes(o.order.status));
  const totalOrders = smmOrders.length;
  const totalRevenue = paid.reduce((n, o) => n + o.order.amount, 0);
  const providerCostBdt = paid.reduce((n, o) => n + (o.service.providerRate * o.quantity * usdRate) / 1000, 0);
  const profit = Math.round(totalRevenue - providerCostBdt);
  const pendingSend = paid.filter((o) => !o.providerOrderId).length;

  // Revenue per day, last 14 days (Dhaka calendar), paid SMM orders only.
  const firstDay = addDays(dhakaDay(new Date()), -13);
  const buckets = {};
  for (let i = 0; i < 14; i++) {
    const k = addDays(firstDay, i);
    buckets[k] = { label: new Date(k + "T00:00:00Z").toLocaleDateString("en-GB", { timeZone: "UTC", day: "numeric", month: "short" }), value: 0 };
  }
  const since = dhakaStart(firstDay);
  for (const o of paid) {
    if (o.order.createdAt < since) continue;
    const k = dhakaDay(o.order.createdAt);
    if (buckets[k]) buckets[k].value += o.order.amount;
  }
  const chart = Object.values(buckets);

  const statusCounts = {};
  for (const o of smmOrders) statusCounts[o.providerStatus] = (statusCounts[o.providerStatus] || 0) + 1;
  const statusList = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);
  const maxStatus = Math.max(1, ...statusList.map(([, n]) => n));

  const byService = new Map();
  for (const o of paid) {
    const key = o.service.name;
    const g = byService.get(key) || { name: key, orders: 0, revenue: 0 };
    g.orders++;
    g.revenue += o.order.amount;
    byService.set(key, g);
  }
  const topServices = [...byService.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8);

  const cards = [
    { label: "SMM orders", num: totalOrders, icon: ShoppingCart, note: "All time", href: "/admin/orders" },
    { label: "SMM revenue", num: totalRevenue, prefix: "৳", icon: Wallet, note: "Paid and beyond" },
    { label: "Estimated profit", num: profit, prefix: "৳", icon: TrendingUp, note: `At ৳${usdRate}/USD` },
    { label: "SMMIU balance", value: balance ? `${balance.balance.toFixed(2)} ${balance.currency}` : "—", icon: Share2, note: "Live from provider" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-xl flex items-center gap-2"><Share2 size={20} className="text-brand" /> SMM Panel Report</h1>
        <p className="text-sm text-mist mt-1">Revenue, provider costs and order progress for the SMM Panel, separate from the rest of the catalog.</p>
      </div>

      {pendingSend > 0 && (
        <Link href="/admin/orders?status=PAID" className="flex items-center gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/[0.06] p-4 hover:border-amber-500/70 transition-colors">
          <span className="w-9 h-9 rounded-lg bg-amber-500/15 text-amber-300 flex items-center justify-center shrink-0"><AlertTriangle size={16} /></span>
          <p className="text-sm flex-1"><span className="font-semibold">{pendingSend}</span> paid SMM order{pendingSend > 1 ? "s" : ""} not yet sent to SMMIU — open each order and click "Send to SMMIU".</p>
          <ExternalLink size={14} className="text-mist shrink-0" />
        </Link>
      )}

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((c) => {
          const body = (
            <div className={`group rounded-2xl border border-line bg-panel p-5 h-full transition-all ${c.href ? "hover:-translate-y-0.5 hover:border-brand/70 hover:shadow-glow" : ""}`}>
              <div className="flex items-center justify-between">
                <p className="text-sm text-mist">{c.label}</p>
                <c.icon size={18} className="text-brand" />
              </div>
              <p className="font-display font-bold text-2xl mt-3">{c.num !== undefined ? <CountUp value={c.num} prefix={c.prefix} /> : c.value}</p>
              <p className="text-xs text-mist mt-1">{c.note}</p>
            </div>
          );
          return c.href ? <Link key={c.label} href={c.href} className="block h-full">{body}</Link> : <div key={c.label}>{body}</div>;
        })}
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 rounded-2xl border border-line bg-panel p-6">
          <h2 className="font-display font-semibold mb-1">SMM revenue · last 14 days</h2>
          <p className="text-xs text-mist mb-4">৳ per day from paid SMM orders</p>
          {totalOrders === 0 ? <p className="text-sm text-mist py-10 text-center">No SMM orders yet.</p> : <RevenueChart data={chart} />}
        </section>

        <section className="rounded-2xl border border-line bg-panel p-6">
          <h2 className="font-display font-semibold mb-4">Provider status</h2>
          {statusList.length === 0 && <p className="text-sm text-mist">No SMM orders yet.</p>}
          <div className="space-y-4">
            {statusList.map(([st, n]) => (
              <div key={st}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${PROVIDER_STYLE[st] || "bg-panel2 text-mist"}`}>{st}</span>
                  <span className="font-semibold">{n}</span>
                </div>
                <div className="h-2 rounded-full bg-panel2 overflow-hidden">
                  <div className="h-full rounded-full bg-brand origin-left" style={{ width: `${(n / maxStatus) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-line bg-panel overflow-hidden">
        <div className="px-6 pt-6 pb-2"><h2 className="font-display font-semibold">Top services</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-mist border-b border-line"><th className="px-6 py-3 font-medium">Service</th><th className="px-6 py-3 font-medium">Orders</th><th className="px-6 py-3 font-medium">Revenue</th></tr></thead>
            <tbody>
              {topServices.length === 0 && <tr><td colSpan={3} className="px-6 py-8 text-center text-mist">No paid SMM orders yet.</td></tr>}
              {topServices.map((t) => (
                <tr key={t.name} className="border-b border-line/60 last:border-0">
                  <td className="px-6 py-3 font-medium max-w-xs truncate">{t.name}</td>
                  <td className="px-6 py-3 text-mist">{t.orders}</td>
                  <td className="px-6 py-3 font-semibold">৳{t.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-panel overflow-hidden">
        <div className="px-6 pt-6 pb-2"><h2 className="font-display font-semibold">Recent SMM orders</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-mist border-b border-line">{["Order", "Customer", "Service", "Qty", "Amount", "Provider", ""].map((h) => <th key={h} className="px-6 py-3 font-medium">{h}</th>)}</tr></thead>
            <tbody>
              {smmOrders.length === 0 && <tr><td colSpan={7} className="px-6 py-8 text-center text-mist">No SMM orders yet.</td></tr>}
              {smmOrders.slice(0, 15).map((o) => (
                <tr key={o.id} className="border-b border-line/60 last:border-0">
                  <td className="px-6 py-3 text-mist">#{o.order.number}</td>
                  <td className="px-6 py-3">{o.order.name}</td>
                  <td className="px-6 py-3 max-w-[180px] truncate">{o.service.name}</td>
                  <td className="px-6 py-3 text-mist">{o.quantity.toLocaleString()}</td>
                  <td className="px-6 py-3 font-semibold">৳{o.order.amount.toLocaleString()}</td>
                  <td className="px-6 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${PROVIDER_STYLE[o.providerStatus] || "bg-panel2 text-mist"}`}>{o.providerStatus}</span></td>
                  <td className="px-6 py-3 text-right"><Link href={`/admin/orders?q=${o.order.number}`} className="text-brand hover:underline inline-flex items-center gap-1 text-xs whitespace-nowrap">{!o.providerOrderId && PAID_STATES.includes(o.order.status) ? <><Send size={11} /> Send</> : "Open"}</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
