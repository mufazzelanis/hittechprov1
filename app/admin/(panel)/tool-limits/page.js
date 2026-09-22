import { prisma } from "@/lib/db";
import { getToolInfo, normalizeInfo } from "@/lib/limits";
import ToolLimitsManager from "@/components/admin/ToolLimitsManager";

export const dynamic = "force-dynamic";

export default async function ToolLimitsPage() {
  const [tools, bundles, plans, info] = await Promise.all([
    prisma.tool.findMany({ include: { category: true }, orderBy: [{ sort: "asc" }, { createdAt: "desc" }] }),
    prisma.bundle.findMany({ orderBy: { sort: "asc" } }),
    prisma.packPlan.findMany({ orderBy: { sort: "asc" } }),
    getToolInfo(),
  ]);
  const rows = [
    ...tools.map((t) => ({ kind: "tool", id: t.id, name: t.name, category: t.category?.name || "", active: t.active, ...normalizeInfo(info[t.id]) })),
    ...bundles.map((b) => ({ kind: "bundle", id: b.id, name: b.name, category: "Bundle", active: b.active, ...normalizeInfo(info[b.id]) })),
    ...plans.map((p) => ({ kind: "plan", id: p.id, name: p.name, category: "Custom pack", active: p.active, ...normalizeInfo(info[p.id]) })),
  ];
  return <ToolLimitsManager initial={rows} />;
}
