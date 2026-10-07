export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/apiHelpers";
import { sendMail } from "@/lib/mailer";
import { logOrderEvent } from "@/lib/orderEvents";
import { getSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/seo";
import { guard } from "@/lib/adminAuth";
import { emailLayout, emailButton, esc, MIST } from "@/lib/emailTemplate";

// Saves the Payoneer payment-request link on an order and emails it to the buyer. The buyer also sees
// it as a "Pay" button in their Client Area until the order is marked paid.
export async function POST(req, { params }) {
  const { admin: session, res: denied } = await guard("orders.manage");
  if (denied) return denied;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { url, notify = true } = await req.json().catch(() => ({}));
  const link = String(url || "").trim();
  let parsed = null;
  try { parsed = new URL(link); } catch {}
  if (!parsed || parsed.protocol !== "https:") return NextResponse.json({ error: "Paste the full payment link, starting with https://" }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  await prisma.order.update({ where: { id: order.id }, data: { payLink: parsed.href } });

  let emailed = false;
  if (notify) {
    const s = await getSettings();
    const amount = order.usdAmount ? `$${order.usdAmount.toFixed(2)}` : `৳${order.amount.toLocaleString()}`;
    const account = `${siteUrl(s)}/account`;
    const body = `
      <h1 style="margin:0 0 14px;font-size:21px;font-weight:800;">Complete your payment</h1>
      <p style="margin:0 0 4px;">Hi ${esc(order.name)},</p>
      <p style="margin:10px 0 0;color:${MIST};">Thanks for your order <b style="color:${"#1c1c28"}">#${order.number}</b> — ${esc(order.itemName)}.</p>
      ${emailButton(`Pay ${amount} with Payoneer`, parsed.href)}
      <p style="color:${MIST};font-size:13px;">You can pay by card, bank transfer or your Payoneer balance. As soon as your payment is confirmed, your order unlocks in your <a href="${esc(account)}" style="color:${MIST};font-weight:700;">Client Area</a>.</p>`;
    const r = await sendMail({
      to: order.email,
      subject: `Pay ${amount} for Order #${order.number} — ${s.siteName}`,
      text: `Hi ${order.name},\n\nThanks for your order (#${order.number}: ${order.itemName}).\n\nPay ${amount} securely with Payoneer (card, bank transfer or Payoneer balance):\n${parsed.href}\n\nAs soon as your payment is confirmed your order unlocks in your Client Area: ${account}\n\n— ${s.siteName}`,
      html: emailLayout({ s, eyebrow: "Payment request", preheader: `Pay ${amount} to complete Order #${order.number}.`, bodyHtml: body }),
    }).catch(() => ({ sent: false }));
    emailed = !!r.sent;
  }
  await logOrderEvent(order.id, "delivery", `Payoneer payment link saved${notify ? (emailed ? ` and emailed to ${order.email}` : " (email not sent - SMTP not configured)") : ""}: ${parsed.href}`, session.name);
  return NextResponse.json({ ok: true, payLink: parsed.href, emailed });
}
