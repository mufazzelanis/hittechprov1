import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, getResource, buildData, missingRequired, slugify } from "@/lib/apiHelpers";
import { getToolInfo, setSoon } from "@/lib/limits";

export const dynamic = "force-dynamic";

const deny = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function GET(req, { params }) {
  if (!requireAdmin()) return deny();
  const res = getResource(params.resource);
  if (!res) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const status = url.searchParams.get("status");
  const where = {};
  if (q) {
    where.OR = res.search.map((k) => ({ [k]: { contains: q } }));
    if (res.model === "order" && /^#?\d{1,9}$/.test(q)) where.OR.push({ number: parseInt(q.replace("#", ""), 10) });
  }
  const sf = res.fields.find((f) => f.key === "status");
  if (status && sf) {
    const wanted = status.split(",").filter((x) => sf.options.includes(x));
    if (wanted.length) where.status = wanted.length === 1 ? wanted[0] : { in: wanted };
  }

  const rows = await prisma[res.model].findMany({
    where,
    orderBy: res.orderBy,
    include: res.include,
    take: 500,
  });
  if (res.fields.some((f) => f.type === "soon")) {
    const info = await getToolInfo();
    for (const r of rows) r.soon = !!info[r.id]?.soon;
  }
  return NextResponse.json({ rows });
}

export async function POST(req, { params }) {
  if (!requireAdmin()) return deny();
  const res = getResource(params.resource);
  if (!res || res.noCreate) return NextResponse.json({ error: "Not allowed" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const data = buildData(res, body);
  const miss = missingRequired(res, data);
  if (miss) return NextResponse.json({ error: `${miss} is required` }, { status: 400 });

  if (res.slugFrom) data.slug = slugify(data[res.slugFrom]);
  try {
    const row = await prisma[res.model].create({ data });
    if (body.soon === true) await setSoon(row.id, true);
    return NextResponse.json({ row });
  } catch (e) {
    if (e.code === "P2002" && data.slug) {
      data.slug += "-" + Math.random().toString(36).slice(2, 6);
      const row = await prisma[res.model].create({ data });
      return NextResponse.json({ row });
    }
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }
}
