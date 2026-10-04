export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookieName } from "@/lib/auth";
import { getAdmin, audit } from "@/lib/adminAuth";

export async function POST(req) {
  const admin = await getAdmin();
  if (admin) await audit(admin, "auth.logout", { target: admin.email, req });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookieName(), "", { path: "/", maxAge: 0 });
  return res;
}
