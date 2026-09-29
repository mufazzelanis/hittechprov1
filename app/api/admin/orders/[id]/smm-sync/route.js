export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/apiHelpers";
import { smmOrderStatus } from "@/lib/smmiu";
import { logOrderEvent } from "@/lib/orderEvents";
import { capiOnPaid } from "@/lib/fb";

const deny = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

// SMMIU's own progress wording -> this site's shared Order status. Only ever moves the order forward
// (PAID -> IN_PROGRESS -> COMPLETED), and only from a state that's still "in flight" - an order an admin
// already moved to REFUNDED/CANCELLED/DELIVERED is left alone, never silently overwritten by a sync.
const PROGRESS_MAP = { "In progress": "IN_PROGRESS", Processing: "IN_PROGRESS", Completed: "COMPLETED" };
const ADVANCEABLE_FROM = new Set(["PAID", "IN_PROGRESS"]);

// Pulls the current progress (status/remains/start count) from SMMIU for an order already sent there.
export async function POST(req, { params }) {
  const session = requireAdmin();
  if (!session) return deny();

  const smmOrder = await prisma.smmOrder.findUnique({ where: { orderId: params.id }, include: { order: true } });
  if (!smmOrder) return NextResponse.json({ error: "This order has no SMM service attached." }, { status: 404 });
  if (!smmOrder.providerOrderId) return NextResponse.json({ error: "Not sent to the provider yet." }, { status: 409 });

  let res;
  try {
    res = await smmOrderStatus(smmOrder.providerOrderId);
  } catch (e) {
    return NextResponse.json({ error: e.message || "Could not reach SMMIU" }, { status: 502 });
  }

  const updated = await prisma.smmOrder.update({
    where: { orderId: params.id },
    data: {
      providerStatus: res.status || smmOrder.providerStatus,
      startCount: res.start_count != null ? parseInt(res.start_count, 10) : smmOrder.startCount,
      remains: res.remains != null ? parseInt(res.remains, 10) : smmOrder.remains,
      charge: res.charge != null ? parseFloat(res.charge) : smmOrder.charge,
      lastSyncedAt: new Date(),
    },
  });

  const nextStatus = PROGRESS_MAP[res.status];
  const currentOrderStatus = smmOrder.order.status;
  let orderStatus = currentOrderStatus;
  if (nextStatus && nextStatus !== currentOrderStatus && ADVANCEABLE_FROM.has(currentOrderStatus)) {
    const row = await prisma.order.update({ where: { id: params.id }, data: { status: nextStatus } });
    await logOrderEvent(params.id, "status", `Status changed from ${currentOrderStatus} to ${nextStatus} (auto, from SMMIU progress)`, session.name);
    capiOnPaid(row).catch(() => {});
    orderStatus = nextStatus;
  }

  return NextResponse.json({ ok: true, smmOrder: updated, orderStatus });
}
