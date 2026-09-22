import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, getResource, buildData, missingRequired } from "@/lib/apiHelpers";
import { capiOnPaid } from "@/lib/fb";
import { setSoon, infoKey } from "@/lib/limits";

export const dynamic = "force-dynamic";

const deny = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function PUT(req, { params }) {
  if (!requireAdmin()) return deny();
  const res = getResource(params.resource);
  if (!res) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const data = buildData(res, body, { partial: true });
  const miss = missingRequired(res, data, { partial: true });
  if (miss) return NextResponse.json({ error: `${miss} is required` }, { status: 400 });

  try {
    const row = Object.keys(data).length ? await prisma[res.model].update({ where: { id: params.id }, data }) : await prisma[res.model].findUnique({ where: { id: params.id } });
    if ("soon" in body && res.fields.some((f) => f.type === "soon")) await setSoon(params.id, body.soon === true || body.soon === "true");
    if (res.model === "order" && data.status) capiOnPaid(row);
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
