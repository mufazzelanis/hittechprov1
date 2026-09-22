import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getOffers, normalizeOffer, offerKey } from "@/lib/offers";

export const dynamic = "force-dynamic";

const deny = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });
const save = (id, data, created) =>
  prisma.setting.upsert({
    where: { key: offerKey(id) },
    update: { value: JSON.stringify({ ...data, created }) },
    create: { key: offerKey(id), value: JSON.stringify({ ...data, created }) },
  });

export async function GET() {
  if (!getSession()) return deny();
  return NextResponse.json({ offers: await getOffers() });
}

export async function POST(req) {
  if (!getSession()) return deny();
  const data = normalizeOffer(await req.json().catch(() => ({})));
  if (!data.name) return NextResponse.json({ error: "Offer name is required" }, { status: 400 });
  const id = "o" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  await save(id, data, new Date().toISOString());
  return NextResponse.json({ ok: true, id });
}

export async function PUT(req) {
  if (!getSession()) return deny();
  const b = await req.json().catch(() => ({}));
  const id = String(b.id || "");
  const row = id ? await prisma.setting.findUnique({ where: { key: offerKey(id) } }) : null;
  if (!row) return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  const prev = JSON.parse(row.value);
  const data = normalizeOffer({ ...prev, ...b });
  if (!data.name) return NextResponse.json({ error: "Offer name is required" }, { status: 400 });
  await save(id, data, prev.created);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  if (!getSession()) return deny();
  const id = new URL(req.url).searchParams.get("id") || "";
  await prisma.setting.deleteMany({ where: { key: offerKey(id) } });
  return NextResponse.json({ ok: true });
}
