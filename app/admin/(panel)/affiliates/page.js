import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import AffiliateToggle from "@/components/admin/AffiliateToggle";

export const dynamic = "force-dynamic";

const tk = (n) => `৳${Number(n).toLocaleString()}`;

export default async function AffiliatesPage() {
  const [s, users, orders, payouts] = await Promise.all([
    getSettings(),
    prisma.user.findMany({ where: { refCode: { not: null } }, orderBy: { createdAt: "desc" } }),
    prisma.order.findMany({ where: { refCode: { not: null } }, select: { refCode: true, commission: true, status: true } }),
    prisma.payout.findMany(),
  ]);

  const rows = users
    .map((u) => {
      const o = orders.filter((x) => x.refCode === u.refCode);
      const p = payouts.filter((x) => x.userId === u.id);
      const earned = o.filter((x) => ["PAID", "DELIVERED"].includes(x.status)).reduce((n, x) => n + x.commission, 0);
      const pending = o.filter((x) => x.status === "PENDING").reduce((n, x) => n + x.commission, 0);
      const committed = p.filter((x) => x.status !== "REJECTED").reduce((n, x) => n + x.amount, 0);
      const paidOut = p.filter((x) => x.status === "PAID").reduce((n, x) => n + x.amount, 0);
      return { u, orders: o.length, earned, pending, paidOut, balance: earned - committed, requested: p.filter((x) => x.status === "PENDING").length };
    })
    .filter((r) => r.u.refClicks > 0 || r.orders > 0 || r.paidOut > 0 || r.requested > 0)
    .sort((a, b) => b.earned - a.earned);

  const owed = rows.reduce((n, r) => n + Math.max(0, r.balance), 0);
  const pendingReq = payouts.filter((p) => p.status === "PENDING").length;
  const cards = [
    ["Active affiliates", rows.length, `${users.length} registered accounts`],
    ["Commission owed", tk(owed), "available balance across affiliates"],
    ["Payout requests waiting", pendingReq, "review in Payouts"],
    ["Commission rate", `${s.affRate}%`, `min payout ${tk(s.affMinPayout)}`],
  ];

  return (
    <div className="space-y-6">
      <AffiliateToggle initial={s.affiliateOn === "true"} />

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(([l, v, n]) => (
          <div key={l} className="rounded-2xl border border-line bg-panel p-5">
            <p className="text-sm text-mist">{l}</p>
            <p className="font-display font-bold text-2xl mt-2">{v}</p>
            <p className="text-xs text-mist mt-1">{n}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-line bg-panel overflow-x-auto">
        <div className="flex items-center justify-between p-5 pb-3">
          <h2 className="font-display font-semibold">Affiliates</h2>
          <div className="flex gap-4 text-sm">
            <Link href="/admin/payouts" className="text-brand hover:text-brand-light">Payouts</Link>
            <Link href="/admin/settings" className="text-brand hover:text-brand-light">Rates & settings</Link>
          </div>
        </div>
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="text-left text-xs text-mist border-y border-line">
              {["Affiliate", "Code", "Clicks", "Orders", "Pending", "Earned", "Paid out", "Balance"].map((h) => <th key={h} className="px-4 py-3 font-medium whitespace-nowrap">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={8} className="py-14 text-center text-mist">No affiliate activity yet. It appears here once someone shares their link and gets clicks or orders.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.u.id} className="border-b border-line/60 last:border-0 hover:bg-panel2/50">
                <td className="px-4 py-3"><p className="font-medium">{r.u.name}</p><p className="text-xs text-mist">{r.u.email}</p></td>
                <td className="px-4 py-3 font-mono text-xs text-mist">{r.u.refCode}</td>
                <td className="px-4 py-3">{r.u.refClicks}</td>
                <td className="px-4 py-3">{r.orders}</td>
                <td className="px-4 py-3 text-mist">{tk(r.pending)}</td>
                <td className="px-4 py-3">{tk(r.earned)}</td>
                <td className="px-4 py-3 text-mist">{tk(r.paidOut)}</td>
                <td className="px-4 py-3 font-semibold text-brand">{tk(r.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
