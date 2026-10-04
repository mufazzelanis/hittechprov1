import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getSession } from "@/lib/auth";
import { guard } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

const TYPES = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif", "image/svg+xml": "svg" };

export async function POST(req) {
  { const g = await guard(["catalog.manage","store.manage","content.manage","growth.manage","settings.manage"]); if (g.res) return g.res; }
  const form = await req.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") return NextResponse.json({ error: "No file" }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ error: "Only PNG, JPG, WEBP, GIF or SVG images" }, { status: 400 });
  if (file.size > 3 * 1024 * 1024) return NextResponse.json({ error: "Max 3MB" }, { status: 400 });

  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ url: `/uploads/${name}` });
}
