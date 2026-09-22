import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET the full, page-by-page timeline for one visitor session (admin expands a row to see this).
export async function GET(_req, { params }) {
  if (!getSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await prisma.visit.findMany({
    where: { sessionId: String(params.id).slice(0, 60) },
    orderBy: { createdAt: "asc" },
    select: { path: true, referrer: true, createdAt: true },
    take: 300,
  });
  return NextResponse.json({ rows });
}
