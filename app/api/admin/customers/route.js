import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { dhakaDay, dhakaStart, addDays } from "@/lib/dhaka";
import { guard } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";
const PAGE = 25;

// GET ?days=&q=&page=1 - one row per IDENTIFIED customer (grouped by email across every
// session/device they've ever used), newest activity first. Anonymous visitors (no email
// yet) are covered separately by /api/admin/analytics/sessions.
export async function GET(req) {
  { const g = await guard("analytics.view"); if (g.res) return g.res; }
  const u = new URL(req.url).searchParams;
  const daysParam = u.get("days");
  const days = daysParam ? Math.min(365, Math.max(1, parseInt(daysParam, 10) || 90)) : null;
  const page = Math.max(1, parseInt(u.get("page"), 10) || 1);
  const q = (u.get("q") || "").trim().slice(0, 80);

  const where = days
    ? Prisma.sql`WHERE email IS NOT NULL AND email != '' AND createdAt >= ${dhakaStart(addDays(dhakaDay(new Date()), -(days - 1)))}`
    : Prisma.sql`WHERE email IS NOT NULL AND email != ''`;
  const like = `%${q}%`;
  const having = q
    ? Prisma.sql`HAVING (MAX(COALESCE(email,'')) LIKE ${like} OR MAX(COALESCE(name,'')) LIKE ${like} OR MAX(COALESCE(phone,'')) LIKE ${like} OR MAX(COALESCE(ip,'')) LIKE ${like})`
    : Prisma.empty;

  const rows = await prisma.$queryRaw`
    SELECT email, MAX(name) as name, MAX(phone) as phone,
      MIN(createdAt) as firstSeen, MAX(createdAt) as lastSeen,
      COUNT(*) as pageCount, COUNT(DISTINCT sessionId) as sessionCount,
      COUNT(DISTINCT NULLIF(ip,'')) as ipCount,
      COUNT(DISTINCT CONCAT(COALESCE(city,''),'|',COALESCE(country,''))) as locationCount,
      MAX(ip) as lastIp, MAX(city) as lastCity, MAX(region) as lastRegion, MAX(country) as lastCountry,
      MAX(device) as lastDevice, MAX(browser) as lastBrowser, MAX(os) as lastOs
    FROM Visit
    ${where}
    GROUP BY email
    ${having}
    ORDER BY lastSeen DESC
    LIMIT ${PAGE} OFFSET ${(page - 1) * PAGE}
  `;
  const countRows = await prisma.$queryRaw`
    SELECT COUNT(*) as c FROM (
      SELECT email FROM Visit ${where} GROUP BY email ${having}
    ) t
  `;

  const emails = rows.map((r) => r.email);
  const [orders, users] = emails.length
    ? await Promise.all([
        prisma.order.groupBy({ by: ["email"], where: { email: { in: emails } }, _count: { _all: true }, _sum: { amount: true }, _max: { createdAt: true } }),
        prisma.user.findMany({ where: { email: { in: emails } }, select: { email: true, role: true, active: true, createdAt: true, lastLoginAt: true } }),
      ])
    : [[], []];
  const orderMap = Object.fromEntries(orders.map((o) => [o.email, { count: o._count._all, total: o._sum.amount || 0, lastAt: o._max.createdAt }]));
  const userMap = Object.fromEntries(users.map((u2) => [u2.email, u2]));

  const now = Date.now();
  const customers = rows.map((r) => {
    const ord = orderMap[r.email] || null;
    const account = userMap[r.email] || null;
    return {
      email: r.email,
      name: r.name,
      phone: r.phone,
      firstSeen: r.firstSeen,
      lastSeen: r.lastSeen,
      pageCount: Number(r.pageCount),
      sessionCount: Number(r.sessionCount),
      ipCount: Number(r.ipCount),
      locationCount: Number(r.locationCount),
      ip: r.lastIp,
      location: [r.lastCity, r.lastRegion, r.lastCountry].filter(Boolean).join(", ") || null,
      device: r.lastDevice,
      browser: r.lastBrowser,
      os: r.lastOs,
      orders: ord,
      account: account ? { role: account.role, active: account.active, joinedAt: account.createdAt, lastLoginAt: account.lastLoginAt } : null,
      online: now - new Date(r.lastSeen).getTime() < 5 * 60 * 1000,
      flagged: Number(r.ipCount) >= 4 || Number(r.locationCount) >= 3,
    };
  });

  return NextResponse.json({ rows: customers, total: Number(countRows[0]?.c || 0), page, pageSize: PAGE });
}
