import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { capiOnPaid } from "@/lib/fb";

export const dynamic = "force-dynamic";

const clip = (v, n) => String(v ?? "").trim().slice(0, n);
const fail = (error, status = 400) => NextResponse.json({ error }, { status });
const STATUSES = ["PENDING", "PAID", "DELIVERED", "REFUNDED", "CANCELLED"];

// Admin-only: record an order taken by phone / chat. Stored with itemType "manual" so it can be told apart.
export async function POST(req) {
  if (!getSession()) return fail("Unauthorized", 401);
  const b = await req.json().catch(() => ({}));

  const name = clip(b.name, 120);
  const phone = clip(b.phone, 40);
  const email = clip(b.email, 160).toLowerCase();
  if (!name) return fail("Customer name is required.");
  if (phone.length < 6) return fail("Enter the customer's phone number.");
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return fail("That email address is not valid.");

  // catalog items (prices from the database, inactive items allowed for admins)
  const models = { tool: prisma.tool, bundle: prisma.bundle, plan: prisma.packPlan };
  const lines = [];
  const seen = new Set();
  for (const w of Array.isArray(b.items) ? b.items.slice(0, 30) : []) {
    const key = `${w?.type}:${w?.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const model = Object.hasOwn(models, w?.type) ? models[w.type] : null;
    const row = model ? await model.findUnique({ where: { id: String(w.id) } }) : null;
    if (!row) return fail("One of the selected items no longer exists.", 404);
    lines.push({ name: row.name, price: row.price });
  }
  // free-form items (something not in the catalog)
  for (const c of Array.isArray(b.custom) ? b.custom.slice(0, 10) : []) {
    const n = clip(c?.name, 100);
    const p = parseInt(c?.amount, 10);
    if (!n) continue;
    if (!(p >= 0)) return fail(`Enter a valid price for "${n}".`);
    lines.push({ name: n, price: p });
  }
  if (!lines.length) return fail("Add at least one item.");

  const sum = lines.reduce((n, l) => n + l.price, 0);
  let amount = sum;
  if (b.amount !== undefined && b.amount !== null && b.amount !== "") {
    amount = parseInt(b.amount, 10);
    if (!(amount >= 0)) return fail("The total amount is not valid.");
  }

  const status = STATUSES.includes(b.status) ? b.status : "PENDING";
  const txnId = clip(b.txnId, 80) || null;
  if (txnId && (await prisma.order.findFirst({ where: { txnId, status: { not: "CANCELLED" } } })))
    return fail("This Transaction ID is already used on another order.", 409);

  const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
  const adjusted = amount !== sum ? `Price adjusted: items ৳${sum} → charged ৳${amount}` : "";
  const note = ["Manual order (phone/chat)", clip(b.note, 500), adjusted].filter(Boolean).join("\n");

  const order = await prisma.order.create({
    data: {
      itemType: "manual",
      itemName: lines.map((l) => l.name).join(", ").slice(0, 190),
      amount,
      name,
      email,
      phone,
      method: clip(b.method, 60) || null,
      txnId,
      status,
      userId: user?.id || null,
      note,
    },
  });
  capiOnPaid(order);
  return NextResponse.json({ ok: true, number: order.number });
}
