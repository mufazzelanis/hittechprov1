export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const deny = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function DELETE(_req, { params }) {
  const session = getSession();
  if (!session) return deny();
  if (params.id === session.id) return NextResponse.json({ error: "You can't remove your own account while signed in as it." }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target || target.role !== "ADMIN") return NextResponse.json({ error: "Admin not found." }, { status: 404 });

  const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
  if (adminCount <= 1) return NextResponse.json({ error: "At least one admin account must remain." }, { status: 400 });

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
