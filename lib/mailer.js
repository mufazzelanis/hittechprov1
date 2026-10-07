import nodemailer from "nodemailer";
import { getSettings } from "./settings";

// Sends transactional email through SMTP - works with the domain's own mailbox (cPanel -> Email
// Accounts, e.g. admin@hittechpro.net) or any provider (SendGrid, Mailgun, Brevo, ...) without a
// server restart: Admin -> Settings -> Email (SMTP) writes straight to the database and is re-read on
// every send. The .env SMTP_* values (if any) are only a fallback, for a site set up before this panel
// existed. If nothing is configured yet, emails are logged to the console instead of thrown as an
// error, so every flow (reset, welcome, order confirmation...) stays testable before real credentials exist.
let cache = null; // { key, transporter }

async function getTransporter() {
  const s = await getSettings({ withSecrets: true });
  const host = s.smtpHost || process.env.SMTP_HOST || "";
  const port = parseInt(s.smtpPort || process.env.SMTP_PORT, 10) || 587;
  const user = s.smtpUser || process.env.SMTP_USER || "";
  const pass = s.smtpPass || process.env.SMTP_PASS || "";
  const fromName = s.smtpFromName || s.siteName || "";
  const fromEmail = s.smtpFromEmail || process.env.MAIL_FROM_EMAIL || user;
  const from = process.env.MAIL_FROM && !s.smtpFromEmail ? process.env.MAIL_FROM : fromName ? `"${fromName}" <${fromEmail}>` : fromEmail;
  if (!host || !user || !pass) return { transporter: null, from };

  const key = `${host}:${port}:${user}:${pass}`;
  if (cache?.key !== key) {
    cache = { key, transporter: nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } }) };
  }
  return { transporter: cache.transporter, from };
}

export async function sendMail({ to, subject, html, text }) {
  const { transporter, from } = await getTransporter();
  if (!transporter) {
    console.log(`[mailer] SMTP not configured - would have sent to ${to}:\n${subject}\n${text || html}`);
    return { sent: false };
  }
  await transporter.sendMail({ from, to, subject, html, text });
  return { sent: true };
}
