export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { limited } from "@/lib/rateLimit";
import { issuePasswordReset } from "@/lib/passwordReset";
import { getSettings } from "@/lib/settings";

const EMAIL_RE = /^\S+@\S+\.\S+$/;

// Always returns the same generic response, whether or not the email exists (and whether or not it's
// an admin/customer mismatch) - the form must never be usable to check who has an account.
export async function POST(req) {
  const tooMany = limited(req, "forgot-password", 5, 3600);
  if (tooMany) return tooMany;

  const generic = NextResponse.json({ ok: true, message: "If an account exists for that email, a reset link has been sent." });
  const b = await req.json().catch(() => ({}));
  const email = String(b.email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return generic;

  const user = await prisma.user.findUnique({ where: { email } });
  // The admin forgot-password page only ever acts on an ADMIN row, so a customer typing their email
  // there learns nothing and gets no email meant for the control panel.
  if (user && (!b.admin || user.role === "ADMIN")) {
    const s = await getSettings();
    const origin = new URL(req.url).origin;
    issuePasswordReset(user, { siteUrl: origin, siteName: s.siteName, resetPath: b.admin ? "/admin/reset-password" : "/reset-password" }).catch((e) =>
      console.error("[forgot-password] failed to send email:", e)
    );
  }
  return generic;
}
