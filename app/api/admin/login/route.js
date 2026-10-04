export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signToken, cookieName } from "@/lib/auth";
import { limited } from "@/lib/rateLimit";
import { audit } from "@/lib/adminAuth";

export async function POST(req) {
  const tooMany = limited(req, "admin-login", 8, 900);
  if (tooMany) return tooMany;
  const { email, password } = await req.json().catch(() => ({}));
  const em = String(email || "").trim().toLowerCase().slice(0, 160);
  const user = em ? await prisma.user.findUnique({ where: { email: em } }) : null;
  const ok = user && user.role === "ADMIN" && (await bcrypt.compare(String(password || ""), user.password));
  if (!ok) {
    // Logged with the email tried (never the password), so repeated guessing shows up in the activity log.
    if (em) await audit(null, "auth.login_failed", { target: em, req });
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }
  // Checked only after the password, so a suspended account can't be discovered by guessing emails.
  if (!user.active) {
    await audit(user, "auth.login_blocked", { target: user.email, detail: "Suspended account tried to sign in", req });
    return NextResponse.json({ error: "This admin account is suspended. Ask an owner to reactivate it." }, { status: 403 });
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await audit(user, "auth.login", { target: user.email, req });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookieName(), signToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
