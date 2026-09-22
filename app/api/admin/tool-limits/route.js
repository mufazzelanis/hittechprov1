import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { infoKey, normalizeInfo } from "@/lib/limits";

export const dynamic = "force-dynamic";

// Admin-only: save one tool's status / limits.
export async function PUT(req) {
  if (!getSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const toolId = String(b.toolId || "");
  // the id can belong to a tool, a bundle or a custom pack
  const exists = toolId && ((await prisma.tool.findUnique({ where: { id: toolId }, select: { id: true } })) || (await prisma.bundle.findUnique({ where: { id: toolId }, select: { id: true } })) || (await prisma.packPlan.findUnique({ where: { id: toolId }, select: { id: true } })));
  if (!exists) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const info = { ...normalizeInfo(b), updated: new Date().toISOString() };
  await prisma.setting.upsert({
    where: { key: infoKey(toolId) },
    update: { value: JSON.stringify(info) },
    create: { key: infoKey(toolId), value: JSON.stringify(info) },
  });
  return NextResponse.json({ ok: true, info });
}
