import { prisma } from "./db";

// Per-tool status + limits. Stored in the Setting table under "toolinfo:<toolId>" (JSON), so no schema change is needed.
export const LIMIT_STATUSES = ["active", "limited", "maintenance", "down"];
export const ACCESS_TYPES = ["", "Private", "Shared"];
const PREFIX = "toolinfo:";

export function normalizeInfo(j = {}) {
  return {
    status: LIMIT_STATUSES.includes(j.status) ? j.status : "active",
    limit: String(j.limit || "").slice(0, 200),
    access: ACCESS_TYPES.includes(j.access) ? j.access : "",
    note: String(j.note || "").slice(0, 300),
    // "Coming soon / stock out": the product stays visible but cannot be bought (admin switch)
    soon: j.soon === true || j.soon === "true",
    updated: j.updated || null,
  };
}

export const infoKey = (toolId) => PREFIX + toolId;

// Turn "Coming soon" on/off for one product, keeping its other tool-limit info.
export async function setSoon(toolId, on) {
  const key = infoKey(toolId);
  const row = await prisma.setting.findUnique({ where: { key } });
  let base = {};
  try { base = row ? JSON.parse(row.value) : {}; } catch {}
  const value = JSON.stringify({ ...normalizeInfo(base), soon: !!on, updated: new Date().toISOString() });
  await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
}

export async function getToolInfo() {
  const map = {};
  try {
    const rows = await prisma.setting.findMany({ where: { key: { startsWith: PREFIX } } });
    for (const r of rows) {
      try {
        map[r.key.slice(PREFIX.length)] = normalizeInfo(JSON.parse(r.value));
      } catch {}
    }
  } catch {}
  return map;
}

export function statusLabels(s) {
  return { active: s.limitsLabelActive, limited: s.limitsLabelLimited, maintenance: s.limitsLabelMaintenance, down: s.limitsLabelDown };
}
