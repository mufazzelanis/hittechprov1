export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { limited } from "@/lib/rateLimit";
import { consumePasswordReset } from "@/lib/passwordReset";
import { audit } from "@/lib/adminAuth";

export async function POST(req) {
  const tooMany = limited(req, "reset-password", 10, 3600);
  if (tooMany) return tooMany;

  const { token, password } = await req.json().catch(() => ({}));
  if (!token || typeof token !== "string") return NextResponse.json({ error: "This link is invalid or has expired. Please request a new one." }, { status: 400 });
  if (String(password || "").length < 8) return NextResponse.json({ error: "Use at least 8 characters." }, { status: 400 });

  const hash = await bcrypt.hash(String(password), 10);
  const user = await consumePasswordReset(token, hash);
  if (!user) return NextResponse.json({ error: "This link is invalid or has expired. Please request a new one." }, { status: 400 });
  if (user.role === "ADMIN") await audit(user, "auth.password_reset", { target: user.email, detail: "Reset via email link; all sessions signed out", req });

  return NextResponse.json({ ok: true, admin: user.role === "ADMIN" });
}
