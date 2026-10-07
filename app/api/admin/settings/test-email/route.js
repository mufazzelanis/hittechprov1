export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { guard } from "@/lib/adminAuth";
import { getSettings } from "@/lib/settings";
import { emailLayout, MIST } from "@/lib/emailTemplate";

const EMAIL_RE = /^\S+@\S+\.\S+$/;

// Sends a one-off test email using the SMTP fields straight from the settings form - including any
// unsaved edits - so the admin can verify real credentials work before pressing Save.
export async function POST(req) {
  const { res: denied } = await guard("settings.manage");
  if (denied) return denied;

  const b = await req.json().catch(() => ({}));
  const to = String(b.to || "").trim();
  if (!EMAIL_RE.test(to)) return NextResponse.json({ error: "Enter a valid email address to send the test to." }, { status: 400 });

  const host = String(b.smtpHost || "").trim();
  const port = parseInt(b.smtpPort, 10) || 587;
  const user = String(b.smtpUser || "").trim();
  const pass = String(b.smtpPass || "");
  if (!host || !user || !pass) return NextResponse.json({ error: "Fill in the host, username and password first." }, { status: 400 });

  const s = await getSettings();
  const fromName = String(b.smtpFromName || "").trim() || s.siteName || "Website";
  const fromEmail = String(b.smtpFromEmail || "").trim() || user;

  const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
  const body = `
    <h1 style="margin:0 0 14px;font-size:21px;font-weight:800;">It works! ✅</h1>
    <p style="margin:0;">This is a test email from your <b>${s.siteName}</b> admin panel.</p>
    <p style="margin:14px 0 0;color:${MIST};font-size:13px;">If you got this, your SMTP settings are correct and every automatic email (welcome, order confirmation, password reset...) will now be delivered looking exactly like this.</p>`;
  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject: `Test email from ${s.siteName}`,
      text: `This is a test email from your ${s.siteName} admin panel. If you got this, your SMTP settings work correctly.`,
      html: emailLayout({ s, eyebrow: "Test email", preheader: "Your SMTP settings work correctly.", bodyHtml: body }),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e?.message || "Could not send - check the host, port, username and password." }, { status: 400 });
  }
}
