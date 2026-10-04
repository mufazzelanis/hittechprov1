import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { guard } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

// Badges on the admin sidebar: work that is waiting for someone.
export async function GET() {
  { const g = await guard(); if (g.res) return g.res; }
  const [orders, leads, payouts] = await Promise.all([
    prisma.order.count({ where: { status: "PENDING" } }).catch(() => 0),
    prisma.lead.count({ where: { handled: false } }).catch(() => 0),
    prisma.payout.count({ where: { status: "PENDING" } }).catch(() => 0),
  ]);
  return NextResponse.json({ "/admin/orders": orders, "/admin/leads": leads, "/admin/payouts": payouts });
}
