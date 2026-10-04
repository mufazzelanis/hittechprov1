import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { usdOf, images, parsePackages } from "@/lib/catalog";
import { absUrl, siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

const x = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");
const plain = (t, n = 500) => String(t || "").replace(/^\s*[-•*]\s*/gm, "").replace(/\s+/g, " ").trim().slice(0, n);

// Pinterest product catalog (RSS 2.0 + Google product namespace). Add it once in Pinterest → Catalogs →
// Data source; Pinterest re-reads it daily, so new templates/services become shoppable pins on their own.
// Only items with a dollar price are listed (Pinterest needs a price + currency).
export async function GET() {
  const s = await getSettings();
  const base = siteUrl(s);
  const [products, services] = await Promise.all([
    prisma.product.findMany({ where: { active: true }, orderBy: { sort: "asc" } }),
    prisma.service.findMany({ where: { active: true }, orderBy: { sort: "asc" } }),
  ]);

  const items = [];
  for (const p of products) {
    const pics = [p.image, ...images(p.gallery)].filter(Boolean);
    const usd = usdOf(p.priceUsd, p.price, s.usdRate);
    if (!pics.length || !usd) continue;
    items.push({ id: `P-${p.id}`, title: p.name, desc: `${p.tagline ? p.tagline + ". " : ""}${plain(p.description)}`, link: `${base}/templates/${p.slug}`, pics, usd, type: `Templates > ${p.kind}` });
  }
  for (const v of services) {
    const pics = [v.image, ...images(v.gallery)].filter(Boolean);
    const pk = parsePackages(v.packages).map((p) => usdOf(p.priceUsd, p.price, s.usdRate)).filter(Boolean);
    if (!pics.length || !pk.length) continue;
    items.push({ id: `S-${v.id}`, title: v.name, desc: `${v.tagline ? v.tagline + ". " : ""}${plain(v.description)}`, link: `${base}/services/${v.slug}`, pics, usd: Math.min(...pk), type: `Services > ${v.kind}` });
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>${x(s.siteName)}</title>
<link>${x(base)}</link>
<description>${x(`Templates, designs and services from ${s.siteName}`)}</description>
${items.map((i) => `<item>
<g:id>${x(i.id)}</g:id>
<title>${x(i.title.slice(0, 150))}</title>
<description>${x(i.desc.slice(0, 500) || i.title)}</description>
<link>${x(i.link)}</link>
<g:image_link>${x(absUrl(s, i.pics[0]))}</g:image_link>
${i.pics.slice(1, 10).map((u) => `<g:additional_image_link>${x(absUrl(s, u))}</g:additional_image_link>`).join("\n")}
<g:price>${i.usd.toFixed(2)} USD</g:price>
<g:availability>in stock</g:availability>
<g:condition>new</g:condition>
<g:brand>${x(s.siteName)}</g:brand>
<g:product_type>${x(i.type)}</g:product_type>
</item>`).join("\n")}
</channel>
</rss>`;
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
