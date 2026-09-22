// Static search index for the admin global search: pages, settings, page texts and quick actions.
// (Records such as tools and orders are searched on the server by /api/admin/search.)
import { NAV, RESOURCES } from "./resources";
import { CONTENT_PAGES } from "./content";
import { SETTINGS_TABS } from "./settingsSchema";

export const TYPES = {
  action: "Actions",
  page: "Pages",
  setting: "Settings",
  text: "Website text",
  product: "Products",
  order: "Orders",
  person: "People",
  lead: "Leads",
  content: "Content",
};

const NAV_WORDS = {
  "/admin": "home overview stats revenue chart",
  "/admin/orders": "orders sales customers payments transactions status paid pending delivered refund",
  "/admin/sales": "sales report revenue income earning export excel csv daily today yesterday month",
  "/admin/analytics": "analytics visitors traffic activity ip location device browser country online now who visited",
  "/admin/affiliates": "affiliate referral partners commission",
  "/admin/payouts": "payout withdraw commission paid",
  "/admin/free-offers": "free offers giveaway telegram whatsapp join claim",
  "/admin/prompts": "ai prompt vault chatgpt midjourney library prompts",
  "/admin/leads": "leads enquiries requests contact messages notify",
  "/admin/tools": "products tools catalogue price cover coming soon stock",
  "/admin/tool-limits": "limits status maintenance down active limited access private shared coming soon",
  "/admin/categories": "categories tags groups",
  "/admin/bundles": "bundles packs combo packages",
  "/admin/plans": "custom packs plans quote",
  "/admin/reviews": "reviews testimonials facebook trustpilot ratings",
  "/admin/faqs": "faq questions answers help",
  "/admin/content": "page content text headings buttons copy wording translate",
  "/admin/settings": "settings configuration site options",
};

const pages = NAV.map((n) => ({ id: "page:" + n.href, type: "page", title: n.label, sub: "Admin page", href: n.href, words: NAV_WORDS[n.href] || "" }));

const settings = [];
for (const tab of SETTINGS_TABS)
  for (const b of tab.blocks) {
    for (const f of b.fields || []) settings.push({ id: "setting:" + f.key, type: "setting", title: f.label, sub: `Settings › ${tab.label}${b.title ? " › " + b.title : ""}`, href: `/admin/settings?tab=${tab.id}&focus=${f.key}`, words: `${f.key} ${f.hintText || ""}` });
    if (b.master) settings.push({ id: "setting:" + b.master, type: "setting", title: `${b.title}: turn on / off`, sub: `Settings › ${tab.label}`, href: `/admin/settings?tab=${tab.id}`, words: "switch toggle enable disable" });
  }
settings.push(
  { id: "setting:payments", type: "setting", title: "Payment methods and logos", sub: "Settings › Payments", href: "/admin/settings?tab=payments", words: "bkash nagad rocket bank crypto usdt logo instructions number" },
  { id: "setting:coupons", type: "setting", title: "Coupons and discount codes", sub: "Settings › Payments", href: "/admin/settings?tab=payments", words: "coupon discount promo code percent" },
  { id: "setting:password", type: "setting", title: "Change admin password", sub: "Settings › Security", href: "/admin/settings?tab=security", words: "password security login" },
  { id: "setting:backup", type: "setting", title: "Backup and restore settings", sub: "Settings › Security", href: "/admin/settings?tab=security", words: "export import json download upload" },
);

const texts = [];
for (const pg of CONTENT_PAGES)
  for (const g of pg.groups)
    for (const [key, label, def] of g.fields) texts.push({ id: "text:" + key, type: "text", title: label, sub: `${pg.label} › ${g.title}`, href: `/admin/content?page=${pg.id}&focus=${key}`, words: `${key} ${String(def).slice(0, 160)}` });

const actions = [
  { id: "act:new-tool", type: "action", title: "Add a new tool", sub: "Tools", href: "/admin/tools?new=1", words: "create product" },
  { id: "act:new-bundle", type: "action", title: "Add a new bundle", sub: "Bundles", href: "/admin/bundles?new=1", words: "create pack combo" },
  { id: "act:new-plan", type: "action", title: "Add a custom pack plan", sub: "Custom Packs", href: "/admin/plans?new=1", words: "create" },
  { id: "act:new-cat", type: "action", title: "Add a category", sub: "Categories", href: "/admin/categories?new=1", words: "create tag" },
  { id: "act:new-faq", type: "action", title: "Add a FAQ", sub: "FAQs", href: "/admin/faqs?new=1", words: "create question" },
  { id: "act:new-review", type: "action", title: "Add a review", sub: "Reviews", href: "/admin/reviews?new=1", words: "create testimonial" },
  { id: "act:new-prompt", type: "action", title: "Add an AI prompt", sub: "AI Prompt Vault", href: "/admin/prompts?new=1", words: "create chatgpt midjourney" },
  { id: "act:pending", type: "action", title: "Show pending orders", sub: "Orders", href: "/admin/orders?status=PENDING", words: "need action unpaid waiting" },
  { id: "act:paid", type: "action", title: "Show paid and delivered orders", sub: "Orders", href: "/admin/orders?status=PAID,DELIVERED", words: "completed sold" },
  { id: "act:sales-today", type: "action", title: "Today's sales", sub: "Sales Report", href: "/admin/sales?preset=today", words: "revenue income" },
  { id: "act:sales-yesterday", type: "action", title: "Yesterday's sales", sub: "Sales Report", href: "/admin/sales?preset=yesterday", words: "revenue previous day" },
  { id: "act:sales-month", type: "action", title: "This month's sales", sub: "Sales Report", href: "/admin/sales?preset=month", words: "revenue monthly" },
  { id: "act:sales-export", type: "action", title: "Export sales to Excel", sub: "Sales Report", href: "/admin/sales", words: "download xlsx csv spreadsheet" },
  { id: "act:online-now", type: "action", title: "Who's online right now", sub: "Analytics", href: "/admin/analytics", words: "live visitors active" },
  { id: "act:soon", type: "action", title: "Manage Coming soon products", sub: "Tool Limits", href: "/admin/tool-limits", words: "stock out unavailable" },
  { id: "act:site", type: "action", title: "View the website", sub: "Opens in a new tab", href: "/", external: true, words: "open public live" },
  { id: "act:logout", type: "action", title: "Log out", sub: "End this session", href: "#logout", words: "sign out exit" },
];

export const STATIC_INDEX = [...actions, ...pages, ...settings, ...texts];

// ---- scoring: every typed word must be found; earlier and word-start matches rank higher
const norm = (s) => String(s).toLowerCase();
export function scoreItem(item, terms) {
  const title = norm(item.title), words = norm(item.words || ""), sub = norm(item.sub || "");
  let total = 0;
  for (const t of terms) {
    let s = 0;
    const i = title.indexOf(t);
    if (i === 0) s = 100;
    else if (i > 0) s = title[i - 1] === " " || title[i - 1] === "(" || title[i - 1] === "'" ? 80 : 55;
    else if (words.includes(t)) s = 35;
    else if (sub.includes(t)) s = 22;
    else return 0;
    total += s;
  }
  if (title === terms.join(" ")) total += 60;
  return total;
}

export function searchStatic(q, allow) {
  const terms = norm(q).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return STATIC_INDEX.filter((i) => !allow || allow.includes(i.type))
    .map((i) => ({ i, s: scoreItem(i, terms) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.i.title.length - b.i.title.length)
    .map((x) => ({ ...x.i, score: x.s }));
}

// pages people open most: shown before anything is typed
export const SUGGESTED = ["act:sales-today", "act:new-tool", "act:pending", "page:/admin/settings", "page:/admin/content", "act:sales-export"].map((id) => STATIC_INDEX.find((x) => x.id === id)).filter(Boolean);
export { RESOURCES };
