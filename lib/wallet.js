import { prisma } from "./db";
import { WALLET_METHOD } from "./payments";

// A wallet's spendable balance is never stored - it's always derived from the two source-of-truth
// tables (same philosophy as affiliate balance in lib/affiliate.js): every APPROVED topup adds money in,
// every order actually paid for with the wallet takes money out. A refunded/cancelled wallet order is
// excluded, so refunding one automatically gives the balance back with no extra bookkeeping, and there is
// no mutable balance field anywhere that could ever drift out of sync with these records.
export async function walletBalance(userId) {
  const [topups, orders] = await Promise.all([
    prisma.walletTopup.aggregate({ where: { userId, status: "APPROVED" }, _sum: { amount: true } }),
    prisma.order.aggregate({ where: { userId, method: WALLET_METHOD, status: { notIn: ["CANCELLED", "REFUNDED"] } }, _sum: { amount: true } }),
  ]);
  return (topups._sum.amount || 0) - (orders._sum.amount || 0);
}
