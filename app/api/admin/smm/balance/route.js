export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiHelpers";
import { smmBalance } from "@/lib/smmiu";

const deny = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function GET() {
  if (!requireAdmin()) return deny();
  try {
    const b = await smmBalance();
    return NextResponse.json({ balance: parseFloat(b.balance) || 0, currency: b.currency || "USD" });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Could not reach SMMIU" }, { status: 502 });
  }
}
