import { NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";
import { limited } from "@/lib/rateLimit";
import { sendCapi, reqContext, userData } from "@/lib/fb";

export const dynamic = "force-dynamic";

const ALLOWED = ["PageView", "ViewContent", "AddToCart", "InitiateCheckout", "Lead", "Contact", "CompleteRegistration", "Search"];

// Receives the same event the browser Pixel fired (same event_id, so Meta de-duplicates) and forwards it
// server-side with the visitor's IP / user agent / fbp / fbc. Only whitelisted events and fields are accepted.
export async function POST(req) {
  const tooMany = limited(req, "fb-event", 120, 60);
  if (tooMany) return tooMany;
  const b = await req.json().catch(() => ({}));
  if (!ALLOWED.includes(b.name)) return new NextResponse(null, { status: 204 });

  const s = await getSettings({ withSecrets: true });
  if (!s.fbPixelId || !s.fbCapiToken) return new NextResponse(null, { status: 204 });

  const d = b.data && typeof b.data === "object" ? b.data : {};
  const custom = {};
  if (Number.isFinite(Number(d.value)) && d.value !== undefined) custom.value = Math.max(0, Number(d.value));
  if (custom.value !== undefined) custom.currency = "BDT";
  if (Array.isArray(d.content_ids)) custom.content_ids = d.content_ids.slice(0, 20).map((x) => String(x).slice(0, 60));
  if (d.content_name) custom.content_name = String(d.content_name).slice(0, 120);
  if (d.content_type === "product") custom.content_type = "product";

  const url = String(b.url || "").slice(0, 500);
  await sendCapi(s, [
    {
      event_name: b.name,
      event_time: Math.floor(Date.now() / 1000),
      event_id: String(b.eventId || "").slice(0, 80) || undefined,
      event_source_url: /^https?:\/\//i.test(url) ? url : undefined,
      action_source: "website",
      user_data: userData({}, reqContext(req)),
      custom_data: Object.keys(custom).length ? custom : undefined,
    },
  ]);
  return new NextResponse(null, { status: 204 });
}
