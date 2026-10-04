export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/apiHelpers";
import { smmServices } from "@/lib/smmiu";
import { getSettings } from "@/lib/settings";
import { guard } from "@/lib/adminAuth";

const deny = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

// Pulls the provider's current service catalog and upserts it by providerServiceId. Only
// provider-sourced fields (name/category/type/rate/min/max/refill/cancel) are ever touched here - an
// admin's own pricing (sellRate), visibility (active) and sort order are never overwritten by a sync,
// so re-syncing to pick up a price/min/max change never silently un-publishes or re-prices a live service.
// A brand-new service is created inactive with a suggested sellRate (provider cost x current USD rate x
// a modest markup) so nothing goes live for sale before the admin has reviewed it.
export async function POST() {
  { const g = await guard("growth.manage"); if (g.res) return g.res; }

  let list;
  try {
    list = await smmServices();
  } catch (e) {
    return NextResponse.json({ error: e.message || "Could not reach SMMIU" }, { status: 502 });
  }
  if (!Array.isArray(list)) return NextResponse.json({ error: "Unexpected response from SMMIU" }, { status: 502 });

  const s = await getSettings();
  const usdRate = parseFloat(s.usdRate) || 120;
  const MARKUP = 1.4; // suggested starting margin for brand-new services only

  // The catalog can easily run into the thousands of services - one query up front to know which ones
  // already exist, then upserts fired in small concurrent batches, keeps a full sync to a few seconds
  // instead of minutes of one-row-at-a-time round trips (which risks timing out on shared hosting).
  const existingIds = new Set((await prisma.smmService.findMany({ select: { providerServiceId: true } })).map((r) => r.providerServiceId));

  const items = list
    .map((row) => ({ ...row, providerServiceId: parseInt(row.service, 10) }))
    .filter((row) => row.providerServiceId);

  let created = 0;
  let updated = 0;
  const BATCH = 25;
  for (let i = 0; i < items.length; i += BATCH) {
    const slice = items.slice(i, i + BATCH);
    await Promise.all(
      slice.map(async (row) => {
        const providerRate = parseFloat(row.rate) || 0;
        const min = parseInt(row.min, 10) || 1;
        const max = parseInt(row.max, 10) || 1000;
        const isNew = !existingIds.has(row.providerServiceId);
        const suggested = Math.max(1, Math.round(providerRate * usdRate * MARKUP));
        await prisma.smmService.upsert({
          where: { providerServiceId: row.providerServiceId },
          update: { name: String(row.name || "").slice(0, 190), type: String(row.type || "Default").slice(0, 60), providerRate, min, max, refill: !!row.refill, cancel: !!row.cancel },
          create: {
            providerServiceId: row.providerServiceId,
            name: String(row.name || "").slice(0, 190),
            category: String(row.category || "Other").slice(0, 120),
            type: String(row.type || "Default").slice(0, 60),
            providerRate,
            sellRate: suggested,
            min,
            max,
            refill: !!row.refill,
            cancel: !!row.cancel,
            active: false,
          },
        });
        if (isNew) created++;
        else updated++;
      })
    );
  }

  return NextResponse.json({ ok: true, created, updated, total: items.length });
}
