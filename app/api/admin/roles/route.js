export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { guard, audit, missingGrants } from "@/lib/adminAuth";
import { cleanPermissions } from "@/lib/permissions";

const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

// Create a custom role. "*" (everything) is reserved for the Owner role.
export async function POST(req) {
  const { admin, res } = await guard("team.manage");
  if (res) return res;
  const b = await req.json().catch(() => ({}));
  const name = String(b.name || "").trim().slice(0, 40);
  if (!name) return NextResponse.json({ error: "Give the role a name." }, { status: 400 });
  if (await prisma.adminRole.findFirst({ where: { name } })) return NextResponse.json({ error: "A role with this name already exists." }, { status: 409 });
  const permissions = cleanPermissions(b.permissions).filter((p) => p !== "*");
  if (!permissions.length) return NextResponse.json({ error: "Tick at least one permission." }, { status: 400 });
  const missing = missingGrants(admin, permissions);
  if (missing.length) return NextResponse.json({ error: `You can't grant permissions you don't have: ${missing.join(", ")}` }, { status: 403 });

  const role = await prisma.adminRole.create({
    data: { name, description: String(b.description || "").trim().slice(0, 300) || null, color: COLOR_RE.test(b.color) ? b.color : "#64748B", permissions: JSON.stringify(permissions) },
  });
  await audit(admin, "role.create", { target: name, detail: permissions.join(", "), req });
  return NextResponse.json({ ok: true, id: role.id });
}
