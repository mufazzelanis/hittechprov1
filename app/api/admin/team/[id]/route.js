export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { guard, audit, missingGrants, otherActiveOwners } from "@/lib/adminAuth";
import { parsePermissions } from "@/lib/permissions";

const bad = (error, status = 400) => NextResponse.json({ error }, { status });

// Loads the target and applies the rules every team change shares. Returns { target } or { res }.
async function loadTarget(admin, id) {
  if (id === admin.id) return { res: bad("You can't change your own access. Ask another Owner.") };
  const target = await prisma.user.findUnique({ where: { id }, include: { adminRole: true } });
  if (!target || target.role !== "ADMIN") return { res: bad("Team member not found.", 404) };
  if (target.adminRole?.key === "owner" && !admin.isOwner) return { res: bad("Only an Owner can change another Owner.", 403) };
  return { target };
}

// PATCH { roleId?, active?, signOut?, password? }
export async function PATCH(req, { params }) {
  const { admin, res } = await guard("team.manage");
  if (res) return res;
  const { target, res: no } = await loadTarget(admin, params.id);
  if (no) return no;

  const b = await req.json().catch(() => ({}));
  const data = {};
  const notes = [];
  const isOwner = target.adminRole?.key === "owner";

  if (b.roleId !== undefined && b.roleId !== target.adminRoleId) {
    const role = await prisma.adminRole.findUnique({ where: { id: String(b.roleId) } });
    if (!role) return bad("Role not found.");
    if (role.key === "owner" && !admin.isOwner) return bad("Only an Owner can make someone an Owner.", 403);
    if (missingGrants(admin, parsePermissions(role.permissions)).length) return bad(`You can't give the "${role.name}" role - it includes permissions you don't have.`, 403);
    if (isOwner && role.key !== "owner" && (await otherActiveOwners(target.id)) < 1) return bad("This is the last active Owner. Make someone else an Owner first.");
    data.adminRoleId = role.id;
    notes.push(`role ${target.adminRole?.name || "none"} → ${role.name}`);
  }

  if (b.active !== undefined && !!b.active !== target.active) {
    if (!b.active && isOwner && (await otherActiveOwners(target.id)) < 1) return bad("You can't suspend the last active Owner.");
    data.active = !!b.active;
    notes.push(b.active ? "reactivated" : "suspended");
  }

  if (b.password !== undefined) {
    const pw = String(b.password || "");
    if (pw.length < 10) return bad("The new password must be at least 10 characters.");
    data.password = await bcrypt.hash(pw, 10);
    notes.push("password reset");
  }

  if (b.signOut) notes.push("signed out of all devices");
  if (!notes.length) return NextResponse.json({ ok: true });

  // Any of these changes ends the member's current sessions immediately.
  data.tokenVersion = { increment: 1 };
  await prisma.user.update({ where: { id: target.id }, data });
  const action = data.adminRoleId ? "team.role_change" : data.active === false ? "team.suspend" : data.active === true ? "team.reactivate" : data.password ? "team.password_reset" : "team.sign_out";
  await audit(admin, action, { target: target.email, detail: notes.join("; "), req });
  return NextResponse.json({ ok: true });
}

// Removes admin access. The account itself (orders, purchases) is kept as a normal customer account.
export async function DELETE(req, { params }) {
  const { admin, res } = await guard("team.manage");
  if (res) return res;
  const { target, res: no } = await loadTarget(admin, params.id);
  if (no) return no;
  if (target.adminRole?.key === "owner" && (await otherActiveOwners(target.id)) < 1) return bad("This is the last active Owner and can't be removed.");

  await prisma.user.update({ where: { id: target.id }, data: { role: "CUSTOMER", adminRoleId: null, active: true, tokenVersion: { increment: 1 } } });
  await audit(admin, "team.remove", { target: target.email, detail: `Removed from the team (was ${target.adminRole?.name || "admin"})`, req });
  return NextResponse.json({ ok: true });
}
