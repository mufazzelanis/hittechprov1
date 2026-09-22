export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { limited } from "@/lib/rateLimit";

export async function PUT(req) {
  const s = getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tooMany = limited(req, "admin-password", 8, 900);
  if (tooMany) return tooMany;
  const { current, next } = await req.json().catch(() => ({}));
  if (!next || String(next).length < 8)
    return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { id: s.id } });
  if (!user || !(await bcrypt.compare(String(current || ""), user.password)))
    return NextResponse.json({ error: "Current password is wrong" }, { status: 400 });
  await prisma.user.update({ where: { id: user.id }, data: { password: await bcrypt.hash(String(next), 10) } });
  return NextResponse.json({ ok: true });
}
