import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { dhakaDay, dhakaStart, addDays } from "@/lib/dhaka";

export const dynamic = "force-dynamic";

// GET ?days=7  (7 | 30 | 90) - everything the top of the Analytics page needs, in one round trip.
export async function GET(req) {
  if (!getSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const days = Math.min(90, Math.max(1, parseInt(new URL(req.url).searchParams.get("days"), 10) || 7));
  const today = dhakaDay(new Date());
  const from = addDays(today, -(days - 1));
  const start = dhakaStart(from);
  const end = dhakaStart(addDays(today, 1));
  const prevStart = dhakaStart(addDays(from, -days));

  const [
    totalViews, uniqueRows, identifiedRows, newSessionRows, prevUniqueRows,
    topPages, devices, browsers, os, countries, referrerRows, utmRows,
    liveRows, dailyRows,
  ] = await Promise.all([
    prisma.visit.count({ where: { createdAt: { gte: start, lt: end } } }),
    prisma.$queryRaw`SELECT COUNT(DISTINCT sessionId) as c FROM Visit WHERE createdAt >= ${start} AND createdAt < ${end}`,
    prisma.$queryRaw`SELECT COUNT(DISTINCT sessionId) as c FROM Visit WHERE createdAt >= ${start} AND createdAt < ${end} AND email IS NOT NULL`,
    prisma.$queryRaw`SELECT COUNT(*) as c FROM (SELECT sessionId, MIN(createdAt) as first FROM Visit GROUP BY sessionId) t WHERE first >= ${start} AND first < ${end}`,
    prisma.$queryRaw`SELECT COUNT(DISTINCT sessionId) as c FROM Visit WHERE createdAt >= ${prevStart} AND createdAt < ${start}`,
    prisma.$queryRaw`SELECT path, COUNT(*) as c FROM Visit WHERE createdAt >= ${start} AND createdAt < ${end} GROUP BY path ORDER BY c DESC LIMIT 12`,
    prisma.$queryRaw`SELECT device as k, COUNT(DISTINCT sessionId) as c FROM Visit WHERE createdAt >= ${start} AND createdAt < ${end} GROUP BY device ORDER BY c DESC`,
    prisma.$queryRaw`SELECT browser as k, COUNT(DISTINCT sessionId) as c FROM Visit WHERE createdAt >= ${start} AND createdAt < ${end} GROUP BY browser ORDER BY c DESC LIMIT 8`,
    prisma.$queryRaw`SELECT os as k, COUNT(DISTINCT sessionId) as c FROM Visit WHERE createdAt >= ${start} AND createdAt < ${end} GROUP BY os ORDER BY c DESC LIMIT 8`,
    prisma.$queryRaw`SELECT country as k, COUNT(DISTINCT sessionId) as c FROM Visit WHERE createdAt >= ${start} AND createdAt < ${end} AND country IS NOT NULL GROUP BY country ORDER BY c DESC LIMIT 10`,
    prisma.$queryRaw`SELECT referrer FROM Visit WHERE createdAt >= ${start} AND createdAt < ${end} AND referrer IS NOT NULL AND referrer != '' LIMIT 800`,
    prisma.$queryRaw`SELECT utmSource as k, COUNT(DISTINCT sessionId) as c FROM Visit WHERE createdAt >= ${start} AND createdAt < ${end} AND utmSource IS NOT NULL GROUP BY utmSource ORDER BY c DESC LIMIT 10`,
    prisma.$queryRaw`SELECT COUNT(DISTINCT sessionId) as c FROM Visit WHERE createdAt >= ${new Date(Date.now() - 5 * 60000)}`,
    prisma.$queryRaw`SELECT createdAt, sessionId FROM Visit WHERE createdAt >= ${start} AND createdAt < ${end}`,
  ]);

  const num = (rows) => Number(rows?.[0]?.c || 0);
  const asList = (rows) => rows.map((r) => ({ key: r.k || "Unknown", count: Number(r.c) }));

  // group referrers by hostname (skip our own domain - that is just internal navigation, not a source)
  const hostCounts = new Map();
  for (const { referrer } of referrerRows) {
    try {
      const host = new URL(referrer).hostname.replace(/^www\./, "");
      hostCounts.set(host, (hostCounts.get(host) || 0) + 1);
    } catch {}
  }
  const topReferrers = [...hostCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([key, count]) => ({ key, count }));

  const byDay = new Map();
  for (let i = 0; i < days; i++) byDay.set(addDays(from, i), { views: 0, visitors: new Set() });
  for (const r of dailyRows) {
    const d = dhakaDay(r.createdAt);
    const bucket = byDay.get(d);
    if (bucket) { bucket.views++; bucket.visitors.add(r.sessionId); }
  }
  const daily = [...byDay.entries()].map(([date, b]) => ({ date, views: b.views, visitors: b.visitors.size }));

  const uniqueVisitors = num(uniqueRows);
  const newVisitors = num(newSessionRows);
  const prevUnique = num(prevUniqueRows);

  return NextResponse.json({
    range: { from, to: today, days },
    summary: {
      views: totalViews,
      visitors: uniqueVisitors,
      identified: num(identifiedRows),
      newVisitors,
      returningVisitors: Math.max(0, uniqueVisitors - newVisitors),
      liveNow: num(liveRows),
      prevVisitors: prevUnique,
    },
    daily,
    topPages: topPages.map((r) => ({ key: r.path, count: Number(r.c) })),
    topReferrers,
    topSources: asList(utmRows),
    devices: asList(devices),
    browsers: asList(browsers),
    os: asList(os),
    countries: asList(countries),
  });
}
