import { prisma } from "./db";
import { PAID_STATES, parseFiles, parseJson, lines as splitLines } from "./catalog";

export const orderLines = (order) => {
  const l = parseJson(order?.lines, []);
  return Array.isArray(l) ? l : [];
};

export const isPaid = (order) => PAID_STATES.includes(order?.status);

// Everything an order entitles its buyer to. Product files come from the product as it is now (so
// buyers get updated versions), falling back to the snapshot taken at purchase time if the product was
// changed or deleted. Only call this for an order the caller is allowed to see.
export async function orderEntitlements(order) {
  const ls = orderLines(order);
  const productIds = ls.filter((l) => l.type === "product").map((l) => String(l.id));
  const serviceIds = ls.filter((l) => l.type === "service").map((l) => String(l.id).split("~")[0]);
  const [products, services] = await Promise.all([
    productIds.length ? prisma.product.findMany({ where: { id: { in: productIds } } }) : [],
    serviceIds.length ? prisma.service.findMany({ where: { id: { in: serviceIds } }, select: { id: true, slug: true, questions: true } }) : [],
  ]);
  const byId = Object.fromEntries(products.map((p) => [p.id, p]));
  const svcById = Object.fromEntries(services.map((s) => [s.id, s]));

  return {
    products: ls.filter((l) => l.type === "product").map((l) => {
      const p = byId[l.id];
      const now = p ? parseFiles(p.files) : [];
      return {
        id: l.id,
        name: p?.name || l.name,
        slug: p?.slug || null,
        files: now.length ? now : parseFiles(l.files),
        deliveryText: p?.deliveryText || l.deliveryText || "",
      };
    }),
    services: ls.filter((l) => l.type === "service").map((l) => {
      const sid = String(l.id).split("~")[0];
      return { id: sid, name: l.name, slug: svcById[sid]?.slug || null, questions: splitLines(svcById[sid]?.questions) };
    }),
    delivery: parseFiles(order?.deliveryFiles),
  };
}

// Finds one downloadable file of an order by its id, or null.
export async function findOrderFile(order, fileId) {
  const e = await orderEntitlements(order);
  for (const f of e.delivery) if (f.id === fileId) return f;
  for (const p of e.products) for (const f of p.files) if (f.id === fileId) return f;
  return null;
}
