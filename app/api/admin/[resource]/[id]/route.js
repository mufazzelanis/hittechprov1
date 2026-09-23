import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, getResource, buildData, missingRequired } from "@/lib/apiHelpers";
import { capiOnPaid } from "@/lib/fb";
import { setSoon, infoKey } from "@/lib/limits";
import { logOrderEvent } from "@/lib/orderEvents";

export const dynamic = "force-dynamic";

const deny = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function PUT(req, { params }) {
  const session = requireAdmin();
  if (!session) return deny();
  const res = getResource(params.resource);
  if (!res) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const data = buildData(res, body, { partial: true });
  const miss = missingRequired(res, data, { partial: true });
  if (miss) return NextResponse.json({ error: `${miss} is required` }, { status: 400 });

  // Every status change is logged here (not just from the order detail drawer), so the table's own
  // inline status dropdown produces the same audit trail entry.
  const prevStatus = res.model === "order" && data.status ? (await prisma.order.findUnique({ where: { id: params.id }, select: { status: true } }))?.status : null;

  try {
    const row = Object.keys(data).length ? await prisma[res.model].update({ where: { id: params.id }, data }) : await prisma[res.model].findUnique({ where: { id: params.id } });
    if ("soon" in body && res.fields.some((f) => f.type === "soon")) await setSoon(params.id, body.soon === true || body.soon === "true");
    if (res.model === "order" && data.status) {
      capiOnPaid(row);
      if (prevStatus && prevStatus !== data.status) logOrderEvent(params.id, "status", `Status changed from ${prevStatus} to ${data.status}`, session.name).catch(() => {});
    }
    return NextResponse.json({ row });
  } catch {
    return NextResponse.json({ error: "Could not update" }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  if (!requireAdmin()) return deny();
  const res = getResource(params.resource);
  if (!res) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  if (res.model === "order") return NextResponse.json({ error: "Orders cannot be deleted. Set the status to Cancelled or Refunded instead." }, { status: 405 });
  try {
    await prisma[res.model].delete({ where: { id: params.id } });
    if (["tool", "bundle", "packPlan"].includes(res.model)) await prisma.setting.deleteMany({ where: { key: infoKey(params.id) } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not delete" }, { status: 500 });
  }
}
