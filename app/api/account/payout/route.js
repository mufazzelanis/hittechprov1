export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { affiliateStats } from "@/lib/affiliate";
import { pushNotification } from "@/lib/notify";

export async function POST(req) {
  const id = getUserId();
  const user = id ? await prisma.user.findUnique({ where: { id } }) : null;
  if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const amount = parseInt(b.amount, 10);
  const method = String(b.method || "").slice(0, 40);
  const account = String(b.account || "").trim().slice(0, 120);
  const s = await getSettings();
  if (s.affiliateOn !== "true") return NextResponse.json({ error: "The affiliate program is not active right now." }, { status: 403 });
  const min = parseInt(s.affMinPayout, 10) || 0;
  const { balance } = await affiliateStats(user);

  if (!method || !account) return NextResponse.json({ error: "Choose a method and enter your account number." }, { status: 400 });
  if (!(amount > 0) || amount < min) return NextResponse.json({ error: `Minimum payout is ৳${min}.` }, { status: 400 });
  if (amount > balance) return NextResponse.json({ error: `You can withdraw up to ৳${balance}.` }, { status: 400 });

  await prisma.payout.create({ data: { userId: user.id, userName: user.name, userEmail: user.email, amount, method, account } });
  pushNotification({ type: "payout", title: `Payout requested: ৳${amount.toLocaleString()}`, body: `${user.name} · ${method} · ${account}`, href: `/admin/payouts` }).catch(() => {});
  return NextResponse.json({ ok: true });
}
