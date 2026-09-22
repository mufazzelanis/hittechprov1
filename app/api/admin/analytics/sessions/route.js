import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { dhakaDay, dhakaStart, addDays } from "@/lib/dhaka";

export const dynamic = "force-dynamic";
const PAGE = 25;

// GET ?days=7&q=&page=1 - one row per visitor (grouped by their browser session), newest activity first.
export async function GET(req) {
  if (!getSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const u = new URL(req.url).searchParams;
  const days = Math.min(90, Math.max(1, parseInt(u.get("days"), 10) || 7));
  const page = Math.max(1, parseInt(u.get("page"), 10) || 1);
  const q = (u.get("q") || "").trim().slice(0, 80);

  const today = dhakaDay(new Date());
  const start = dhakaStart(addDays(today, -(days - 1)));
  const end = dhakaStart(addDays(today, 1));
  const like = `%${q}%`;
  const having = q
    ? Prisma.sql`HAVING (MAX(COALESCE(email,'')) LIKE ${like} OR MAX(COALESCE(name,'')) LIKE ${like} OR MAX(COALESCE(phone,'')) LIKE ${like} OR MAX(COALESCE(ip,'')) LIKE ${like})`
    : Prisma.empty;

  const rows = await prisma.$queryRaw`
    SELECT sessionId, MIN(createdAt) as firstSeen, MAX(createdAt) as lastSeen, COUNT(*) as pageCount,
      MAX(email) as email, MAX(name) as name, MAX(phone) as phone, MAX(ip) as ip,
      MAX(country) as country, MAX(region) as region, MAX(city) as city,
      MAX(device) as device, MAX(browser) as browser, MAX(os) as os,
      MAX(referrer) as referrer, MAX(utmSource) as utmSource, MAX(utmMedium) as utmMedium, MAX(utmCampaign) as utmCampaign
    FROM Visit
    WHERE createdAt >= ${start} AND createdAt < ${end}
    GROUP BY sessionId
    ${having}
    ORDER BY lastSeen DESC
    LIMIT ${PAGE} OFFSET ${(page - 1) * PAGE}
  `;
  const countRows = await prisma.$queryRaw`
    SELECT COUNT(*) as c FROM (
      SELECT sessionId FROM Visit WHERE createdAt >= ${start} AND createdAt < ${end} GROUP BY sessionId ${having}
    ) t
  `;

  const emails = [...new Set(rows.map((r) => r.email).filter(Boolean))];
  const orders = emails.length ? await prisma.order.groupBy({ by: ["email"], where: { email: { in: emails } }, _count: { _all: true }, _sum: { amount: true } }) : [];
  const orderMap = Object.fromEntries(orders.map((o) => [o.email, { count: o._count._all, total: o._sum.amount || 0 }]));

  const sessions = rows.map((r) => ({
    sessionId: r.sessionId,
    firstSeen: r.firstSeen,
    lastSeen: r.lastSeen,
    pageCount: Number(r.pageCount),
    name: r.name,
    email: r.email,
    phone: r.phone,
    ip: r.ip,
    location: [r.city, r.region, r.country].filter(Boolean).join(", ") || null,
    country: r.country,
    device: r.device,
    browser: r.browser,
    os: r.os,
    referrer: r.referrer,
    source: r.utmSource ? `${r.utmSource}${r.utmMedium ? "/" + r.utmMedium : ""}` : (r.referrer ? safeHost(r.referrer) : "Direct"),
    orders: orderMap[r.email] || null,
  }));

  return NextResponse.json({ rows: sessions, total: Number(countRows[0]?.c || 0), page, pageSize: PAGE });
}

function safeHost(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return null; }
}
