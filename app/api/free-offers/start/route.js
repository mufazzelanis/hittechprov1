import { NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";
import { getOffers, signStart } from "@/lib/offers";

export const dynamic = "force-dynamic";

// Called when the claim popup opens; hands back a short-lived token the claim must present.
export async function POST(req) {
  const s = await getSettings();
  const { offerId } = await req.json().catch(() => ({}));
  const offer = s.freeOffersOn === "true" ? (await getOffers()).find((o) => o.id === String(offerId) && o.active) : null;
  if (!offer) return NextResponse.json({ error: "Not available" }, { status: 404 });
  return NextResponse.json({ token: signStart(offer.id) });
}
