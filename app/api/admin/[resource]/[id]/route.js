import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, getResource, buildData, missingRequired } from "@/lib/apiHelpers";
import { capiOnPaid } from "@/lib/fb";
import { setSoon, infoKey } from "@/lib/limits";
import { logOrderEvent } from "@/lib/orderEvents";
import { getSettings } from "@/lib/settings";
import { submitUrl } from "@/lib/indexnow";

import { guard, audit } from "@/lib/adminAuth";
import { resourcePerm } from "@/lib/resources";

export const dynamic = "force-dynamic";

const deny = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function PUT(req, { params }) {
  const { admin: session, res: denied } = await guard(resourcePerm(params.resource, "manage"));
  if (denied) return denied;
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
    // A price/visibility/description change is exactly the kind of update worth telling search engines
    // about right away, rather than waiting for their next scheduled crawl.
    if (res.model === "tool" && row.active && (data.price !== undefined || data.active !== undefined || data.name !== undefined || data.description !== undefined)) {
      getSettings().then((s) => submitUrl(s, `/tool/${row.slug}`)).catch(() => {});
    }
    const changed = Object.keys(data).filter((k) => k !== "status" || prevStatus !== data.status);
    audit(session, `${params.resource}.update`, { target: row.name || row.title || row.question || (row.number ? "#" + row.number : params.id), detail: prevStatus && prevStatus !== data.status ? `status ${prevStatus} → ${data.status}` : changed.length ? `changed: ${changed.join(", ")}` : null, req });
    return NextResponse.json({ row });
  } catch {
    return NextResponse.json({ error: "Could not update" }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  const { admin, res: denied } = await guard(resourcePerm(params.resource, "manage"));
  if (denied) return denied;
  const res = getResource(params.resource);
  if (!res) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  if (res.model === "order") return NextResponse.json({ error: "Orders cannot be deleted. Set the status to Cancelled or Refunded instead." }, { status: 405 });
  try {
    const gone = await prisma[res.model].delete({ where: { id: params.id } });
    audit(admin, `${params.resource}.delete`, { target: gone.name || gone.title || gone.question || params.id, req: _req });
    if (["tool", "bundle", "packPlan"].includes(res.model)) await prisma.setting.deleteMany({ where: { key: infoKey(params.id) } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not delete" }, { status: 500 });
  }
}
