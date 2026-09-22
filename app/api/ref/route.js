export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";

// Counts a click on an affiliate link (called once per browser session).
export async function POST(req) {
  const { code } = await req.json().catch(() => ({}));
  if ((await getSettings()).affiliateOn !== "true") return NextResponse.json({ ok: false });
  const c = String(code || "").toUpperCase().slice(0, 12);
  if (!/^[A-Z0-9]{4,12}$/.test(c)) return NextResponse.json({ ok: false });
  const r = await prisma.user.updateMany({ where: { refCode: c }, data: { refClicks: { increment: 1 } } });
  return NextResponse.json({ ok: r.count > 0 });
}
