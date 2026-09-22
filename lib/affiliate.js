import { prisma } from "./db";

const COUNTED = ["PAID", "DELIVERED"];

export async function ensureRefCode(user) {
  if (user.refCode) return user.refCode;
  for (let i = 0; i < 5; i++) {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    try {
      await prisma.user.update({ where: { id: user.id }, data: { refCode: code } });
      return code;
    } catch {}
  }
  return null;
}

// Earnings only count paid/delivered orders, so refunds/cancellations drop out automatically.
export async function affiliateStats(user) {
  if (!user.refCode) return { referrals: 0, earned: 0, pending: 0, paidOut: 0, requested: 0, balance: 0 };
  const [orders, payouts] = await Promise.all([
    prisma.order.findMany({ where: { refCode: user.refCode }, select: { commission: true, status: true } }),
    prisma.payout.findMany({ where: { userId: user.id } }),
  ]);
  const sum = (a) => a.reduce((n, x) => n + x, 0);
  const earned = sum(orders.filter((o) => COUNTED.includes(o.status)).map((o) => o.commission));
  const pending = sum(orders.filter((o) => o.status === "PENDING").map((o) => o.commission));
  const committed = sum(payouts.filter((p) => p.status !== "REJECTED").map((p) => p.amount));
  return {
    referrals: orders.length,
    earned,
    pending,
    paidOut: sum(payouts.filter((p) => p.status === "PAID").map((p) => p.amount)),
    requested: committed,
    balance: earned - committed,
  };
}

export const affiliateOn = (s) => s.affiliateOn === "true";
