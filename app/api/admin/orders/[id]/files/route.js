export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/apiHelpers";
import { saveUpload } from "@/lib/privateFiles";
import { parseFiles } from "@/lib/catalog";
import { logOrderEvent } from "@/lib/orderEvents";
import { guard } from "@/lib/adminAuth";

const deny = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

// Delivery files for one order (finished designs, landing page files...). The buyer downloads them from
// their Client Area once the order is paid.
export async function POST(req, { params }) {
  const { admin: session, res: denied } = await guard("orders.manage");
  if (denied) return denied;
  if (!session) return deny();
  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  const form = await req.formData().catch(() => null);
  let file;
  try { file = await saveUpload(form?.get("file")); } catch (e) { return NextResponse.json({ error: e.message }, { status: 400 }); }
  const files = [...parseFiles(order.deliveryFiles), file];
  await prisma.order.update({ where: { id: order.id }, data: { deliveryFiles: files } });
  await logOrderEvent(order.id, "delivery", `Delivery file added: ${file.name}`, session.name);
  return NextResponse.json({ files });
}

export async function DELETE(req, { params }) {
  const { admin: session, res: denied } = await guard("orders.manage");
  if (denied) return denied;
  if (!session) return deny();
  const fileId = new URL(req.url).searchParams.get("fileId");
  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  const cur = parseFiles(order.deliveryFiles);
  const gone = cur.find((f) => f.id === fileId);
  const files = cur.filter((f) => f.id !== fileId);
  await prisma.order.update({ where: { id: order.id }, data: { deliveryFiles: files } });
  if (gone) await logOrderEvent(order.id, "delivery", `Delivery file removed: ${gone.name}`, session.name);
  return NextResponse.json({ files });
}
