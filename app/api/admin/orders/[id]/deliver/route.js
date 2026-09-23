export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/apiHelpers";
import { sendMail } from "@/lib/mailer";
import { logOrderEvent } from "@/lib/orderEvents";
import { getSettings } from "@/lib/settings";

const deny = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });
const nl2br = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br>");

// Emails the customer the access/credentials the admin types in, and (optionally) marks the order
// DELIVERED in the same step. This is the one place an order's actual delivery gets sent - everywhere
// else (status dropdown, bulk edit) only changes the record, never contacts the customer.
export async function POST(req, { params }) {
  const session = requireAdmin();
  if (!session) return deny();

  const { message, markDelivered } = await req.json().catch(() => ({}));
  const clean = String(message || "").trim();
  if (!clean) return NextResponse.json({ error: "Write the delivery details first." }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const s = await getSettings();
  await sendMail({
    to: order.email,
    subject: `Your ${order.itemName} is ready — Order #${order.number}`,
    text: `Hi ${order.name},\n\n${clean}\n\n— ${s.siteName}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1c1c28">
      <h2 style="margin:0 0 12px">Your order is ready</h2>
      <p>Hi ${order.name},</p>
      <p style="white-space:pre-wrap">${nl2br(clean)}</p>
      <p style="color:#6b7280;font-size:13px;margin-top:24px">Order #${order.number} · ${order.itemName}</p>
    </div>`,
  });
  await logOrderEvent(params.id, "delivery", `Delivery email sent to ${order.email}: ${clean.slice(0, 300)}`, session.name);

  if (markDelivered && order.status !== "DELIVERED") {
    await prisma.order.update({ where: { id: params.id }, data: { status: "DELIVERED" } });
    await logOrderEvent(params.id, "status", `Status changed from ${order.status} to DELIVERED`, session.name);
  }

  return NextResponse.json({ ok: true });
}
