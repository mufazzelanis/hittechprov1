import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getToolInfo } from "@/lib/limits";
import { limited } from "@/lib/rateLimit";
import { SALES_POP_PEOPLE, SALES_POP_TIME_LABELS, pickRandom } from "@/lib/salesPopNames";

export const dynamic = "force-dynamic";

// Public: one fresh "someone just bought this" suggestion for the TrustPop widget. Picked server-side so
// the client never has to ship the tool catalogue or view-count logic - each call is cheap and self-contained.
// The pool is weighted towards tools that are actually getting attention (real page-view counts from the
// last 7 days, via the same Visit data the Analytics dashboard uses) plus featured tools, so the popup
// tends to point at what's genuinely popular rather than a flat random pick.
export async function GET(req) {
  const tooMany = limited(req, "sales-pop", 40, 60);
  if (tooMany) return tooMany;

  const s = await getSettings();
  if (s.salesPopOn === "false") return NextResponse.json({ show: false });

  const [tools, infoMap, viewRows] = await Promise.all([
    prisma.tool.findMany({ where: { active: true }, select: { id: true, name: true, slug: true, image: true, accent: true, featured: true } }),
    getToolInfo(),
    prisma.visit
      .groupBy({
        by: ["path"],
        where: { path: { startsWith: "/tool/" }, createdAt: { gte: new Date(Date.now() - 7 * 864e5) } },
        _count: { _all: true },
        orderBy: { _count: { _all: "desc" } },
        take: 20,
      })
      .catch(() => []),
  ]);

  // Never suggest a tool that cannot actually be bought right now.
  const buyable = tools.filter((t) => {
    const info = infoMap[t.id];
    if (!info) return true;
    if (info.soon) return false;
    if (info.status === "down" || info.status === "maintenance") return false;
    return true;
  });
  if (!buyable.length) return NextResponse.json({ show: false });

  const views = {};
  for (const row of viewRows) {
    const slug = row.path.slice("/tool/".length).split("/")[0];
    views[slug] = row._count._all;
  }

  const pool = [];
  for (const t of buyable) {
    let weight = 3;
    if (t.featured) weight += 3;
    weight += Math.min(6, Math.round((views[t.slug] || 0) / 3));
    for (let i = 0; i < weight; i++) pool.push(t);
  }

  const tool = pickRandom(pool);
  const person = pickRandom(SALES_POP_PEOPLE);

  return NextResponse.json({
    show: true,
    name: person.name,
    city: person.city,
    timeLabel: pickRandom(SALES_POP_TIME_LABELS),
    tool: { name: tool.name, slug: tool.slug, image: tool.image, accent: tool.accent },
  });
}
