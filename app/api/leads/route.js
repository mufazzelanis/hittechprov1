import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { limited } from "@/lib/rateLimit";
import { pushNotification } from "@/lib/notify";
import { identifyVisitor } from "@/lib/visits";

export const dynamic = "force-dynamic";

const clip = (v, n) => String(v ?? "").trim().slice(0, n);
const TYPES = ["affiliate", "tool-request", "custom-pack", "contact", "offer-notify", "soon-notify", "prompt-notify"];
const LABEL = {
  affiliate: "New affiliate application",
  "tool-request": "New tool request",
  "custom-pack": "Custom pack quote request",
  contact: "New contact message",
  "offer-notify": "Wants to know about Free Offers",
  "soon-notify": "Wants to know about a Coming soon product",
  "prompt-notify": "Wants to know about the AI Prompt Vault",
};

export async function POST(req) {
  const tooMany = limited(req, "leads", 10, 3600);
  if (tooMany) return tooMany;
  const b = await req.json().catch(() => ({}));
  const name = clip(b.name, 120);
  const email = clip(b.email, 160).toLowerCase();
  if (!name || !/^\S+@\S+\.\S+$/.test(email))
    return NextResponse.json({ error: "Please enter a valid name and email." }, { status: 400 });
  const type = TYPES.includes(b.type) ? b.type : "contact";
  await prisma.lead.create({
    data: {
      type,
      name,
      email,
      phone: clip(b.phone, 40) || null,
      message: clip(b.message, 1000) || null,
    },
  });
  pushNotification({ type: "lead", title: LABEL[type] || "New message", body: `${name} · ${email}`, href: `/admin/leads?q=${encodeURIComponent(email)}` }).catch(() => {});
  identifyVisitor(b.visitorId, { name, email, phone: clip(b.phone, 40) || null }).catch(() => {});
  return NextResponse.json({ ok: true });
}
