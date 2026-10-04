export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { guard, audit, missingGrants } from "@/lib/adminAuth";
import { cleanPermissions, parsePermissions } from "@/lib/permissions";

const COLOR_RE = /^#[0-9a-fA-F]{6}$/;
const bad = (error, status = 400) => NextResponse.json({ error }, { status });

// Edit a role. Owner is locked. Changes apply to every member on their very next click, because
// permissions are read from the database on each request.
export async function PUT(req, { params }) {
  const { admin, res } = await guard("team.manage");
  if (res) return res;
  const role = await prisma.adminRole.findUnique({ where: { id: params.id } });
  if (!role) return bad("Role not found.", 404);
  if (role.key === "owner") return bad("The Owner role always has full access and can't be edited.", 403);
  // Editing your own role could lock you out or widen your own access - an Owner must do it.
  const mine = await prisma.user.findUnique({ where: { id: admin.id }, select: { adminRoleId: true } });
  if (mine?.adminRoleId === role.id && !admin.isOwner) return bad("You can't edit your own role. Ask an Owner.", 403);

  const b = await req.json().catch(() => ({}));
  const data = {};
  if (b.name !== undefined) {
    const name = String(b.name || "").trim().slice(0, 40);
    if (!name) return bad("Give the role a name.");
    if (await prisma.adminRole.findFirst({ where: { name, NOT: { id: role.id } } })) return bad("A role with this name already exists.", 409);
    data.name = name;
  }
  if (b.description !== undefined) data.description = String(b.description || "").trim().slice(0, 300) || null;
  if (b.color !== undefined && COLOR_RE.test(b.color)) data.color = b.color;

  let diff = "";
  if (b.permissions !== undefined) {
    const next = cleanPermissions(b.permissions).filter((p) => p !== "*");
    if (!next.length) return bad("Tick at least one permission.");
    const prev = parsePermissions(role.permissions);
    // Only check the permissions being ADDED: a non-owner can still remove ones they don't hold.
    const added = next.filter((p) => !prev.includes(p));
    const missing = missingGrants(admin, added);
    if (missing.length) return bad(`You can't grant permissions you don't have: ${missing.join(", ")}`, 403);
    data.permissions = JSON.stringify(next);
    const removed = prev.filter((p) => !next.includes(p));
    diff = [added.length && `+ ${added.join(", ")}`, removed.length && `− ${removed.join(", ")}`].filter(Boolean).join("  ");
  }

  await prisma.adminRole.update({ where: { id: role.id }, data });
  await audit(admin, "role.update", { target: data.name || role.name, detail: diff || Object.keys(data).join(", "), req });
  return NextResponse.json({ ok: true });
}

// Delete a custom role. Built-in roles stay (they'd be recreated anyway); a role still in use can't be
// deleted, so nobody is ever left without a role.
export async function DELETE(req, { params }) {
  const { admin, res } = await guard("team.manage");
  if (res) return res;
  const role = await prisma.adminRole.findUnique({ where: { id: params.id }, include: { _count: { select: { users: true } } } });
  if (!role) return bad("Role not found.", 404);
  if (role.system) return bad("Built-in roles can't be deleted. You can edit their permissions instead.", 403);
  if (role._count.users) return bad(`${role._count.users} member(s) still have this role. Move them to another role first.`, 409);
  await prisma.adminRole.delete({ where: { id: role.id } });
  await audit(admin, "role.delete", { target: role.name, req });
  return NextResponse.json({ ok: true });
}
