import { redirect } from "next/navigation";
import { Wallet, Users, MousePointerClick, Clock } from "lucide-react";
import SiteShell from "@/components/SiteShell";
import { LogoutButton, CopyLink, PayoutForm } from "@/components/account/AccountBits";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { getPaymentOptions } from "@/lib/payments";
import { getChannels } from "@/lib/channels";
import { withText, fillMsg, waChannel } from "@/lib/wa";
import { MessageCircle } from "lucide-react";
import { ensureRefCode, affiliateStats, affiliateOn } from "@/lib/affiliate";

export const dynamic = "force-dynamic";
export const metadata = { title: "Client Area — HiT Tech Pro", robots: { index: false } };

const STATUS = {
  PENDING: "bg-amber-500/15 text-amber-300",
  PAID: "bg-sky-500/15 text-sky-300",
  DELIVERED: "bg-emerald-500/15 text-emerald-300",
  REFUNDED: "bg-purple-500/15 text-purple-300",
  CANCELLED: "bg-zinc-500/20 text-zinc-300",
  REJECTED: "bg-red-500/15 text-red-300",
};
const fmt = (d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const tk = (n) => `৳${Number(n).toLocaleString()}`;

export default async function AccountPage() {
  const id = getUserId();
  let user = id ? await prisma.user.findUnique({ where: { id } }) : null;
  if (!user) redirect("/login");
  user = { ...user, refCode: await ensureRefCode(user) };

  const s = await getSettings();
  const affOn = affiliateOn(s);
  const [orders, payouts, stats] = await Promise.all([
    prisma.order.findMany({ where: { OR: [{ userId: user.id }, { email: user.email }] }, orderBy: { createdAt: "desc" } }),
    prisma.payout.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    affiliateStats(user),
  ]);
  const min = parseInt(s.affMinPayout, 10) || 0;
  const wa = waChannel(getChannels(s));
  const methods = getPaymentOptions(s).map((o) => o.name);

  const cards = [
    { l: "Available balance", v: tk(stats.balance), i: Wallet, hot: stats.balance >= min && min > 0 },
    { l: "Total earned", v: tk(stats.earned), i: Wallet },
    { l: "Referred orders", v: stats.referrals, i: Users },
    { l: "Link clicks", v: user.refClicks, i: MousePointerClick },
  ];

  return (
    <SiteShell>
      <div className="container-x pt-28 pb-24 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Hello, {user.name.split(" ")[0]}</h1>
            <p className="text-mist text-sm mt-1">{user.email}</p>
          </div>
          <LogoutButton />
        </div>

        <section>
          <h2 className="font-display font-semibold text-xl mb-4">My orders</h2>
          <div className="rounded-2xl border border-line bg-panel overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-mist border-b border-line">
                  {["Order", "Item", "Amount", "Date", "Status", ""].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-mist">No orders yet. <a href="/tools" className="text-brand underline">Browse tools</a></td></tr>}
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3 text-mist">#{o.number}</td>
                    <td className="px-4 py-3 font-medium">{o.itemName}</td>
                    <td className="px-4 py-3">{tk(o.amount)}</td>
                    <td className="px-4 py-3 text-mist whitespace-nowrap">{fmt(o.createdAt)}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS[o.status]}`}>{o.status}</span></td>
                    <td className="px-4 py-3 text-right">
                      {wa && <a href={withText(wa.href, fillMsg(s.waAccountMsg, { number: o.number, items: o.itemName }))} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110" style={{ background: "linear-gradient(135deg,#2BE372,#0E9F6E)" }}><MessageCircle size={13} /> {s.waAccountLabel}</a>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {affOn && (
        <section id="affiliate">
          <h2 className="font-display font-semibold text-xl mb-1">Affiliate program</h2>
          <p className="text-mist text-sm mb-4">Share your link. You earn {s.affRate}% of each order placed through it once the order is confirmed. Cookie lasts {s.affCookieDays} days.</p>
          <div className="rounded-2xl border border-line bg-panel p-6 space-y-6">
            <div>
              <p className="text-xs text-mist mb-2">Your referral link</p>
              <CopyLink code={user.refCode} />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {cards.map((c) => (
                <div key={c.l} className={`rounded-xl border p-4 ${c.hot ? "border-brand/50" : "border-line"} bg-ink/40`}>
                  <c.i size={16} className="text-brand" />
                  <p className="font-display font-bold text-xl mt-2">{c.v}</p>
                  <p className="text-xs text-mist">{c.l}</p>
                </div>
              ))}
            </div>
            {stats.pending > 0 && (
              <p className="text-xs text-mist flex items-center gap-2"><Clock size={13} /> {tk(stats.pending)} pending, counted once those orders are confirmed.</p>
            )}
            <PayoutForm balance={stats.balance} min={min} methods={methods} />
          </div>

          {payouts.length > 0 && (
            <div className="rounded-2xl border border-line bg-panel overflow-x-auto mt-5">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-mist border-b border-line">{["Date", "Amount", "Method", "Account", "Status"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
                <tbody>
                  {payouts.map((p) => (
                    <tr key={p.id} className="border-b border-line/60 last:border-0">
                      <td className="px-4 py-3 text-mist">{fmt(p.createdAt)}</td>
                      <td className="px-4 py-3">{tk(p.amount)}</td>
                      <td className="px-4 py-3">{p.method}</td>
                      <td className="px-4 py-3 text-mist">{p.account}</td>
                      <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS[p.status]}`}>{p.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        )}
      </div>
    </SiteShell>
  );
}
