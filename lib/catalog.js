// Shared by server and browser: no database access here, only parsing and price formatting for the
// digital products and services catalog.

export const PRODUCT_KINDS = ["Canva Template", "Social Media Kit", "Logo & Branding", "Landing Page", "UI Kit", "Presentation", "Print Design", "Other"];
export const SERVICE_KINDS = ["Graphic Design", "Landing Page Design", "Web Development", "Digital Marketing", "Social Media Management", "SEO", "Other"];

// The built-in international payment method. Like the wallet, it isn't admin-typed text: it skips the
// Transaction ID step, because the buyer pays later through a Payoneer request the admin sends.
export const PAYONEER_METHOD = "Payoneer";

// Orders in these states count as paid: downloads unlock, briefs can be sent.
export const PAID_STATES = ["PAID", "IN_PROGRESS", "COMPLETED", "DELIVERED"];

export const lines = (text) => String(text || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
export const images = (text) => lines(text).filter((u) => /^(https?:\/\/|\/)/i.test(u)).slice(0, 12);

export function parseJson(v, fallback) {
  if (v && typeof v === "object") return v;
  try { const x = JSON.parse(v || ""); return x ?? fallback; } catch { return fallback; }
}

const STORED_RE = /^[0-9]{10,16}-[a-z0-9]{6,12}\.[a-z0-9]{1,8}$/;
export const isStoredName = (s) => STORED_RE.test(String(s || ""));

// Private file references: [{ id, name, stored, size }]. Anything malformed is dropped, so a hand-edited
// value can never point outside the private storage folder.
export function parseFiles(v) {
  const list = parseJson(v, []);
  if (!Array.isArray(list)) return [];
  return list
    .filter((f) => f && isStoredName(f.stored) && f.id)
    .map((f) => ({ id: String(f.id).slice(0, 40), name: String(f.name || f.stored).slice(0, 160), stored: f.stored, size: Math.max(0, parseInt(f.size, 10) || 0) }))
    .slice(0, 40);
}

const num = (v, min = 0) => { const n = parseFloat(v); return Number.isFinite(n) && n >= min ? n : min; };
export const slugKey = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "pkg";

// Service packages, cleaned: at most 3, each with a unique key used in the basket.
export function parsePackages(v) {
  const list = parseJson(v, []);
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const out = [];
  for (const p of list.slice(0, 3)) {
    const name = String(p?.name || "").trim().slice(0, 40);
    const price = Math.round(num(p?.price));
    if (!name || !(price > 0)) continue;
    let key = slugKey(name);
    while (seen.has(key)) key += "-x";
    seen.add(key);
    out.push({
      key,
      name,
      price,
      priceUsd: Math.round(num(p?.priceUsd) * 100) / 100,
      days: Math.round(num(p?.days)) || null,
      revisions: String(p?.revisions ?? "").trim().slice(0, 20),
      features: (Array.isArray(p?.features) ? p.features : lines(p?.features)).map((f) => String(f).trim().slice(0, 120)).filter(Boolean).slice(0, 12),
    });
  }
  return out;
}

// Dollar price: the admin's own $ price when set, otherwise ৳ converted at the site rate (rounded up to
// the cent so a buyer never underpays). null when neither is available.
export function usdOf(priceUsd, taka, rate) {
  const own = parseFloat(priceUsd);
  if (own > 0) return Math.round(own * 100) / 100;
  const r = parseFloat(rate);
  if (!(r > 0) || !(taka > 0)) return null;
  return Math.ceil((taka / r) * 100) / 100;
}

export const fmtUsd = (n) => (n == null ? "" : `$${Number(n) % 1 === 0 ? Number(n).toLocaleString("en-US") : Number(n).toFixed(2)}`);
export const fmtTaka = (n) => `৳${Number(n || 0).toLocaleString()}`;
export const fmtSize = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : b >= 1024 ? `${Math.round(b / 1024)} KB` : `${b} B`);

// A service basket line id is "<serviceId>~<packageKey>", so the same service in two packages can sit
// in the basket side by side without the generic cart code knowing about packages.
export const serviceLineId = (serviceId, pkgKey) => `${serviceId}~${pkgKey}`;
export function splitServiceLineId(id) {
  const [serviceId = "", pkg = ""] = String(id || "").split("~");
  return { serviceId, pkg };
}
