export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { limited } from "@/lib/rateLimit";

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const deny = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

// The safe alternative to a public "admin registration" page: only someone already signed in as admin
// can create another admin account, and only from inside the panel - never a self-serve form on the
// open internet.
export async function GET() {
  if (!getSession()) return deny();
  const rows = await prisma.user.findMany({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" }, select: { id: true, name: true, email: true, createdAt: true } });
  return NextResponse.json({ rows });
}

export async function POST(req) {
  const session = getSession();
  if (!session) return deny();
  const tooMany = limited(req, "admin-team-add", 10, 3600);
  if (tooMany) return tooMany;

  const b = await req.json().catch(() => ({}));
  const name = String(b.name || "").trim().slice(0, 120);
  const email = String(b.email || "").trim().toLowerCase().slice(0, 160);
  const password = String(b.password || "");
  if (!name || !EMAIL_RE.test(email)) return NextResponse.json({ error: "Enter a valid name and email." }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  if (await prisma.user.findUnique({ where: { email } })) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });

  const user = await prisma.user.create({ data: { name, email, password: await bcrypt.hash(password, 10), role: "ADMIN" } });
  return NextResponse.json({ ok: true, id: user.id });
}
