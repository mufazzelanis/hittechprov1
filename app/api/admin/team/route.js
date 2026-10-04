export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { limited } from "@/lib/rateLimit";
import { guard, audit, ensureSystemRoles, missingGrants } from "@/lib/adminAuth";
import { parsePermissions } from "@/lib/permissions";

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const bad = (error, status = 400) => NextResponse.json({ error }, { status });

const ROLE_ORDER = ["owner", "admin", "manager", "support", "editor", "analyst"];
const sortRoles = (a, b) => (ROLE_ORDER.indexOf(a.key) + 1 || 99) - (ROLE_ORDER.indexOf(b.key) + 1 || 99) || a.name.localeCompare(b.name);

// Team members + roles. Members never include password hashes or reset tokens.
export async function GET() {
  const { admin, res } = await guard("team.view");
  if (res) return res;
  await ensureSystemRoles();
  const [members, roles] = await Promise.all([
    prisma.user.findMany({
      where: { role: "ADMIN" },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, email: true, active: true, lastLoginAt: true, createdAt: true, adminRoleId: true },
    }),
    prisma.adminRole.findMany({ include: { _count: { select: { users: true } } } }),
  ]);
  return NextResponse.json({
    me: { id: admin.id, isOwner: admin.isOwner, perms: admin.perms },
    members,
    roles: roles.sort(sortRoles).map((r) => ({ id: r.id, key: r.key, name: r.name, description: r.description, color: r.color, system: r.system, permissions: parsePermissions(r.permissions), members: r._count.users })),
  });
}

// Add a team member: a brand-new account, or (with promote: true) an existing customer account.
export async function POST(req) {
  const { admin, res } = await guard("team.manage");
  if (res) return res;
  const tooMany = limited(req, "admin-team-add", 20, 3600);
  if (tooMany) return tooMany;

  const b = await req.json().catch(() => ({}));
  const name = String(b.name || "").trim().slice(0, 120);
  const email = String(b.email || "").trim().toLowerCase().slice(0, 160);
  const password = String(b.password || "");
  if (!EMAIL_RE.test(email)) return bad("Enter a valid email address.");

  const role = await prisma.adminRole.findUnique({ where: { id: String(b.roleId || "") } });
  if (!role) return bad("Choose a role.");
  if (role.key === "owner" && !admin.isOwner) return bad("Only an Owner can add another Owner.", 403);
  const missing = missingGrants(admin, parsePermissions(role.permissions));
  if (missing.length) return bad(`You can't give the "${role.name}" role - it includes permissions you don't have.`, 403);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.role === "ADMIN") return bad("This person is already on the team.", 409);

  let user;
  if (existing) {
    // A customer account: only promoted when the admin explicitly confirms it (they keep their password).
    if (!b.promote) return NextResponse.json({ error: `${email} already has a customer account. Promote it to the team instead?`, code: "customer_exists", name: existing.name }, { status: 409 });
    user = await prisma.user.update({ where: { id: existing.id }, data: { role: "ADMIN", adminRoleId: role.id, active: true, tokenVersion: { increment: 1 } } });
  } else {
    if (!name) return bad("Enter their name.");
    if (password.length < 10) return bad("Give them a starting password of at least 10 characters.");
    user = await prisma.user.create({ data: { name, email, password: await bcrypt.hash(password, 10), role: "ADMIN", adminRoleId: role.id } });
  }
  await audit(admin, "team.add", { target: email, detail: `${existing ? "Promoted customer account" : "New account"} as ${role.name}`, req });
  return NextResponse.json({ ok: true, id: user.id });
}
