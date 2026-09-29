import { NextResponse } from "next/server";
import { limited } from "@/lib/rateLimit";
import { verifyEmail } from "@/lib/emailServer";

export const dynamic = "force-dynamic";

// Live email check for the checkout form (debounced while the customer types).
export async function POST(req) {
  const tooMany = limited(req, "check-email", 60, 600);
  if (tooMany) return tooMany;
  const b = await req.json().catch(() => ({}));
  const r = await verifyEmail(String(b.email ?? "").slice(0, 254));
  return NextResponse.json({ status: r.status, messages: r.messages, suggestion: r.suggestion });
}
