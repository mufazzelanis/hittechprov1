export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { guard } from "@/lib/adminAuth";

const PAGE = 50;

// GET ?area=auth|team|role|settings|orders|...&actor=<userId>&q=<text>&before=<ISO date>
export async function GET(req) {
  const { res } = await guard("team.view");
  if (res) return res;
  const sp = new URL(req.url).searchParams;
  const area = (sp.get("area") || "").replace(/[^a-zA-Z]/g, "").slice(0, 30);
  const actor = (sp.get("actor") || "").slice(0, 40);
  const q = (sp.get("q") || "").trim().slice(0, 80);
  const before = sp.get("before") ? new Date(sp.get("before")) : null;

  const where = {
    ...(area ? { action: { startsWith: area + "." } } : {}),
    ...(actor ? { actorId: actor } : {}),
    ...(q ? { OR: [{ target: { contains: q } }, { detail: { contains: q } }, { actorName: { contains: q } }, { ip: { contains: q } }] } : {}),
    ...(before && !isNaN(before) ? { createdAt: { lt: before } } : {}),
  };
  const rows = await prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, take: PAGE + 1 });
  return NextResponse.json({ rows: rows.slice(0, PAGE), more: rows.length > PAGE });
}
