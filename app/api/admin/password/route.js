export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signToken, cookieName } from "@/lib/auth";
import { limited } from "@/lib/rateLimit";
import { guard, audit } from "@/lib/adminAuth";

// Any signed-in admin can change their OWN password. Doing so signs out every other device (the token
// version moves on) and re-issues this browser's cookie so the current session continues.
export async function PUT(req) {
  const { admin, res } = await guard();
  if (res) return res;
  const tooMany = limited(req, "admin-password", 8, 900);
  if (tooMany) return tooMany;
  const { current, next } = await req.json().catch(() => ({}));
  if (!next || String(next).length < 8)
    return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { id: admin.id } });
  if (!user || !(await bcrypt.compare(String(current || ""), user.password)))
    return NextResponse.json({ error: "Current password is wrong" }, { status: 400 });
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { password: await bcrypt.hash(String(next), 10), tokenVersion: { increment: 1 } },
  });
  await audit(admin, "auth.password_change", { target: admin.email, detail: "Changed own password; other sessions signed out", req });
  const out = NextResponse.json({ ok: true });
  out.cookies.set(cookieName(), signToken(updated), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return out;
}
