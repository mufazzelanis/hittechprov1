import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getUserId, signUserToken, userCookieName } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { getPaymentOptions, applyCoupon } from "@/lib/payments";
import { priceItems } from "@/lib/pricing";
import { limited } from "@/lib/rateLimit";
import { ensureRefCode } from "@/lib/affiliate";
import { sendCapi, reqContext, purchaseEvent } from "@/lib/fb";
import { pushNotification } from "@/lib/notify";
import { identifyVisitor } from "@/lib/visits";

export const dynamic = "force-dynamic";

const clip = (v, n) => String(v ?? "").trim().slice(0, n);
const fail = (error, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req) {
  const tooMany = limited(req, "orders", 12, 3600);
  if (tooMany) return tooMany;
  const b = await req.json().catch(() => ({}));
  const name = clip(b.name, 120);
  const email = clip(b.email, 160).toLowerCase();
  const phone = clip(b.phone, 40);
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || phone.length < 6) return fail("Please enter a valid name, email and phone number.");
  if (b.agree !== true) return fail("Please accept the Usage Terms and Policy.");

  const s = await getSettings({ withSecrets: true });
  const options = getPaymentOptions(s);
  const method = clip(b.method, 60);
  const txnId = clip(b.txnId, 80);
  if (options.length && !options.some((o) => o.name === method)) return fail("Please choose a payment method.");
  if (txnId.length < 6) return fail("Please enter the payment Transaction ID.");
  if (await prisma.order.findFirst({ where: { txnId, status: { not: "CANCELLED" } } }))
    return fail("This Transaction ID has already been used on another order.", 409);

  const wanted = Array.isArray(b.items) && b.items.length ? b.items : [{ type: b.itemType, id: b.itemId }];
  const priced = await priceItems(wanted);
  if (priced.error) return fail(priced.error, priced.status);

  let discount = 0;
  let couponNote = "";
  if (clip(b.coupon, 40)) {
    const c = applyCoupon(s.coupons, b.coupon, priced.subtotal);
    if (!c) return fail("This coupon code is not valid.");
    discount = c.discount;
    couponNote = `Coupon ${c.code} (-৳${c.discount})`;
  }
  const amount = priced.subtotal - discount;

  // Signed-in customers order as themselves; guests create an account as part of checkout.
  const uid = getUserId();
  let user = uid ? await prisma.user.findUnique({ where: { id: uid } }) : null;
  let newToken = null;
  if (!user) {
    const password = String(b.password || "");
    if (password.length < 8) return fail("Choose a password of at least 8 characters, or log in.");
    if (await prisma.user.findUnique({ where: { email } }))
      return fail("An account with this email already exists. Please log in and try again.", 409);
    user = await prisma.user.create({ data: { name, email, phone, password: await bcrypt.hash(password, 10) } });
    await ensureRefCode(user);
    newToken = signUserToken(user);
  }

  // Affiliate attribution from the cookie set by ?ref=CODE. Self-referrals earn nothing.
  let refCode = null;
  let commission = 0;
  const code = cookies().get("htp_ref")?.value?.toUpperCase();
  if (s.affiliateOn === "true" && code && /^[A-Z0-9]{4,12}$/.test(code)) {
    const aff = await prisma.user.findUnique({ where: { refCode: code } });
    if (aff && aff.id !== user.id && aff.email !== email) {
      refCode = code;
      commission = Math.floor((amount * (parseFloat(s.affRate) || 0)) / 100);
    }
  }

  const note = [clip(b.note, 500), couponNote].filter(Boolean).join("\n") || null;
  const order = await prisma.order.create({
    data: {
      itemType: priced.lines.length > 1 ? "cart" : priced.lines[0].type,
      itemName: priced.lines.map((l) => l.name).join(", ").slice(0, 190),
      amount,
      name,
      email,
      phone,
      method: method || null,
      txnId,
      userId: user.id,
      refCode,
      commission,
      note,
    },
  });

  // Facebook: remember the visitor's browser hints for a later "paid" Purchase, and (mode "order") send it now.
  const ctx = reqContext(req);
  const evUrl = req.headers.get("referer") || "";
  await prisma.setting.upsert({ where: { key: `orderfb:${order.id}` }, update: { value: JSON.stringify({ ...ctx, url: evUrl }) }, create: { key: `orderfb:${order.id}`, value: JSON.stringify({ ...ctx, url: evUrl }) } }).catch(() => {});
  const fbNow = !!s.fbPixelId && s.fbPurchaseMode !== "paid";
  if (fbNow && s.fbCapiToken) sendCapi(s, [purchaseEvent({ order, ctx, url: evUrl })]).catch(() => {});

  pushNotification({
    type: "order",
    title: `New order #${order.number} · ৳${amount.toLocaleString()}`,
    body: `${name} · ${order.itemName}`,
    href: `/admin/orders?q=${order.number}`,
  }).catch(() => {});
  identifyVisitor(b.visitorId, { name, email, phone }).catch(() => {});

  const res = NextResponse.json({ ok: true, number: order.number, amount, ...(fbNow ? { fb: { eventId: `purchase-${order.id}` } } : {}) });
  if (newToken) {
    res.cookies.set(userCookieName(), newToken, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
  }
  return res;
}
