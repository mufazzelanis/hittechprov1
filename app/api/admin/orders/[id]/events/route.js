export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/apiHelpers";
import { logOrderEvent } from "@/lib/orderEvents";

const deny = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

// The order's timeline: auto-logged status changes plus admin notes and delivery-email records.
export async function GET(_req, { params }) {
  if (!requireAdmin()) return deny();
  const rows = await prisma.orderEvent.findMany({ where: { orderId: params.id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ rows });
}

export async function POST(req, { params }) {
  const session = requireAdmin();
  if (!session) return deny();
  const { message } = await req.json().catch(() => ({}));
  const clean = String(message || "").trim();
  if (!clean) return NextResponse.json({ error: "Write a note first." }, { status: 400 });
  const order = await prisma.order.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  await logOrderEvent(params.id, "note", clean, session.name);
  return NextResponse.json({ ok: true });
}
