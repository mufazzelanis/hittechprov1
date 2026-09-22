import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { limited } from "@/lib/rateLimit";
import { parseUA } from "@/lib/ua";
import { geoLookup } from "@/lib/geoip";
import { notifyBus } from "@/lib/notify";

export const dynamic = "force-dynamic";

const clip = (v, n) => String(v ?? "").trim().slice(0, n) || null;

// Fired once per page view from VisitTracker.jsx. Fire-and-forget from the browser's side (keepalive),
// so it never delays or breaks the page it's reporting on.
export async function POST(req) {
  // generous: this fires on every navigation, easily several per minute for one visitor
  const tooMany = limited(req, "track-visit", 240, 60);
  if (tooMany) return new NextResponse(null, { status: 204 });

  const b = await req.json().catch(() => ({}));
  const sessionId = clip(b.sessionId, 60);
  if (!sessionId) return new NextResponse(null, { status: 204 });

  const h = req.headers;
  const ip = (h.get("x-forwarded-for") || "").split(",")[0].trim() || h.get("x-real-ip") || "";
  const { device, os, browser } = parseUA(h.get("user-agent") || "");
  const geo = await geoLookup(ip);

  const uid = getUserId();
  const user = uid ? await prisma.user.findUnique({ where: { id: uid }, select: { name: true, email: true, phone: true } }).catch(() => null) : null;

  const row = await prisma.visit.create({
    data: {
      sessionId,
      userId: uid || null,
      name: user?.name || null,
      email: user?.email || null,
      phone: user?.phone || null,
      path: clip(b.path, 300) || "/",
      referrer: clip(b.referrer, 500),
      utmSource: clip(b.utm?.source, 100),
      utmMedium: clip(b.utm?.medium, 100),
      utmCampaign: clip(b.utm?.campaign, 100),
      ip: ip || null,
      country: geo?.country || null,
      region: geo?.region || null,
      city: geo?.city || null,
      device,
      browser,
      os,
    },
  });
  notifyBus.emit("visit", row);
  return new NextResponse(null, { status: 204 });
}
