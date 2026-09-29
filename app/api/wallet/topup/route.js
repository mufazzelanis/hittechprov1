export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { getPaymentOptions } from "@/lib/payments";
import { checkTxn, methodKind } from "@/lib/txn";
import { limited } from "@/lib/rateLimit";
import { pushNotification } from "@/lib/notify";

const fail = (error, status = 400) => NextResponse.json({ error }, { status });

// A wallet topup is verified exactly like an order's payment (same Transaction ID checks, same manual
// admin approval) - the only difference is the money lands in the customer's own balance instead of
// paying for one specific item, so it can be spent across several orders later without re-entering
// payment details each time.
export async function POST(req) {
  const id = getUserId();
  const user = id ? await prisma.user.findUnique({ where: { id } }) : null;
  if (!user) return fail("Please sign in", 401);

  const tooMany = limited(req, "wallet-topup", 10, 3600);
  if (tooMany) return tooMany;

  const b = await req.json().catch(() => ({}));
  const amount = parseInt(b.amount, 10);
  if (!(amount > 0)) return fail("Enter a valid amount.");
  if (amount > 500000) return fail("For amounts this large, please contact support directly.");

  const s = await getSettings({ withSecrets: true });
  const options = getPaymentOptions(s);
  const method = String(b.method || "").trim().slice(0, 60);
  if (options.length && !options.some((o) => o.name === method)) return fail("Please choose a payment method.");

  const tx = checkTxn(methodKind(method), String(b.txnId || "").slice(0, 400));
  if (tx.status === "empty") return fail("Please enter the payment Transaction ID.");
  if (tx.status === "error") return fail(tx.messages.find((m) => m.type === "error")?.text || "Please enter a valid Transaction ID.");
  const txnId = tx.value.slice(0, 80);

  const [dupOrder, dupTopup] = await Promise.all([
    prisma.order.findFirst({ where: { txnId, status: { not: "CANCELLED" } } }),
    prisma.walletTopup.findFirst({ where: { txnId, status: { not: "REJECTED" } } }),
  ]);
  if (dupOrder || dupTopup) return fail("This Transaction ID has already been used.", 409);

  const topup = await prisma.walletTopup.create({
    data: { userId: user.id, userName: user.name, userEmail: user.email, amount, method, txnId },
  });
  pushNotification({
    type: "wallet",
    title: `Wallet topup requested: ৳${amount.toLocaleString()}`,
    body: `${user.name} · ${method} · ${txnId}`,
    href: `/admin/wallet-topups`,
  }).catch(() => {});

  return NextResponse.json({ ok: true, id: topup.id });
}
