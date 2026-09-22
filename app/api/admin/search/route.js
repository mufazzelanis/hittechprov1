import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { CONTENT_DEFAULTS } from "@/lib/content";
import { CONTENT_PAGES } from "@/lib/content";

export const dynamic = "force-dynamic";

const has = (f, q) => ({ [f]: { contains: q } });
const orAll = (fields, q) => ({ OR: fields.map((f) => has(f, q)) });
const money = (n) => "৳" + Number(n).toLocaleString("en-US");
const PAGE_OF = Object.fromEntries(CONTENT_PAGES.flatMap((p) => p.groups.flatMap((g) => g.fields.map((f) => [f[0], { page: p.id, label: f[1], where: `${p.label} › ${g.title}` }]))));
const SECRET = new Set(["coupons", "fbCapiToken"]);

// GET ?q=...  -> records matching in the database (admin only). Static pages/settings are searched in the browser.
export async function GET(req) {
  if (!getSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const q = (new URL(req.url).searchParams.get("q") || "").trim().slice(0, 80);
  if (q.length < 1) return NextResponse.json({ results: [] });
  const num = /^#?\d{1,9}$/.test(q) ? parseInt(q.replace("#", ""), 10) : null;
  const short = q.length < 2 && num === null;
  if (short) return NextResponse.json({ results: [] });
  const N = 6;

  const [tools, bundles, plans, cats, orders, leads, people, faqs, reviews, prompts, offers, texts] = await Promise.all([
    prisma.tool.findMany({ where: orAll(["name", "slug", "description"], q), take: N, include: { category: true }, orderBy: { name: "asc" } }),
    prisma.bundle.findMany({ where: orAll(["name", "tagline", "tools"], q), take: N }),
    prisma.packPlan.findMany({ where: orAll(["name", "tagline"], q), take: N }),
    prisma.category.findMany({ where: has("name", q), take: N }),
    prisma.order.findMany({ where: { OR: [...["name", "email", "phone", "itemName", "txnId", "refCode"].map((f) => has(f, q)), ...(num !== null ? [{ number: num }] : [])] }, take: 8, orderBy: { createdAt: "desc" } }),
    prisma.lead.findMany({ where: orAll(["name", "email", "message", "phone"], q), take: N, orderBy: { createdAt: "desc" } }),
    prisma.user.findMany({ where: { role: { not: "ADMIN" }, ...orAll(["name", "email", "phone", "refCode"], q) }, take: N, orderBy: { createdAt: "desc" } }),
    prisma.faq.findMany({ where: orAll(["question", "answer"], q), take: 4 }),
    prisma.review.findMany({ where: orAll(["name", "text"], q), take: 4 }),
    prisma.prompt ? prisma.prompt.findMany({ where: orAll(["title", "category", "tags", "promptText"], q), take: N }).catch(() => []) : [],
    prisma.setting.findMany({ where: { key: { startsWith: "freeoffer:" }, value: { contains: q } }, take: 4 }),
    prisma.setting.findMany({ where: { value: { contains: q }, key: { in: Object.keys(CONTENT_DEFAULTS) } }, take: 8 }),
  ]);

  const r = [];
  for (const t of tools) r.push({ id: "tool:" + t.id, type: "product", kind: "Tool", title: t.name, sub: `${money(t.price)} / ${t.duration}${t.category ? " · " + t.category.name : ""}${t.active ? "" : " · hidden"}`, href: `/admin/tools?edit=${t.id}` });
  for (const b of bundles) r.push({ id: "bundle:" + b.id, type: "product", kind: "Bundle", title: b.name, sub: `${money(b.price)}/month · ${b.tagline}`, href: `/admin/bundles?edit=${b.id}` });
  for (const p of plans) r.push({ id: "plan:" + p.id, type: "product", kind: "Custom pack", title: p.name, sub: `${money(p.price)}/month · ${p.tagline}`, href: `/admin/plans?edit=${p.id}` });
  for (const c of cats) r.push({ id: "cat:" + c.id, type: "product", kind: "Category", title: c.name, sub: "Category", href: `/admin/categories?edit=${c.id}` });
  for (const o of orders) r.push({ id: "order:" + o.id, type: "order", kind: o.status, title: `Order #${o.number} · ${o.name}`, sub: `${money(o.amount)} · ${o.itemName}${o.email ? " · " + o.email : ""}`, href: `/admin/orders?q=${o.number}` });
  for (const p of people) r.push({ id: "user:" + p.id, type: "person", kind: p.refCode ? "Affiliate" : "Customer", title: p.name, sub: `${p.email}${p.phone ? " · " + p.phone : ""}`, href: p.refCode ? "/admin/affiliates" : `/admin/orders?q=${encodeURIComponent(p.email)}` });
  for (const l of leads) r.push({ id: "lead:" + l.id, type: "lead", kind: l.type, title: `${l.name} · ${l.email}`, sub: (l.message || "").slice(0, 90) || "No message", href: `/admin/leads?q=${encodeURIComponent(l.email)}` });
  for (const f of faqs) r.push({ id: "faq:" + f.id, type: "content", kind: "FAQ", title: f.question, sub: f.answer.slice(0, 90), href: `/admin/faqs?edit=${f.id}` });
  for (const v of reviews) r.push({ id: "review:" + v.id, type: "content", kind: "Review", title: v.name, sub: v.text.slice(0, 90), href: `/admin/reviews?edit=${v.id}` });
  for (const p of prompts) r.push({ id: "prompt:" + p.id, type: "content", kind: "AI prompt", title: p.title, sub: `${p.category || "Uncategorised"}${p.active ? "" : " · hidden"}`, href: `/admin/prompts?edit=${p.id}` });
  for (const o of offers) { try { const j = JSON.parse(o.value); r.push({ id: "offer:" + o.key, type: "content", kind: "Free offer", title: j.name || "Free offer", sub: (j.desc || "").slice(0, 90), href: "/admin/free-offers" }); } catch {} }
  for (const t of texts) { if (SECRET.has(t.key)) continue; const m = PAGE_OF[t.key]; if (m) r.push({ id: "textval:" + t.key, type: "text", kind: "Your text", title: m.label, sub: `${m.where} · “${t.value.slice(0, 70)}”`, href: `/admin/content?page=${m.page}&focus=${t.key}` }); }

  return NextResponse.json({ results: r });
}
