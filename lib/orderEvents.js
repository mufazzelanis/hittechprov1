import { prisma } from "./db";

// One shared writer for the order timeline, so every entry (auto-logged status changes, admin notes,
// "delivery details sent" records) looks the same and lands in the same place.
export async function logOrderEvent(orderId, type, message, byName = null) {
  try {
    await prisma.orderEvent.create({ data: { orderId, type, message: String(message).slice(0, 2000), byName } });
  } catch (e) {
    console.error("[orderEvents] failed to log", type, "for", orderId, e);
  }
}
