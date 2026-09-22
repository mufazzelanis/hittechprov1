import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { SETTING_DEFAULTS } from "@/lib/settingsDefaults";

export const dynamic = "force-dynamic";

export async function PUT(req) {
  if (!getSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const ops = Object.keys(SETTING_DEFAULTS)
    .filter((k) => k in body)
    .map((key) => {
      const value = String(body[key] ?? "");
      return prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
    });
  await prisma.$transaction(ops);
  return NextResponse.json({ ok: true });
}
