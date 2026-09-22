import { prisma } from "./db";

// Once a visitor identifies themselves (places an order, sends a lead, claims an offer), label every
// page view already recorded for their browser with who they are - so the admin analytics page shows
// "this anonymous session turned out to be <name>", not just an IP address.
export async function identifyVisitor(sessionId, { name, email, phone }) {
  if (!sessionId) return;
  try {
    await prisma.visit.updateMany({ where: { sessionId: String(sessionId).slice(0, 60) }, data: { name, email, phone } });
  } catch {}
}
