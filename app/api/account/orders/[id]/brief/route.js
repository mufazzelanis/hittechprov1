export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { limited } from "@/lib/rateLimit";
import { orderLines, isPaid } from "@/lib/purchases";
import { logOrderEvent } from "@/lib/orderEvents";
import { pushNotification } from "@/lib/notify";

// The buyer's requirements for a service order. Allowed once the order is paid and until it's delivered.
export async function POST(req, { params }) {
  const tooMany = limited(req, "brief", 20, 3600);
  if (tooMany) return tooMany;
  const uid = getUserId();
  const user = uid ? await prisma.user.findUnique({ where: { id: uid }, select: { id: true, email: true, name: true } }) : null;
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const order = await prisma.order.findUnique({ where: { id: String(params.id) } });
  if (!order || (order.userId !== user.id && order.email !== user.email)) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (!orderLines(order).some((l) => l.type === "service")) return NextResponse.json({ error: "This order has no service to brief." }, { status: 400 });
  if (!isPaid(order)) return NextResponse.json({ error: "You can send your brief once your payment is confirmed." }, { status: 409 });
  if (["COMPLETED", "DELIVERED"].includes(order.status)) return NextResponse.json({ error: "This order is already delivered. Message us if you need changes." }, { status: 409 });

  const b = await req.json().catch(() => ({}));
  const answers = (Array.isArray(b.answers) ? b.answers : []).slice(0, 20)
    .map((a) => ({ q: String(a?.q || "").trim().slice(0, 200), a: String(a?.a || "").trim().slice(0, 2000) }))
    .filter((a) => a.a);
  const extra = String(b.extra || "").trim().slice(0, 4000);
  if (!answers.length && !extra) return NextResponse.json({ error: "Please answer at least one question." }, { status: 400 });

  const brief = [...answers.map((a) => (a.q ? `${a.q}\n→ ${a.a}` : a.a)), extra && `Anything else:\n→ ${extra}`].filter(Boolean).join("\n\n");
  const first = !order.brief;
  await prisma.order.update({ where: { id: order.id }, data: { brief } });
  await logOrderEvent(order.id, "note", first ? "Buyer sent their brief" : "Buyer updated their brief", user.name);
  pushNotification({ type: "order", title: `Brief received · Order #${order.number}`, body: `${order.name} · ${order.itemName}`, href: `/admin/orders?q=${order.number}` }).catch(() => {});
  return NextResponse.json({ ok: true, brief });
}
