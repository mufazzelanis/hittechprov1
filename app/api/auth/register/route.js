export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signUserToken, userCookieName } from "@/lib/auth";
import { ensureRefCode } from "@/lib/affiliate";
import { limited } from "@/lib/rateLimit";
import { pushNotification } from "@/lib/notify";
import { identifyVisitor } from "@/lib/visits";

export async function POST(req) {
  const tooMany = limited(req, "register", 8, 3600);
  if (tooMany) return tooMany;
  const b = await req.json().catch(() => ({}));
  const name = String(b.name || "").trim().slice(0, 120);
  const email = String(b.email || "").trim().toLowerCase().slice(0, 160);
  const password = String(b.password || "");
  if (!name || !/^\S+@\S+\.\S+$/.test(email))
    return NextResponse.json({ error: "Enter a valid name and email." }, { status: 400 });
  if (password.length < 8)
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  if (await prisma.user.findUnique({ where: { email } }))
    return NextResponse.json({ error: "An account with this email already exists. Please sign in." }, { status: 409 });

  const phone = String(b.phone || "").trim().slice(0, 40) || null;
  const user = await prisma.user.create({
    data: { name, email, phone, password: await bcrypt.hash(password, 10) },
  });
  await ensureRefCode(user);
  pushNotification({ type: "signup", title: "New account created", body: `${name} · ${email}`, href: "/admin/affiliates" }).catch(() => {});
  identifyVisitor(b.visitorId, { name, email, phone }).catch(() => {});

  const res = NextResponse.json({ ok: true });
  res.cookies.set(userCookieName(), signUserToken(user), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return res;
}
