import { sendMail } from "./mailer";
import { siteUrl } from "./seo";

// The three "optional" automatic emails (Admin -> Settings -> Email -> Automatic emails). Password
// reset/recovery, the Payoneer pay link and delivery notices live next to the code that triggers them
// (lib/passwordReset.js, the order paylink/deliver API routes) since the customer explicitly asked for
// those - they are never optional and have no on/off switch.
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function sendWelcomeEmail(user, s) {
  if (s.mailWelcomeOn === "false") return;
  const account = `${siteUrl(s)}/account`;
  await sendMail({
    to: user.email,
    subject: `Welcome to ${s.siteName}`,
    text: `Hi ${user.name},\n\nYour ${s.siteName} account is ready. Sign in any time to track orders and manage your account:\n${account}\n\n— ${s.siteName}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#1c1c28">
      <h2 style="margin:0 0 12px">Welcome to ${esc(s.siteName)}</h2>
      <p>Hi ${esc(user.name)},</p>
      <p>Your account is ready. Sign in any time to track orders and manage your account.</p>
      <p style="margin:24px 0"><a href="${esc(account)}" style="background:#E8352B;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold;display:inline-block">Go to my account</a></p>
    </div>`,
  }).catch((e) => console.error("[mail] welcome email failed:", e));
}

export async function sendOrderConfirmation(order, s) {
  if (s.mailOrderConfirmOn === "false") return;
  const account = `${siteUrl(s)}/account`;
  const amount = order.usdAmount ? `$${order.usdAmount.toFixed(2)}` : `৳${order.amount.toLocaleString()}`;
  await sendMail({
    to: order.email,
    subject: `Order confirmed — #${order.number} — ${s.siteName}`,
    text: `Hi ${order.name},\n\nThanks for your order! We've received Order #${order.number} (${order.itemName}) for ${amount}.\n\nTrack it any time in your Client Area:\n${account}\n\n— ${s.siteName}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1c1c28">
      <h2 style="margin:0 0 12px">Thanks for your order!</h2>
      <p>Hi ${esc(order.name)},</p>
      <p>We've received your order. Here's a quick summary:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
        <tr><td style="padding:6px 0;color:#6b7280">Order</td><td style="padding:6px 0;text-align:right;font-weight:bold">#${order.number}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280">Item${order.itemName.includes(",") ? "s" : ""}</td><td style="padding:6px 0;text-align:right">${esc(order.itemName)}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280">Total</td><td style="padding:6px 0;text-align:right;font-weight:bold">${esc(amount)}</td></tr>
      </table>
      <p style="margin:24px 0"><a href="${esc(account)}" style="background:#E8352B;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold;display:inline-block">Track my order</a></p>
      <p style="color:#6b7280;font-size:13px">We'll email you again as soon as it's ready.</p>
    </div>`,
  }).catch((e) => console.error("[mail] order confirmation failed:", e));
}

export async function sendAdminOrderNotice(order, s) {
  if (s.mailAdminOrderOn !== "true" || !s.contactEmail) return;
  const amount = order.usdAmount ? `$${order.usdAmount.toFixed(2)}` : `৳${order.amount.toLocaleString()}`;
  await sendMail({
    to: s.contactEmail,
    subject: `New order #${order.number} · ${amount}`,
    text: `New order #${order.number}\n${order.itemName}\n${amount}\nFrom: ${order.name} <${order.email}>`,
    html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#1c1c28">
      <h2 style="margin:0 0 12px">New order #${order.number}</h2>
      <p>${esc(order.itemName)} — <b>${esc(amount)}</b></p>
      <p style="color:#6b7280;font-size:13px">From ${esc(order.name)} (${esc(order.email)})</p>
    </div>`,
  }).catch((e) => console.error("[mail] admin order notice failed:", e));
}
