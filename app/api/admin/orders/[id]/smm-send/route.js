export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/apiHelpers";
import { smmAddOrder } from "@/lib/smmiu";
import { logOrderEvent } from "@/lib/orderEvents";
import { guard } from "@/lib/adminAuth";

const deny = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

// Places the real order with SMMIU - a deliberate, admin-triggered action (never automatic on checkout,
// since payment here is verified manually, same as every other order type on the site). Refuses to send
// twice: once providerOrderId is set, this order is done as far as this route is concerned.
export async function POST(req, { params }) {
  const { admin: session, res: denied } = await guard("orders.manage");
  if (denied) return denied;
  if (!session) return deny();

  const smmOrder = await prisma.smmOrder.findUnique({ where: { orderId: params.id }, include: { service: true, order: true } });
  if (!smmOrder) return NextResponse.json({ error: "This order has no SMM service attached." }, { status: 404 });
  if (smmOrder.providerOrderId) return NextResponse.json({ error: "Already sent to the provider." }, { status: 409 });

  let res;
  try {
    res = await smmAddOrder({ service: smmOrder.service.providerServiceId, link: smmOrder.link, quantity: smmOrder.quantity });
  } catch (e) {
    await logOrderEvent(params.id, "note", `SMMIU order failed: ${e.message}`, session.name);
    return NextResponse.json({ error: e.message || "SMMIU rejected the order" }, { status: 502 });
  }
  if (!res?.order) return NextResponse.json({ error: "Unexpected response from SMMIU" }, { status: 502 });

  await prisma.smmOrder.update({ where: { orderId: params.id }, data: { providerOrderId: res.order, providerStatus: "Pending", lastSyncedAt: new Date() } });
  await logOrderEvent(params.id, "note", `Sent to SMMIU - provider order #${res.order} (${smmOrder.service.name}, qty ${smmOrder.quantity})`, session.name);

  return NextResponse.json({ ok: true, providerOrderId: res.order });
}
