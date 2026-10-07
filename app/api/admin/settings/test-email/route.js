export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { guard } from "@/lib/adminAuth";
import { getSettings } from "@/lib/settings";

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
  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject: `Test email from ${s.siteName}`,
      text: `This is a test email from your ${s.siteName} admin panel. If you got this, your SMTP settings work correctly.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#1c1c28">
        <h2 style="margin:0 0 12px">It works!</h2>
        <p>This is a test email from your <b>${s.siteName}</b> admin panel.</p>
        <p style="color:#6b7280;font-size:13px">If you got this, your SMTP settings are correct and every automatic email (welcome, order confirmation, password reset...) will now be delivered.</p>
      </div>`,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e?.message || "Could not send - check the host, port, username and password." }, { status: 400 });
  }
}
