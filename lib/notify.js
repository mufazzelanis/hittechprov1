import { EventEmitter } from "node:events";
import { prisma } from "./db";

// One shared bus per server process. Kept on globalThis so a dev-mode hot-reload doesn't orphan
// the old emitter (same trick as lib/db.js does for the Prisma client).
const g = globalThis;
export const notifyBus = g.__htpNotifyBus || new EventEmitter();
if (!g.__htpNotifyBus) {
  notifyBus.setMaxListeners(50); // a handful of admin tabs open at once is normal, not a leak
  g.__htpNotifyBus = notifyBus;
}

// Call this from any customer-facing route the moment something admin-worthy happens (a new order,
// a submitted form, a claim, a payout request). It writes the row so the bell shows it after a reload,
// and emits it on the bus so every open admin panel gets it immediately over SSE (see the stream route).
// Never let a notification failure break the customer's actual request — always wrapped by the caller.
export async function pushNotification({ type, title, body, href }) {
  const row = await prisma.notification.create({
    data: { type, title: String(title).slice(0, 200), body: body ? String(body).slice(0, 500) : null, href: href || null },
  });
  notifyBus.emit("new", row);
  return row;
}
