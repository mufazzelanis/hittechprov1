import crypto from "crypto";
import { prisma } from "./db";
import { sendMail } from "./mailer";

const TOKEN_BYTES = 32;
const EXPIRY_MINUTES = 45;

const hashToken = (raw) => crypto.createHash("sha256").update(raw).digest("hex");

// Issues a reset link for `user` (works for a CUSTOMER or an ADMIN row - same table) and emails it.
// The raw token only ever exists in the email link and this one moment in memory; the database only
// ever stores its SHA-256 hash, so a database leak alone can't be used to take over an account.
export async function issuePasswordReset(user, { siteUrl, siteName, resetPath }) {
  const raw = crypto.randomBytes(TOKEN_BYTES).toString("hex");
  await prisma.user.update({
    where: { id: user.id },
    data: { resetTokenHash: hashToken(raw), resetTokenExpiry: new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000) },
  });

  const link = `${siteUrl.replace(/\/$/, "")}${resetPath}?token=${raw}`;
  await sendMail({
    to: user.email,
    subject: `Reset your ${siteName} password`,
    text: `Hi ${user.name},\n\nSomeone (hopefully you) asked to reset the password for this account.\n\nReset it here (valid for ${EXPIRY_MINUTES} minutes, works once):\n${link}\n\nIf you didn't request this, you can safely ignore this email - your password will not change.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#1c1c28">
        <h2 style="margin:0 0 12px">Reset your password</h2>
        <p>Hi ${user.name},</p>
        <p>Someone (hopefully you) asked to reset the password for your ${siteName} account.</p>
        <p style="margin:24px 0">
          <a href="${link}" style="background:#E8352B;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold;display:inline-block">Reset password</a>
        </p>
        <p style="color:#6b7280;font-size:13px">This link works once and expires in ${EXPIRY_MINUTES} minutes.
        If you didn't request this, you can safely ignore this email - your password will not change.</p>
      </div>`,
  });
}

// Verifies a raw token from the reset link and, if valid, sets the new password. Always clears the
// token afterwards (whether it succeeded or was already used) so it can never be replayed.
export async function consumePasswordReset(rawToken, newPasswordHash) {
  const user = await prisma.user.findFirst({ where: { resetTokenHash: hashToken(String(rawToken || "")) } });
  if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) return null;
  await prisma.user.update({
    where: { id: user.id },
    data: { password: newPasswordHash, resetTokenHash: null, resetTokenExpiry: null },
  });
  return user;
}
