export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { translateBatch } from "@/lib/translate";
import { limited } from "@/lib/rateLimit";

const SUPPORTED = ["bn"];

// Public: batch-translates a page's visible text to Bangla for the header EN/BN toggle. The client sends
// every unique string on the page in one call (a content-heavy page can easily have 300+), and this
// route rations the actual outbound translate calls itself (lib/translate.js) - so it can take a while
// on a big page's very first visit, but it works through the whole list reliably rather than racing
// several parallel requests against the free endpoint and losing some of them.
export async function POST(req) {
  const tooMany = limited(req, "translate", 30, 60);
  if (tooMany) return tooMany;

  const { texts, lang } = await req.json().catch(() => ({}));
  if (!Array.isArray(texts) || !texts.length) return NextResponse.json({ map: {} });
  const target = SUPPORTED.includes(lang) ? lang : "bn";

  const map = await translateBatch(texts.slice(0, 600), target);
  return NextResponse.json({ map });
}
