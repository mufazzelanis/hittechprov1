export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { userCookieName } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(userCookieName(), "", { path: "/", maxAge: 0 });
  return res;
}
