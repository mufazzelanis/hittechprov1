import { sendMail } from "./mailer";
import { siteUrl } from "./seo";
import { emailLayout, emailButton, emailSummary, esc, MIST } from "./emailTemplate";

// The three "optional" automatic emails (Admin -> Settings -> Email -> Automatic emails). Password
// reset/recovery, the Payoneer pay link and delivery notices live next to the code that triggers them
// (lib/passwordReset.js, the order paylink/deliver API routes) since the customer explicitly asked for
// those - they are never optional and have no on/off switch.

export async function sendWelcomeEmail(user, s) {
  if (s.mailWelcomeOn === "false") return;
  const account = `${siteUrl(s)}/account`;
  const body = `
    <h1 style="margin:0 0 14px;font-size:21px;font-weight:800;">Welcome to ${esc(s.siteName)} 👋</h1>
    <p style="margin:0 0 4px;">Hi ${esc(user.name)},</p>
    <p style="margin:10px 0 0;color:${MIST};">Your account is ready. Sign in any time to track orders, re-download your purchases and manage your account.</p>
    ${emailButton("Go to my account", account)}
    <p style="margin:18px 0 0;font-size:13px;color:${MIST};">Need help? Just reply to our support email and we'll take care of it.</p>`;
  await sendMail({
    to: user.email,
    subject: `Welcome to ${s.siteName}`,
    text: `Hi ${user.name},\n\nYour ${s.siteName} account is ready. Sign in any time to track orders and manage your account:\n${account}\n\n— ${s.siteName}`,
    html: emailLayout({ s, eyebrow: "Account created", preheader: `Your ${s.siteName} account is ready.`, bodyHtml: body }),
  }).catch((e) => console.error("[mail] welcome email failed:", e));
}

export async function sendOrderConfirmation(order, s) {
  if (s.mailOrderConfirmOn === "false") return;
  const account = `${siteUrl(s)}/account`;
  const amount = order.usdAmount ? `$${order.usdAmount.toFixed(2)}` : `৳${order.amount.toLocaleString()}`;
  const body = `
    <h1 style="margin:0 0 14px;font-size:21px;font-weight:800;">Thanks for your order!</h1>
    <p style="margin:0 0 4px;">Hi ${esc(order.name)},</p>
    <p style="margin:10px 0 0;color:${MIST};">We've received your order. Here's a quick summary:</p>
    ${emailSummary([
      ["Order", `#${order.number}`],
      [order.itemName.includes(",") ? "Items" : "Item", order.itemName],
      ["Total", amount],
    ])}
    ${emailButton("Track my order", account)}
    <p style="margin:18px 0 0;font-size:13px;color:${MIST};">We'll email you again as soon as it's ready.</p>`;
  await sendMail({
    to: order.email,
    subject: `Order confirmed — #${order.number} — ${s.siteName}`,
    text: `Hi ${order.name},\n\nThanks for your order! We've received Order #${order.number} (${order.itemName}) for ${amount}.\n\nTrack it any time in your Client Area:\n${account}\n\n— ${s.siteName}`,
    html: emailLayout({ s, eyebrow: "Order received", preheader: `Order #${order.number} · ${amount}`, bodyHtml: body }),
  }).catch((e) => console.error("[mail] order confirmation failed:", e));
}

export async function sendAdminOrderNotice(order, s) {
  if (s.mailAdminOrderOn !== "true" || !s.contactEmail) return;
  const amount = order.usdAmount ? `$${order.usdAmount.toFixed(2)}` : `৳${order.amount.toLocaleString()}`;
  const body = `
    <h1 style="margin:0 0 14px;font-size:21px;font-weight:800;">New order #${order.number}</h1>
    ${emailSummary([
      ["Item", order.itemName],
      ["Amount", amount],
      ["From", `${order.name} (${order.email})`],
    ])}`;
  await sendMail({
    to: s.contactEmail,
    subject: `New order #${order.number} · ${amount}`,
    text: `New order #${order.number}\n${order.itemName}\n${amount}\nFrom: ${order.name} <${order.email}>`,
    html: emailLayout({ s, eyebrow: "Admin notice", preheader: `New order #${order.number} · ${amount}`, bodyHtml: body }),
  }).catch((e) => console.error("[mail] admin order notice failed:", e));
}
