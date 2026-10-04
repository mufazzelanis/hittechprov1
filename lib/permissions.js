// The admin permission catalog. Safe to import in the browser (no secrets, no database).
//
// Every area has a ".view" and (usually) a ".manage" permission. "manage" includes "view" of the same
// area, so a role never ends up able to edit something it can't see. "*" means everything (Owner).

export const PERMISSION_GROUPS = [
  { id: "dashboard", label: "Dashboard", perms: [["dashboard.view", "Open the admin panel and see the dashboard"]] },
  { id: "orders", label: "Orders", perms: [
    ["orders.view", "See orders, customer names, emails and phone numbers"],
    ["orders.manage", "Change order status, send deliveries and Payoneer links, upload files, add notes"],
    ["orders.create", "Create manual orders"],
  ] },
  { id: "sales", label: "Revenue & reports", perms: [
    ["sales.view", "See revenue figures, the sales report and money totals"],
    ["analytics.view", "See visitor analytics and sessions"],
  ] },
  { id: "affiliates", label: "Customers, affiliates & wallet", perms: [
    ["affiliates.view", "See affiliates, payout requests and wallet top-ups"],
    ["affiliates.manage", "Approve or reject payouts and wallet top-ups"],
  ] },
  { id: "catalog", label: "Tools catalog", perms: [
    ["catalog.view", "See tools, categories, bundles, packs and tool limits"],
    ["catalog.manage", "Add, edit and delete tools, categories, bundles, packs and limits"],
  ] },
  { id: "store", label: "Store (templates & services)", perms: [
    ["store.view", "See digital products and services"],
    ["store.manage", "Add, edit and delete products and services, upload paid files"],
  ] },
  { id: "growth", label: "Growth", perms: [
    ["growth.view", "See free offers, prompt vault, SMM panel and leads"],
    ["growth.manage", "Edit free offers, prompts, SMM services and handle leads"],
  ] },
  { id: "content", label: "Content", perms: [
    ["content.view", "See reviews, FAQs and page content"],
    ["content.manage", "Edit reviews, FAQs and page content"],
  ] },
  { id: "settings", label: "Settings", perms: [
    ["settings.view", "See site settings (secret keys stay hidden)"],
    ["settings.manage", "Change site, payment, SEO and integration settings"],
  ] },
  { id: "team", label: "Team & security", perms: [
    ["team.view", "See team members, roles and the activity log"],
    ["team.manage", "Add, suspend and remove members, change roles"],
  ] },
];

export const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap((g) => g.perms.map(([k]) => k));
const KNOWN = new Set(ALL_PERMISSIONS);

// Keeps only real permission keys (or "*"), so a role can never hold a typo or an invented key.
export function cleanPermissions(list) {
  const arr = Array.isArray(list) ? list : [];
  if (arr.includes("*")) return ["*"];
  return [...new Set(arr.map(String).filter((p) => KNOWN.has(p)))].sort();
}

export function parsePermissions(json) {
  try { return cleanPermissions(JSON.parse(json || "[]")); } catch { return []; }
}

// Does a permission list allow `perm`? "x.manage" also grants "x.view".
export function can(perms, perm) {
  if (!perm) return true;
  const set = perms instanceof Set ? perms : new Set(perms || []);
  if (set.has("*") || set.has(perm)) return true;
  if (perm.endsWith(".view")) return set.has(perm.replace(/\.view$/, ".manage"));
  return false;
}

export const canAny = (perms, list) => list.some((p) => can(perms, p));

// Expanded list (with implied ".view"s) for showing what a role really allows.
export function expand(perms) {
  if ((perms || []).includes("*")) return [...ALL_PERMISSIONS];
  return ALL_PERMISSIONS.filter((p) => can(perms, p));
}

const EVERYTHING_BUT = (...except) => ALL_PERMISSIONS.filter((p) => !except.includes(p));

// Built-in roles, created automatically. Owner is locked; the others can be edited like custom roles.
export const SYSTEM_ROLES = [
  { key: "owner", name: "Owner", color: "#E8352B", description: "Full access to everything, including the team, roles and billing-sensitive settings. Can't be edited or deleted.", permissions: ["*"] },
  { key: "admin", name: "Admin", color: "#7C3AED", description: "Runs the whole store, but can't add, remove or change team members and roles.", permissions: EVERYTHING_BUT("team.manage") },
  { key: "manager", name: "Manager", color: "#0EA5E9", description: "Day-to-day operations: orders, catalog, store, content, growth and revenue. No settings or team.", permissions: ["dashboard.view", "orders.view", "orders.manage", "orders.create", "sales.view", "affiliates.view", "affiliates.manage", "catalog.manage", "store.manage", "growth.manage", "content.manage"] },
  { key: "support", name: "Support", color: "#10B981", description: "Handles customers: sees and updates orders, sends deliveries, handles leads. No revenue figures.", permissions: ["dashboard.view", "orders.view", "orders.manage", "orders.create", "affiliates.view", "growth.view"] },
  { key: "editor", name: "Content Editor", color: "#F59E0B", description: "Manages what's for sale and what the site says. No orders, customers or money.", permissions: ["dashboard.view", "catalog.manage", "store.manage", "content.manage", "growth.manage"] },
  { key: "analyst", name: "Analyst", color: "#64748B", description: "Read-only: revenue, sales report, analytics and orders. Can't change anything.", permissions: ["dashboard.view", "sales.view", "analytics.view", "orders.view"] },
];

// Which permission each admin page/section needs.
export const PAGE_PERMS = {
  "/admin": "dashboard.view",
  "/admin/orders": "orders.view",
  "/admin/sales": "sales.view",
  "/admin/analytics": "analytics.view",
  "/admin/affiliates": "affiliates.view",
  "/admin/payouts": "affiliates.view",
  "/admin/wallet-topups": "affiliates.view",
  "/admin/products": "store.view",
  "/admin/services": "store.view",
  "/admin/tools": "catalog.view",
  "/admin/tool-limits": "catalog.view",
  "/admin/categories": "catalog.view",
  "/admin/bundles": "catalog.view",
  "/admin/plans": "catalog.view",
  "/admin/free-offers": "growth.view",
  "/admin/smm-services": "growth.view",
  "/admin/smm-report": "growth.view",
  "/admin/prompts": "growth.view",
  "/admin/leads": "growth.view",
  "/admin/reviews": "content.view",
  "/admin/faqs": "content.view",
  "/admin/content": "content.view",
  "/admin/settings": "settings.view",
  "/admin/team": "team.view",
};
