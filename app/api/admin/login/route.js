export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signToken, cookieName } from "@/lib/auth";
import { limited } from "@/lib/rateLimit";

export async function POST(req) {
  const tooMany = limited(req, "admin-login", 8, 900);
  if (tooMany) return tooMany;
  const { email, password } = await req.json().catch(() => ({}));
  const user = email ? await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } }) : null;
  const ok = user && user.role === "ADMIN" && (await bcrypt.compare(String(password || ""), user.password));
  if (!ok) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

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
