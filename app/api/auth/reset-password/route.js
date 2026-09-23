export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { limited } from "@/lib/rateLimit";
import { consumePasswordReset } from "@/lib/passwordReset";

export async function POST(req) {
  const tooMany = limited(req, "reset-password", 10, 3600);
  if (tooMany) return tooMany;

  const { token, password } = await req.json().catch(() => ({}));
  if (!token || typeof token !== "string") return NextResponse.json({ error: "This link is invalid or has expired. Please request a new one." }, { status: 400 });
  if (String(password || "").length < 8) return NextResponse.json({ error: "Use at least 8 characters." }, { status: 400 });

  const hash = await bcrypt.hash(String(password), 10);
  const user = await consumePasswordReset(token, hash);
  if (!user) return NextResponse.json({ error: "This link is invalid or has expired. Please request a new one." }, { status: 400 });

  return NextResponse.json({ ok: true, admin: user.role === "ADMIN" });
}
