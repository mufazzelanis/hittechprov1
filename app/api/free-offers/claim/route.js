import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { limited } from "@/lib/rateLimit";
import { getOffers, isEnded, claimTag, startAge, MIN_SECONDS_PER_JOIN } from "@/lib/offers";
import { pushNotification } from "@/lib/notify";
import { identifyVisitor } from "@/lib/visits";

export const dynamic = "force-dynamic";

const clip = (v, n) => String(v ?? "").trim().slice(0, n);
const fail = (error, status = 400) => NextResponse.json({ error }, { status });

// Public: a visitor claims a free offer. The reward text is only ever sent from here, never in page HTML.
export async function POST(req) {
  const tooMany = limited(req, "claim", 10, 3600);
  if (tooMany) return tooMany;
  const s = await getSettings();
  if (s.freeOffersOn !== "true") return fail("Free offers are not open yet.", 403);

  const b = await req.json().catch(() => ({}));
  const name = clip(b.name, 120);
  const email = clip(b.email, 160).toLowerCase();
  const phone = clip(b.phone, 40);
  const handle = clip(b.handle, 80);
  if (!name || !/^\S+@\S+\.\S+$/.test(email)) return fail("Please enter your name and a valid email.");

  const offer = (await getOffers()).find((o) => o.id === String(b.offerId));
  if (!offer || !offer.active) return fail("This offer is not available.", 404);
  if (isEnded(offer)) return fail("This offer has ended.", 410);

  const tag = claimTag(offer.id);
  const mine = await prisma.lead.findFirst({ where: { type: "free-offer", email, message: { startsWith: tag } } });
  if (!mine) {
    if (offer.joins.length) {
      const age = startAge(b.token, offer.id);
      if (age === null || age < offer.joins.length * MIN_SECONDS_PER_JOIN) return fail("Please join the channel(s) first, then try again.", 400);
    }
    if (offer.max > 0 && offer.claims >= offer.max) return fail("Sorry, this offer is fully claimed.", 409);
    await prisma.lead.create({ data: { type: "free-offer", name, email, phone: phone || null, message: `${tag} ${offer.name}${handle ? ` | ${handle}` : ""}` } });
    pushNotification({ type: "claim", title: `Free offer claimed: ${offer.name}`, body: `${name} · ${email}`, href: `/admin/leads?q=${encodeURIComponent(email)}` }).catch(() => {});
  } else {
    // Same person opening the claim form again for an offer they already have: no duplicate Lead row
    // (so the claim count stays accurate), but the admin still gets pinged - every submission should
    // surface a notification, not just the first one for a given email.
    pushNotification({ type: "claim", title: `Free offer re-opened: ${offer.name}`, body: `${name} · ${email} · already claimed before`, href: `/admin/leads?q=${encodeURIComponent(email)}` }).catch(() => {});
  }
  identifyVisitor(b.visitorId, { name, email, phone: phone || null }).catch(() => {});
  return NextResponse.json({ ok: true, repeat: !!mine, reward: offer.reward, name: offer.name });
}
