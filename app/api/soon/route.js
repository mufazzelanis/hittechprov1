import { NextResponse } from "next/server";
import { getToolInfo } from "@/lib/limits";

export const dynamic = "force-dynamic";

// Public: ids of products currently marked "Coming soon" (used to clean stale baskets).
export async function GET() {
  const info = await getToolInfo();
  const ids = Object.keys(info).filter((id) => info[id]?.soon);
  return NextResponse.json({ ids }, { headers: { "Cache-Control": "no-store" } });
}
