import { prisma } from "./db";
import { getToolInfo } from "./limits";

const LINK_RE = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

// Prices are ALWAYS read from the database, never trusted from the browser.
// wanted: [{type: "tool" | "bundle" | "plan", id} | {type: "smm", id, serviceId, qty, link}]
export async function priceItems(wanted) {
  const list = Array.isArray(wanted) ? wanted.slice(0, 20) : [];
  const models = { tool: prisma.tool, bundle: prisma.bundle, plan: prisma.packPlan };
  const info = await getToolInfo();
  const seen = new Set();
  const lines = [];
  for (const w of list) {
    // SMM lines aren't a fixed-price catalog row: the same service can appear twice in one basket with
    // a different link/quantity each time, so they're keyed by the cart's own per-line id, not type+serviceId.
    const key = w?.type === "smm" ? "smm:" + String(w?.id) : String(w?.type) + ":" + String(w?.id);
    if (seen.has(key)) continue;
    seen.add(key);

    if (w?.type === "smm") {
      const svc = await prisma.smmService.findFirst({ where: { id: String(w.serviceId), active: true } });
      if (!svc) return { error: "One of the items is no longer available.", status: 404 };
      const qty = parseInt(w.qty, 10);
      const link = String(w.link || "").trim();
      if (!Number.isInteger(qty) || qty < svc.min || qty > svc.max)
        return { error: `Quantity for "${svc.name}" must be between ${svc.min.toLocaleString()} and ${svc.max.toLocaleString()}.`, status: 400 };
      if (!LINK_RE.test(link)) return { error: `Please enter a valid link (starting with http:// or https://) for "${svc.name}".`, status: 400 };
      const price = Math.max(1, Math.ceil((svc.sellRate * qty) / 1000));
      lines.push({ type: "smm", name: `${svc.name} (${qty.toLocaleString()})`, price, smm: { serviceId: svc.id, quantity: qty, link } });
      continue;
    }

    const model = Object.hasOwn(models, w?.type) ? models[w.type] : null;
    const row = model ? await model.findFirst({ where: { id: String(w.id), active: true } }) : null;
    if (!row) return { error: "One of the items is no longer available.", status: 404 };
    if (info[row.id]?.soon) return { error: `"${row.name}" is coming soon and cannot be ordered yet. Please remove it from your basket.`, status: 409 };
    lines.push({ type: w.type, name: row.name, price: row.price });
  }
  if (!lines.length) return { error: "Your basket is empty.", status: 400 };
  return { lines, subtotal: lines.reduce((n, l) => n + l.price, 0) };
}
