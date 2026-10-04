import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { saveUpload } from "@/lib/privateFiles";
import { guard } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

// Admin upload of a private (paid) file - a product download or a service delivery. Returns the file
// reference to store on the product/order; the file itself is never publicly reachable.
export async function POST(req) {
  { const g = await guard("store.manage"); if (g.res) return g.res; }
  const form = await req.formData().catch(() => null);
  try {
    return NextResponse.json({ file: await saveUpload(form?.get("file")) });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Upload failed" }, { status: 400 });
  }
}
