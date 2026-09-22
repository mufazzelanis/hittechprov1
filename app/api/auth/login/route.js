export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signUserToken, userCookieName } from "@/lib/auth";
import { limited } from "@/lib/rateLimit";

export async function POST(req) {
  const tooMany = limited(req, "login", 12, 900);
  if (tooMany) return tooMany;
  const { email, password } = await req.json().catch(() => ({}));
  const user = email ? await prisma.user.findUnique({ where: { email: String(email).trim().toLowerCase() } }) : null;
  if (!user || !(await bcrypt.compare(String(password || ""), user.password)))
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(userCookieName(), signUserToken(user), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return res;
}
