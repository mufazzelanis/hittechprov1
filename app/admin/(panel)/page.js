import Link from "next/link";
import { ShoppingCart, Wallet, Clock, Wrench, ArrowUpRight } from "lucide-react";
import { prisma } from "@/lib/db";
import CountUp from "@/components/CountUp";
import RevenueChart from "@/components/admin/RevenueChart";
import { dhakaDay, dhakaStart, addDays } from "@/lib/dhaka";

const STATUS_STYLE = {
  PENDING: "bg-amber-500/15 text-amber-300",
  PAID: "bg-sky-500/15 text-sky-300",
  DELIVERED: "bg-emerald-500/15 text-emerald-300",
  REFUNDED: "bg-purple-500/15 text-purple-300",
  CANCELLED: "bg-zinc-500/20 text-zinc-300",
};

const dayKey = (d) => dhakaDay(d);

export default async function Dashboard() {
  const firstDay = addDays(dhakaDay(new Date()), -13);
  const since = dhakaStart(firstDay);

  const [orders, recent, toolCount, bundleCount, byStatus] = await Promise.all([
    prisma.order.findMany({ where: { createdAt: { gte: since }, status: { in: ["PAID", "DELIVERED"] } }, select: { amount: true, createdAt: true } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.tool.count({ where: { active: true } }),
    prisma.bundle.count({ where: { active: true } }),
    prisma.order.groupBy({ by: ["status"], _count: true, _sum: { amount: true } }),
  ]);

  const buckets = {};
  for (let i = 0; i < 14; i++) {
    const k = addDays(firstDay, i);
    buckets[k] = { label: new Date(k + "T00:00:00Z").toLocaleDateString("en-GB", { timeZone: "UTC", day: "numeric", month: "short" }), value: 0 };
  }
  for (const o of orders) {
    const k = dayKey(o.createdAt);
    if (buckets[k]) buckets[k].value += o.amount;
  }
  const chart = Object.values(buckets);

  const st = Object.fromEntries(byStatus.map((s) => [s.status, s]));
  const totalOrders = byStatus.reduce((a, s) => a + s._count, 0);
  const revenue = (st.PAID?._sum.amount || 0) + (st.DELIVERED?._sum.amount || 0);
  const pending = st.PENDING?._count || 0;

  const cards = [
    { label: "Total revenue", num: revenue, prefix: "৳", icon: Wallet, note: "Paid + delivered", href: "/admin/orders?status=PAID,DELIVERED" },
    { label: "Total orders", num: totalOrders, icon: ShoppingCart, note: "All time", href: "/admin/orders" },
    { label: "Pending orders", num: pending, icon: Clock, note: "Need your action", hot: pending > 0, href: "/admin/orders?status=PENDING" },
    { label: "Live listings", value: `${toolCount} tools · ${bundleCount} bundles`, icon: Wrench, note: "Visible on site", href: "/admin/tools" },
  ];

  const maxCount = Math.max(1, ...byStatus.map((s) => s._count));

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((c) => {
          const body = (
            <div className={`group rounded-2xl border bg-panel p-5 h-full transition-all hover:-translate-y-0.5 hover:border-brand/70 hover:shadow-glow ${c.hot ? "border-brand/50" : "border-line"}`}>
              <div className="flex items-center justify-between">
                <p className="text-sm text-mist">{c.label}</p>
                <c.icon size={18} className="text-brand" />
              </div>
              <p className="font-display font-bold text-2xl mt-3">{c.num !== undefined ? <CountUp value={c.num} prefix={c.prefix} /> : c.value}</p>
              <p className="text-xs text-mist mt-1 flex items-center justify-between">{c.note}<ArrowUpRight size={14} className="text-mist opacity-0 group-hover:opacity-100 group-hover:text-brand transition-opacity" /></p>
            </div>
          );
          return <Link key={c.label} href={c.href} className="block h-full">{body}</Link>;
        })}
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 rounded-2xl border border-line bg-panel p-6">
          <div className="flex items-start justify-between gap-3"><h2 className="font-display font-semibold">Revenue · last 14 days</h2><Link href="/admin/sales" className="text-xs text-brand hover:underline whitespace-nowrap">Full sales report →</Link></div>
          <p className="text-xs text-mist mb-4">৳ per day from paid and delivered orders</p>
          <RevenueChart data={chart} />
        </section>

        <section className="rounded-2xl border border-line bg-panel p-6">
          <h2 className="font-display font-semibold mb-4">Orders by status</h2>
          <div className="space-y-4">
            {["PENDING", "PAID", "DELIVERED", "REFUNDED", "CANCELLED"].map((s) => {
              const n = st[s]?._count || 0;
              return (
                <Link key={s} href={`/admin/orders?status=${s}`} className="block rounded-lg -mx-2 px-2 py-1 hover:bg-panel2/60 transition-colors">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-mist">{s[0] + s.slice(1).toLowerCase()}</span>
                    <span className="font-semibold">{n}</span>
                  </div>
                  <div className="h-2 rounded-full bg-panel2 overflow-hidden">
                    <div className="h-full rounded-full bg-brand origin-left animate-[grow_1s_ease-out]" style={{ width: `${(n / maxCount) * 100}%` }} />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-line bg-panel">
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="font-display font-semibold">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm text-brand hover:text-brand-light">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              {recent.length === 0 && (
                <tr><td className="px-6 pb-8 text-mist">No orders yet. They appear here as customers check out.</td></tr>
              )}
              {recent.map((o) => (
                <tr key={o.id} className="border-t border-line/60">
                  <td className="px-6 py-3 text-mist">#{o.number}</td>
                  <td className="px-2 py-3 font-medium">{o.itemName}</td>
                  <td className="px-2 py-3 text-mist">{o.name}</td>
                  <td className="px-2 py-3 font-semibold">৳{o.amount.toLocaleString()}</td>
                  <td className="px-6 py-3 text-right">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[o.status]}`}>{o.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
