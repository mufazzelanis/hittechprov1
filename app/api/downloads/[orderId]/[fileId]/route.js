import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, getUserId } from "@/lib/auth";
import { fileResponse } from "@/lib/privateFiles";
import { findOrderFile, isPaid } from "@/lib/purchases";
import { limited } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

// A paid file, streamed only to the signed-in buyer of a paid order (or an admin checking it).
export async function GET(req, { params }) {
  const tooMany = limited(req, "download", 60, 600);
  if (tooMany) return tooMany;

  const admin = getSession();
  const uid = getUserId();
  if (!admin && !uid) return NextResponse.json({ error: "Please sign in to download your files." }, { status: 401 });

  const order = await prisma.order.findUnique({ where: { id: String(params.orderId) } });
  let allowed = !!admin;
  if (!allowed && order) {
    const user = await prisma.user.findUnique({ where: { id: uid }, select: { id: true, email: true } });
    allowed = !!user && (order.userId === user.id || order.email === user.email) && isPaid(order);
  }
  // Same answer for "no such order" and "not yours", so order ids can't be probed.
  if (!order || !allowed) return NextResponse.json({ error: "This download isn't available on your account." }, { status: 404 });

  const ref = await findOrderFile(order, String(params.fileId));
  const res = ref ? await fileResponse(ref) : null;
  return res || NextResponse.json({ error: "File not found. Please contact support." }, { status: 404 });
}
