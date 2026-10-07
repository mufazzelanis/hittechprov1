export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiHelpers";
import { smmBalance } from "@/lib/smmiu";
import { guard } from "@/lib/adminAuth";

const deny = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function GET(req) {
  { const g = await guard("growth.view"); if (g.res) return g.res; }
  // ?key=... lets Admin -> SMM Services test an API key before saving it - the saved key is used otherwise.
  const keyOverride = new URL(req.url).searchParams.get("key") || undefined;
  try {
    const b = await smmBalance(keyOverride);
    return NextResponse.json({ balance: parseFloat(b.balance) || 0, currency: b.currency || "USD" });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Could not reach SMMIU" }, { status: 502 });
  }
}
