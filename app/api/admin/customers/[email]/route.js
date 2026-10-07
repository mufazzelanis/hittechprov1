import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { guard } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

// GET the full activity for one identified customer: every visit (across all their
// sessions/devices), every order, and the distinct IPs/devices they've connected from.
export async function GET(_req, { params }) {
  { const g = await guard("analytics.view"); if (g.res) return g.res; }
  const email = decodeURIComponent(String(params.email)).slice(0, 190);

  const [visits, orders] = await Promise.all([
    prisma.visit.findMany({
      where: { email },
      orderBy: { createdAt: "desc" },
      select: { path: true, referrer: true, ip: true, city: true, region: true, country: true, device: true, browser: true, os: true, sessionId: true, createdAt: true },
      take: 500,
    }),
    prisma.order.findMany({
      where: { email },
      orderBy: { createdAt: "desc" },
      select: { id: true, number: true, itemName: true, amount: true, status: true, method: true, createdAt: true },
      take: 100,
    }),
  ]);

  const ipSet = new Map();
  const deviceSet = new Map();
  for (const v of visits) {
    if (v.ip) ipSet.set(v.ip, { ip: v.ip, location: [v.city, v.region, v.country].filter(Boolean).join(", ") || null });
    const key = [v.device, v.browser, v.os].filter(Boolean).join(" · ");
    if (key) deviceSet.set(key, (deviceSet.get(key) || 0) + 1);
  }

  const timeline = [
    ...visits.map((v) => ({ type: "visit", at: v.createdAt, path: v.path, ip: v.ip, location: [v.city, v.region, v.country].filter(Boolean).join(", ") || null, device: v.device, browser: v.browser, sessionId: v.sessionId })),
    ...orders.map((o) => ({ type: "order", at: o.createdAt, number: o.number, itemName: o.itemName, amount: o.amount, status: o.status, method: o.method })),
  ].sort((a, b) => new Date(b.at) - new Date(a.at));

  return NextResponse.json({
    timeline: timeline.slice(0, 400),
    ips: [...ipSet.values()],
    devices: [...deviceSet.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count),
    orders,
    sessionCount: new Set(visits.map((v) => v.sessionId)).size,
  });
}
