import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { dhakaDay, dhakaStart, addDays, validDay, daysBetween } from "@/lib/dhaka";

export const dynamic = "force-dynamic";

const ALL = ["PENDING", "PAID", "DELIVERED", "REFUNDED", "CANCELLED", "REJECTED"];
const sum = (rows) => rows.reduce((n, o) => n + o.amount, 0);
const group = (rows, keyFn) => {
  const m = new Map();
  for (const o of rows) { const k = keyFn(o) || "—"; const g = m.get(k) || { key: k, orders: 0, revenue: 0 }; g.orders++; g.revenue += o.amount; m.set(k, g); }
  return [...m.values()].sort((a, b) => b.revenue - a.revenue);
};

// GET ?from=YYYY-MM-DD&to=YYYY-MM-DD&status=PAID,DELIVERED  (days are Bangladesh calendar days)
export async function GET(req) {
  if (!getSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const u = new URL(req.url).searchParams;
  const today = dhakaDay(new Date());
  let to = validDay(u.get("to")) ? u.get("to") : today;
  let from = validDay(u.get("from")) ? u.get("from") : addDays(to, -29);
  if (from > to) [from, to] = [to, from];
  if (daysBetween(from, to) > 731) from = addDays(to, -730);
  const days = daysBetween(from, to);
  const statuses = (u.get("status") || "PAID,DELIVERED").split(",").filter((s) => ALL.includes(s));
  const want = statuses.length ? statuses : ["PAID", "DELIVERED"];

  const start = dhakaStart(from), end = dhakaStart(addDays(to, 1));
  const prevFrom = addDays(from, -days), prevStart = dhakaStart(prevFrom);
  // one query covers the range, the previous period of equal length, and the quick cards (today, yesterday, this/last month)
  const monthStart = today.slice(0, 8) + "01";
  const lastMonthStart = addDays(monthStart, -1).slice(0, 8) + "01";
  const floor = [prevStart, dhakaStart(lastMonthStart)].sort((a, b) => a - b)[0];
  const rows = await prisma.order.findMany({ where: { createdAt: { gte: floor, lt: end > dhakaStart(addDays(today, 1)) ? end : dhakaStart(addDays(today, 1)) } }, orderBy: { createdAt: "asc" } });

  const sold = (o) => want.includes(o.status);
  const day = (o) => dhakaDay(o.createdAt);
  const inRange = rows.filter((o) => o.createdAt >= start && o.createdAt < end);
  const sales = inRange.filter(sold);
  const prev = rows.filter((o) => o.createdAt >= prevStart && o.createdAt < start && sold(o));

  const byDay = new Map();
  for (const o of sales) { const g = byDay.get(day(o)) || { orders: 0, revenue: 0 }; g.orders++; g.revenue += o.amount; byDay.set(day(o), g); }
  const daily = [];
  for (let i = 0; i < days; i++) { const d = addDays(from, i); daily.push({ date: d, ...(byDay.get(d) || { orders: 0, revenue: 0 }) }); }

  const items = new Map();
  for (const o of sales) for (const name of String(o.itemName || "").split(", ").map((x) => x.trim()).filter(Boolean)) items.set(name, (items.get(name) || 0) + 1);
  const topItems = [...items.entries()].map(([name, orders]) => ({ name, orders })).sort((a, b) => b.orders - a.orders);

  const quick = (a, b) => { const r = rows.filter((o) => sold(o) && day(o) >= a && day(o) <= b); return { revenue: sum(r), orders: r.length }; };
  const yesterday = addDays(today, -1);

  return NextResponse.json({
    range: { from, to, days, statuses: want },
    summary: { revenue: sum(sales), orders: sales.length, avg: sales.length ? Math.round(sum(sales) / sales.length) : 0, items: topItems.reduce((n, i) => n + i.orders, 0), commission: sales.reduce((n, o) => n + (o.commission || 0), 0), best: daily.reduce((b, d) => (d.revenue > (b?.revenue ?? -1) ? d : b), null) },
    prev: { revenue: sum(prev), orders: prev.length, from: prevFrom, to: addDays(from, -1) },
    quick: { today: quick(today, today), yesterday: quick(yesterday, yesterday), month: quick(monthStart, today), lastMonth: quick(lastMonthStart, addDays(monthStart, -1)) },
    byStatus: ALL.map((s) => ({ status: s, orders: inRange.filter((o) => o.status === s).length, amount: sum(inRange.filter((o) => o.status === s)) })).filter((s) => s.orders),
    daily,
    bySource: group(sales, (o) => ({ tool: "Single tool", bundle: "Bundle", plan: "Custom pack", manual: "Manual (phone/chat)" }[o.itemType] || o.itemType)),
    byMethod: group(sales, (o) => o.method),
    topItems: topItems.slice(0, 50),
    orders: sales.map((o) => ({ number: o.number, date: o.createdAt.toISOString(), day: day(o), name: o.name, email: o.email, phone: o.phone, item: o.itemName, source: o.itemType, amount: o.amount, method: o.method || "", txnId: o.txnId || "", status: o.status, refCode: o.refCode || "", commission: o.commission || 0 })).reverse(),
    generated: new Date().toISOString(),
  });
}
