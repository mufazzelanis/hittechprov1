export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/apiHelpers";
import { sendMail } from "@/lib/mailer";
import { logOrderEvent } from "@/lib/orderEvents";
import { getSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/seo";
import { guard } from "@/lib/adminAuth";

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

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
    const r = await sendMail({
      to: order.email,
      subject: `Pay ${amount} for Order #${order.number} — ${s.siteName}`,
      text: `Hi ${order.name},\n\nThanks for your order (#${order.number}: ${order.itemName}).\n\nPay ${amount} securely with Payoneer (card, bank transfer or Payoneer balance):\n${parsed.href}\n\nAs soon as your payment is confirmed your order unlocks in your Client Area: ${account}\n\n— ${s.siteName}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1c1c28">
        <h2 style="margin:0 0 12px">Complete your payment</h2>
        <p>Hi ${esc(order.name)},</p>
        <p>Thanks for your order <b>#${order.number}</b> — ${esc(order.itemName)}.</p>
        <p style="margin:24px 0"><a href="${esc(parsed.href)}" style="background:#E8352B;color:#fff;text-decoration:none;padding:13px 22px;border-radius:10px;font-weight:bold;display:inline-block">Pay ${esc(amount)} with Payoneer</a></p>
        <p style="color:#555;font-size:14px">You can pay by card, bank transfer or your Payoneer balance. As soon as your payment is confirmed, your order unlocks in your <a href="${esc(account)}">Client Area</a>.</p>
      </div>`,
    }).catch(() => ({ sent: false }));
    emailed = !!r.sent;
  }
  await logOrderEvent(order.id, "delivery", `Payoneer payment link saved${notify ? (emailed ? ` and emailed to ${order.email}` : " (email not sent - SMTP not configured)") : ""}: ${parsed.href}`, session.name);
  return NextResponse.json({ ok: true, payLink: parsed.href, emailed });
}
