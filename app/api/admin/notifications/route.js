import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const deny = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

// GET: the bell's initial load - recent notifications plus the unread count for the badge.
export async function GET() {
  if (!getSession()) return deny();
  const [rows, unread] = await Promise.all([
    prisma.notification.findMany({ orderBy: { createdAt: "desc" }, take: 40 }),
    prisma.notification.count({ where: { read: false } }),
  ]);
  return NextResponse.json({ rows, unread });
}

// PUT { id } marks one as read; PUT {} (or { all: true }) marks everything read.
export async function PUT(req) {
  if (!getSession()) return deny();
  const b = await req.json().catch(() => ({}));
  if (b.id) await prisma.notification.update({ where: { id: String(b.id) }, data: { read: true } }).catch(() => {});
  else await prisma.notification.updateMany({ where: { read: false }, data: { read: true } });
  return NextResponse.json({ ok: true });
}
