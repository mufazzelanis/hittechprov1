import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SETTING_DEFAULTS } from "@/lib/settingsDefaults";
import { guard, audit } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function PUT(req) {
  const { admin, res } = await guard("settings.manage");
  if (res) return res;
  const body = await req.json().catch(() => ({}));
  const keys = Object.keys(SETTING_DEFAULTS).filter((k) => k in body);
  const before = Object.fromEntries((await prisma.setting.findMany({ where: { key: { in: keys } } })).map((r) => [r.key, r.value]));
  const changed = keys.filter((k) => (before[k] ?? SETTING_DEFAULTS[k]) !== String(body[k] ?? ""));
  await prisma.$transaction(keys.map((key) => {
    const value = String(body[key] ?? "");
    return prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }));
  // Names only, never values: some settings are secret keys and tokens.
  if (changed.length) await audit(admin, "settings.update", { target: `${changed.length} setting(s)`, detail: changed.join(", "), req });
  return NextResponse.json({ ok: true });
}
