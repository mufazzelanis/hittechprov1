import { cache } from "react";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import { getSession } from "./auth";
import { SYSTEM_ROLES, PAGE_PERMS, parsePermissions, can, canAny } from "./permissions";

// ---- System roles --------------------------------------------------------------------------------

let rolesReady = null;
// Creates the built-in roles once (per server process) if they're missing. Existing roles are never
// overwritten, so an edited Manager/Support role keeps the admin's changes.
export function ensureSystemRoles() {
  if (!rolesReady) {
    rolesReady = (async () => {
      for (const r of SYSTEM_ROLES) {
        await prisma.adminRole.upsert({
          where: { key: r.key },
          update: r.key === "owner" ? { permissions: JSON.stringify(["*"]), system: true } : {},
          create: { key: r.key, name: r.name, description: r.description, color: r.color, permissions: JSON.stringify(r.permissions), system: true },
        });
      }
    })().catch((e) => { rolesReady = null; throw e; });
  }
  return rolesReady;
}

export async function ownerRole() {
  await ensureSystemRoles();
  return prisma.adminRole.findUnique({ where: { key: "owner" } });
}

// ---- Current admin -------------------------------------------------------------------------------

// The signed-in admin, re-checked against the database on every request: a suspended, removed or
// role-changed admin loses access immediately, not when their 7-day cookie expires.
// Returns { id, name, email, role: { id, key, name, color }, perms: string[], isOwner } or null.
export const getAdmin = cache(async () => {
  const token = getSession();
  if (!token?.id) return null;
  let user = await prisma.user.findUnique({ where: { id: token.id }, include: { adminRole: true } });
  if (!user || user.role !== "ADMIN" || !user.active) return null;
  if ((user.tokenVersion || 0) !== (token.tv || 0)) return null;

  // Admins created before roles existed had full access - they become Owners, keeping exactly that.
  // (A role with members can't be deleted, so a missing role only ever means "pre-roles account".)
  if (!user.adminRole) {
    const owner = await ownerRole();
    user = await prisma.user.update({ where: { id: user.id }, data: { adminRoleId: owner.id }, include: { adminRole: true } });
  }
  const perms = parsePermissions(user.adminRole.permissions);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: { id: user.adminRole.id, key: user.adminRole.key, name: user.adminRole.name, color: user.adminRole.color },
    perms,
    isOwner: user.adminRole.key === "owner",
  };
});

export const hasPerm = (admin, perm) => !!admin && can(admin.perms, perm);

// Privilege-escalation guard: an admin may only hand out permissions they hold themselves.
// Returns the permissions they're missing (empty = allowed).
export function missingGrants(admin, perms) {
  if (admin?.isOwner) return [];
  if ((perms || []).includes("*")) return ["*"];
  return (perms || []).filter((p) => !can(admin?.perms || [], p));
}

// How many active Owners would remain if `excludeId` lost Owner rights.
export async function otherActiveOwners(excludeId) {
  const owner = await ownerRole();
  return prisma.user.count({ where: { role: "ADMIN", active: true, adminRoleId: owner.id, NOT: { id: excludeId } } });
}

// For API routes:  const { admin, res } = await guard("orders.manage"); if (res) return res;
// `perm` may be a string or an array (any one of them is enough).
export async function guard(perm) {
  const admin = await getAdmin();
  if (!admin) return { res: NextResponse.json({ error: "Your session has ended. Please sign in again." }, { status: 401 }) };
  const ok = !perm || (Array.isArray(perm) ? canAny(admin.perms, perm) : can(admin.perms, perm));
  if (!ok) return { admin, res: NextResponse.json({ error: "You don't have permission to do this. Ask an owner to update your role." }, { status: 403 }) };
  return { admin };
}

// For admin pages: redirects instead of returning a response.
export async function requirePage(perm) {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  if (perm && !(Array.isArray(perm) ? canAny(admin.perms, perm) : can(admin.perms, perm))) {
    // Send them to the first page they CAN open (never back to this one, so no redirect loop).
    const home = Object.entries(PAGE_PERMS).find(([, p]) => can(admin.perms, p))?.[0];
    redirect(home ? `${home}?denied=1` : "/admin/login?noaccess=1");
  }
  return admin;
}

// ---- Activity log ----------------------------------------------------------------------------------

export function clientIp(req) {
  const h = req?.headers;
  if (!h) return null;
  return (h.get("x-forwarded-for") || "").split(",")[0].trim() || h.get("x-real-ip") || null;
}

// Never throws: a logging hiccup must not break the action being logged.
export async function audit(actor, action, { target = null, detail = null, req = null } = {}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: actor?.id || null,
        actorName: actor?.name || actor?.email || null,
        action: String(action).slice(0, 60),
        target: target ? String(target).slice(0, 190) : null,
        detail: detail ? String(typeof detail === "string" ? detail : JSON.stringify(detail)).slice(0, 4000) : null,
        ip: clientIp(req),
      },
    });
  } catch (e) {
    console.error("[audit] failed to log", action, e);
  }
}
