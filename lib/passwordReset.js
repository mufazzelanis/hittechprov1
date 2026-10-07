import crypto from "crypto";
import { prisma } from "./db";
import { sendMail } from "./mailer";
import { emailLayout, emailButton, esc, MIST } from "./emailTemplate";

const TOKEN_BYTES = 32;
const EXPIRY_MINUTES = 45;

const hashToken = (raw) => crypto.createHash("sha256").update(raw).digest("hex");

// Issues a reset link for `user` (works for a CUSTOMER or an ADMIN row - same table) and emails it.
// The raw token only ever exists in the email link and this one moment in memory; the database only
// ever stores its SHA-256 hash, so a database leak alone can't be used to take over an account.
export async function issuePasswordReset(user, { siteUrl, s, resetPath }) {
  const raw = crypto.randomBytes(TOKEN_BYTES).toString("hex");
  await prisma.user.update({
    where: { id: user.id },
    data: { resetTokenHash: hashToken(raw), resetTokenExpiry: new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000) },
  });

  const link = `${siteUrl.replace(/\/$/, "")}${resetPath}?token=${raw}`;
  const body = `
    <h1 style="margin:0 0 14px;font-size:21px;font-weight:800;">Reset your password</h1>
    <p style="margin:0 0 4px;">Hi ${esc(user.name)},</p>
    <p style="margin:10px 0 0;color:${MIST};">Someone (hopefully you) asked to reset the password for your ${esc(s.siteName)} account.</p>
    ${emailButton("Reset password", link)}
    <p style="margin:6px 0 0;font-size:13px;color:${MIST};">This link works once and expires in ${EXPIRY_MINUTES} minutes. If you didn't request this, you can safely ignore this email - your password will not change.</p>`;
  await sendMail({
    to: user.email,
    subject: `Reset your ${s.siteName} password`,
    text: `Hi ${user.name},\n\nSomeone (hopefully you) asked to reset the password for this account.\n\nReset it here (valid for ${EXPIRY_MINUTES} minutes, works once):\n${link}\n\nIf you didn't request this, you can safely ignore this email - your password will not change.`,
    html: emailLayout({ s, eyebrow: "Password reset", preheader: "Reset your password - this link expires soon.", bodyHtml: body }),
  });
}

// Verifies a raw token from the reset link and, if valid, sets the new password. Always clears the
// token afterwards (whether it succeeded or was already used) so it can never be replayed.
export async function consumePasswordReset(rawToken, newPasswordHash) {
  const user = await prisma.user.findFirst({ where: { resetTokenHash: hashToken(String(rawToken || "")) } });
  if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) return null;
  await prisma.user.update({
    where: { id: user.id },
    // A reset also ends every existing admin session (someone else may have been signed in).
    data: { password: newPasswordHash, resetTokenHash: null, resetTokenExpiry: null, tokenVersion: { increment: 1 } },
  });
  return user;
}
