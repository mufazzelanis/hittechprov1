import { NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";
import { applyCoupon } from "@/lib/payments";
import { priceItems } from "@/lib/pricing";
import { limited } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

// Checks a coupon against the basket total (recomputed from the database).
export async function POST(req) {
  const tooMany = limited(req, "coupon", 30, 600);
  if (tooMany) return tooMany;
  const b = await req.json().catch(() => ({}));
  const priced = await priceItems(b.items);
  if (priced.error) return NextResponse.json({ error: priced.error }, { status: priced.status });
  const s = await getSettings({ withSecrets: true });
  const c = applyCoupon(s.coupons, b.code, priced.subtotal);
  if (!c) return NextResponse.json({ error: "This coupon code is not valid." }, { status: 400 });
  return NextResponse.json({ ok: true, ...c, subtotal: priced.subtotal });
}
