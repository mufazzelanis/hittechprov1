// SEO helpers shared by layout, pages, sitemap and robots.
export function siteUrl(s) {
  let u = String(s?.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://hittechpro.net").trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  return u;
}

export const absUrl = (s, p) => (/^https?:\/\//i.test(p) ? p : siteUrl(s) + (p.startsWith("/") ? p : "/" + p));

export const clipText = (t, n = 155) => {
  const x = String(t || "").replace(/\s+/g, " ").trim();
  return x.length <= n ? x : x.slice(0, n - 1).replace(/\s+\S*$/, "") + "…";
};

export const httpLinks = (...list) => list.map((x) => String(x || "").trim()).filter((x) => /^https?:\/\//i.test(x));

// Share image: the one uploaded in Admin, otherwise the built-in logo card (app/opengraph-image.png).
export const ogFallback = (s) => absUrl(s, (s?.ogImage || "").trim() || "/opengraph-image.png");
