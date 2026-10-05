// Admin-editable footer link columns (Admin -> Settings -> General -> Footer link columns).
// Stored as JSON in the "footerColumns" setting: [{ title, links: [{ label, href }] }]
export function getFooterColumns(s) {
  let cols;
  try { cols = JSON.parse(s.footerColumns || "[]"); } catch { cols = []; }
  if (!Array.isArray(cols)) cols = [];
  return cols
    .map((c) => ({
      title: String(c?.title || "").trim(),
      links: Array.isArray(c?.links)
        ? c.links
            .map((l) => ({ label: String(l?.label || "").trim(), href: String(l?.href || "").trim() }))
            .filter((l) => l.label && l.href)
        : [],
    }))
    .filter((c) => c.title && c.links.length > 0);
}
