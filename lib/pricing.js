import { prisma } from "./db";
import { getToolInfo } from "./limits";

// Prices are ALWAYS read from the database, never trusted from the browser.
// wanted: [{type: "tool" | "bundle" | "plan", id}]
export async function priceItems(wanted) {
  const list = Array.isArray(wanted) ? wanted.slice(0, 20) : [];
  const models = { tool: prisma.tool, bundle: prisma.bundle, plan: prisma.packPlan };
  const info = await getToolInfo();
  const seen = new Set();
  const lines = [];
  for (const w of list) {
    const key = String(w?.type) + ":" + String(w?.id);
    if (seen.has(key)) continue;
    seen.add(key);
    const model = Object.hasOwn(models, w?.type) ? models[w.type] : null;
    const row = model ? await model.findFirst({ where: { id: String(w.id), active: true } }) : null;
    if (!row) return { error: "One of the items is no longer available.", status: 404 };
    if (info[row.id]?.soon) return { error: `"${row.name}" is coming soon and cannot be ordered yet. Please remove it from your basket.`, status: 409 };
    lines.push({ type: w.type, name: row.name, price: row.price });
  }
  if (!lines.length) return { error: "Your basket is empty.", status: 400 };
  return { lines, subtotal: lines.reduce((n, l) => n + l.price, 0) };
}
