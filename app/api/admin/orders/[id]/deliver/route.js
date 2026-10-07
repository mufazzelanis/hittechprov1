export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/apiHelpers";
import { sendMail } from "@/lib/mailer";
import { logOrderEvent } from "@/lib/orderEvents";
import { getSettings } from "@/lib/settings";
import { guard } from "@/lib/adminAuth";
import { emailLayout, esc, MIST } from "@/lib/emailTemplate";

const deny = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });
const nl2br = (s) => esc(s).replace(/\n/g, "<br>");

// Emails the customer the access/credentials the admin types in, and (optionally) marks the order
// DELIVERED in the same step. This is the one place an order's actual delivery gets sent - everywhere
// else (status dropdown, bulk edit) only changes the record, never contacts the customer.
export async function POST(req, { params }) {
  const { admin: session, res: denied } = await guard("orders.manage");
  if (denied) return denied;
  if (!session) return deny();

  const { message, markDelivered } = await req.json().catch(() => ({}));
  const clean = String(message || "").trim();
  if (!clean) return NextResponse.json({ error: "Write the delivery details first." }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const s = await getSettings();
  const body = `
    <h1 style="margin:0 0 14px;font-size:21px;font-weight:800;">Your order is ready 🎉</h1>
    <p style="margin:0 0 4px;">Hi ${nl2br(order.name)},</p>
    <p style="margin:10px 0 0;white-space:pre-wrap;">${nl2br(clean)}</p>
    <p style="color:${MIST};font-size:13px;margin-top:22px;">Order #${order.number} · ${esc(order.itemName)}</p>`;
  await sendMail({
    to: order.email,
    subject: `Your ${order.itemName} is ready — Order #${order.number}`,
    text: `Hi ${order.name},\n\n${clean}\n\n— ${s.siteName}`,
    html: emailLayout({ s, eyebrow: "Order delivered", preheader: `Order #${order.number} is ready.`, bodyHtml: body }),
  });
  await prisma.order.update({ where: { id: params.id }, data: { deliveryNote: clean.slice(0, 5000) } });
  await logOrderEvent(params.id, "delivery", `Delivery email sent to ${order.email}: ${clean.slice(0, 300)}`, session.name);

  if (markDelivered && order.status !== "DELIVERED") {
    await prisma.order.update({ where: { id: params.id }, data: { status: "DELIVERED" } });
    await logOrderEvent(params.id, "status", `Status changed from ${order.status} to DELIVERED`, session.name);
  }

  return NextResponse.json({ ok: true });
}
