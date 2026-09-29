import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { limited } from "@/lib/rateLimit";
import { checkTxn, methodKind } from "@/lib/txn";

export const dynamic = "force-dynamic";

// Live check for the checkout form: is the Transaction ID well-formed and not already on an order?
export async function POST(req) {
  const tooMany = limited(req, "check-txn", 40, 600);
  if (tooMany) return tooMany;
  const b = await req.json().catch(() => ({}));
  const r = checkTxn(methodKind(b.method), String(b.txnId ?? "").slice(0, 400));
  if (r.status === "empty" || r.status === "error") return NextResponse.json({ value: r.value, used: false });
  const used = !!(await prisma.order.findFirst({ where: { txnId: r.value, status: { not: "CANCELLED" } }, select: { id: true } }));
  return NextResponse.json({ value: r.value, used });
}
