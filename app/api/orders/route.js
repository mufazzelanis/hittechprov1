import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getUserId, signUserToken, userCookieName } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { getPaymentOptions, applyCoupon, toUsd, WALLET_METHOD } from "@/lib/payments";
import { priceItems } from "@/lib/pricing";
import { limited } from "@/lib/rateLimit";
import { ensureRefCode } from "@/lib/affiliate";
import { sendCapi, reqContext, purchaseEvent, capiOnPaid } from "@/lib/fb";
import { pushNotification } from "@/lib/notify";
import { identifyVisitor } from "@/lib/visits";
import { checkPhone, splitPhone } from "@/lib/phone";
import { verifyEmail } from "@/lib/emailServer";
import { checkTxn, methodKind } from "@/lib/txn";
import { walletBalance } from "@/lib/wallet";
import { logOrderEvent } from "@/lib/orderEvents";

export const dynamic = "force-dynamic";

const clip = (v, n) => String(v ?? "").trim().slice(0, n);
const fail = (error, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req) {
  const tooMany = limited(req, "orders", 12, 3600);
  if (tooMany) return tooMany;
  const b = await req.json().catch(() => ({}));
  const name = clip(b.name, 120);
  const email = clip(b.email, 160).toLowerCase();
  const sp = splitPhone(clip(b.phone, 40));
  const ph = checkPhone(sp.cc || "+880", sp.rest);
  const phone = ph.e164;
  if (!name || !/^\S+@\S+\.\S+$/.test(email)) return fail("Please enter a valid name and email address.");
  if (ph.status === "error" || ph.status === "empty") return fail(ph.messages.find((m) => m.type === "error")?.text || "Please enter a valid mobile phone number.");
  if (b.agree !== true) return fail("Please accept the Usage Terms and Policy.");

  const s = await getSettings({ withSecrets: true });
  const method = clip(b.method, 60);
  const isWallet = method === WALLET_METHOD;

  // Paying from the wallet skips the whole manual-verification dance (method picker + Transaction ID) -
  // the money was already verified once, when the topup that funds it got approved.
  let txnId = null;
  if (!isWallet) {
    const options = getPaymentOptions(s);
    if (options.length && !options.some((o) => o.name === method)) return fail("Please choose a payment method.");
    const tx = checkTxn(methodKind(method), clip(b.txnId, 400));
    if (tx.status === "empty") return fail("Please enter the payment Transaction ID.");
    if (tx.status === "error") return fail(tx.messages.find((m) => m.type === "error")?.text || "Please enter a valid Transaction ID.");
    txnId = clip(tx.value, 80);
    const [dupOrder, dupTopup] = await Promise.all([
      prisma.order.findFirst({ where: { txnId, status: { not: "CANCELLED" } } }),
      prisma.walletTopup.findFirst({ where: { txnId, status: { not: "REJECTED" } } }),
    ]);
    if (dupOrder || dupTopup) return fail("This Transaction ID has already been used.", 409);
  }

  // A wallet balance only exists for a signed-in account, so unlike every other method here, there is no
  // guest path for it - the whole point (skip re-entering payment details) does not apply to a one-time
  // guest checkout anyway.
  const uid = getUserId();
  if (isWallet && !uid) return fail("Please sign in to pay from your wallet balance.", 401);

  let user = uid ? await prisma.user.findUnique({ where: { id: uid } }) : null;
  let newToken = null;
  if (!user) {
    const password = String(b.password || "");
    if (password.length < 8) return fail("Choose a password of at least 8 characters, or log in.");
    const em = await verifyEmail(email);
    if (em.status === "error") return fail(em.messages.find((m) => m.type === "error")?.text || "Please enter a real email address.");
    if (await prisma.user.findUnique({ where: { email } }))
      return fail("An account with this email already exists. Please log in and try again.", 409);
    user = await prisma.user.create({ data: { name, email, phone, password: await bcrypt.hash(password, 10) } });
    await ensureRefCode(user);
    newToken = signUserToken(user);
  }

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

  if (isWallet) {
    const balance = await walletBalance(user.id);
    if (balance < amount) return fail(`Insufficient wallet balance. Your balance is ৳${balance.toLocaleString()}.`, 402);
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

  // Tell the admin how many dollars to look for in the wallet, at the rate shown to the buyer.
  const usd = methodKind(method) === "crypto" ? toUsd(amount, s.usdRate) : null;
  const usdNote = usd ? `Crypto: expected ${usd.toFixed(2)} ${s.usdCurrency || "USDT"} (1 USD = ৳${s.usdRate})` : "";
  const note = [clip(b.note, 500), couponNote, usdNote].filter(Boolean).join("\n") || null;
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
      status: isWallet ? "PAID" : undefined,
    },
  });
  if (isWallet) {
    await logOrderEvent(order.id, "status", `Paid instantly from wallet balance - ৳${amount.toLocaleString()} deducted`, null).catch(() => {});
    capiOnPaid(order).catch(() => {});
  }

  // An order can carry at most one SMM line for now (the basket dedupes by cart-line id, not service, so
  // someone could in theory add the same or different SMM service twice - keeping this to "first line
  // wins" is a deliberate v1 simplification rather than a real limit on what they can buy overall, since
  // they can always place a second order for a second SMM service).
  const smmLine = priced.lines.find((l) => l.smm);
  if (smmLine) {
    await prisma.smmOrder.create({
      data: { orderId: order.id, serviceId: smmLine.smm.serviceId, link: smmLine.smm.link, quantity: smmLine.smm.quantity },
    }).catch(() => {});
  }

  // Facebook: remember the visitor's browser hints for a later "paid" Purchase, and (mode "order") send it now.
  const ctx = reqContext(req);
  const evUrl = req.headers.get("referer") || "";
  await prisma.setting.upsert({ where: { key: `orderfb:${order.id}` }, update: { value: JSON.stringify({ ...ctx, url: evUrl }) }, create: { key: `orderfb:${order.id}`, value: JSON.stringify({ ...ctx, url: evUrl }) } }).catch(() => {});
  const fbNow = !!s.fbPixelId && s.fbPurchaseMode !== "paid";
  if (fbNow && s.fbCapiToken) sendCapi(s, [purchaseEvent({ order, ctx, url: evUrl })]).catch(() => {});

  pushNotification({
    type: smmLine ? "smm" : "order",
    title: smmLine ? `New SMM order #${order.number} · ৳${amount.toLocaleString()}` : `New order #${order.number} · ৳${amount.toLocaleString()}`,
    body: smmLine ? `${name} · ${order.itemName} - confirm payment, then Send to SMMIU` : `${name} · ${order.itemName}`,
    href: `/admin/orders?q=${order.number}`,
  }).catch(() => {});
  identifyVisitor(b.visitorId, { name, email, phone }).catch(() => {});

  const res = NextResponse.json({ ok: true, number: order.number, amount, ...(fbNow ? { fb: { eventId: `purchase-${order.id}` } } : {}) });
  if (newToken) {
    res.cookies.set(userCookieName(), newToken, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
  }
  return res;
}
