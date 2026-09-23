import nodemailer from "nodemailer";

// Sends transactional email through the domain's own mailbox (e.g. admin@hittechpro.net) via SMTP -
// works with cPanel/Namecheap-hosted email without any third-party service or extra cost.
// If SMTP isn't configured yet (e.g. local development), emails are logged to the console instead of
// thrown as an error, so the reset-password flow stays testable before real credentials exist.
let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT, 10) || 587,
    secure: (parseInt(SMTP_PORT, 10) || 587) === 465, // 465 = implicit TLS, 587/25 = STARTTLS
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

export async function sendMail({ to, subject, html, text }) {
  const t = getTransporter();
  const from = process.env.MAIL_FROM || process.env.SMTP_USER || "no-reply@localhost";
  if (!t) {
    // Not configured yet (or running locally without real SMTP): don't fail the request, just make the
    // link visible in the server console so the flow can still be tested end to end.
    console.log(`[mailer] SMTP not configured - would have sent to ${to}:\n${subject}\n${text || html}`);
    return { sent: false };
  }
  await t.sendMail({ from, to, subject, html, text });
  return { sent: true };
}
