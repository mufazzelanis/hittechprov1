import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, getResource, buildData } from "@/lib/apiHelpers";
import { capiOnPaid } from "@/lib/fb";
import { setSoon, infoKey } from "@/lib/limits";

export const dynamic = "force-dynamic";

const deny = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });
// Only these kinds of fields can be changed for many rows at once (never names, slugs or free text).
const BULK_TYPES = ["bool", "select", "status", "category", "icon"];

// POST { action: "delete" | "update", ids: [...], data: { field: value, ..., soon?, priceMode?, priceValue? } }
export async function POST(req, { params }) {
  if (!requireAdmin()) return deny();
  const res = getResource(params.resource);
  if (!res) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const ids = [...new Set((Array.isArray(body.ids) ? body.ids : []).map(String))].slice(0, 500);
  if (!ids.length) return NextResponse.json({ error: "Nothing selected" }, { status: 400 });
  const model = prisma[res.model];
  const hasSoon = res.fields.some((f) => f.type === "soon");
  const products = ["tool", "bundle", "packPlan"].includes(res.model);

  if (body.action === "delete") {
    if (res.model === "order") return NextResponse.json({ error: "Orders cannot be deleted. Set the status to Cancelled or Refunded instead." }, { status: 405 });
    let affected = 0, failed = 0;
    try {
      affected = (await model.deleteMany({ where: { id: { in: ids } } })).count;
    } catch {
      // a row can be blocked by a related record (e.g. a category that still has tools): delete one by one
      for (const id of ids) {
        try { await model.delete({ where: { id } }); affected++; } catch { failed++; }
      }
    }
    if (products) await prisma.setting.deleteMany({ where: { key: { in: ids.map(infoKey) } } });
    return NextResponse.json({ ok: true, affected, failed });
  }

  if (body.action === "update") {
    const d = body.data && typeof body.data === "object" ? body.data : {};
    const allowed = { ...res, fields: res.fields.filter((f) => BULK_TYPES.includes(f.type)) };
    const data = buildData(allowed, d, { partial: true });
    let affected = 0;

    if (Object.keys(data).length) affected = (await model.updateMany({ where: { id: { in: ids } }, data })).count;

    if (hasSoon && "soon" in d) {
      const on = d.soon === true || d.soon === "true";
      for (const id of ids) await setSoon(id, on);
      affected = Math.max(affected, ids.length);
    }

    if (products && ["set", "pct"].includes(d.priceMode) && Number.isFinite(Number(d.priceValue))) {
      const v = Number(d.priceValue);
      const rows = await model.findMany({ where: { id: { in: ids } }, select: { id: true, price: true } });
      for (const r of rows) {
        const price = d.priceMode === "set" ? Math.round(v) : Math.round(r.price * (1 + v / 100));
        await model.update({ where: { id: r.id }, data: { price: Math.max(0, price) } });
      }
      affected = Math.max(affected, rows.length);
    }

    if (res.model === "order" && data.status) {
      const rows = await model.findMany({ where: { id: { in: ids } } });
      for (const r of rows) capiOnPaid(r);
    }
    return NextResponse.json({ ok: true, affected, failed: 0 });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
