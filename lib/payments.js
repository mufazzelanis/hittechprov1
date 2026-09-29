// The one reserved payment method name that isn't admin-configured text: selecting it at checkout skips
// the Transaction ID step entirely and deducts straight from the signed-in customer's wallet balance
// instead (see lib/wallet.js and app/api/orders/route.js).
export const WALLET_METHOD = "Wallet Balance";

// Payment options and coupons are plain text in Admin -> Settings.
//   paymentOptions:  Name | Short description | Instructions shown to the buyer   (one per line)
//   coupons:         CODE | 10%  or  CODE | 100   (percent or flat ৳ off)          (one per line)

export function parseOff(json) {
  try { const a = JSON.parse(json || "[]"); return new Set(Array.isArray(a) ? a.map(String) : []); } catch { return new Set(); }
}

// Active methods only: ones switched off in Admin -> Settings -> Payments are hidden everywhere
// (checkout, footer, account) and rejected by the orders API.
export function getPaymentOptions(s) {
  let logos = {};
  try { logos = JSON.parse(s.paymentLogos || "{}") || {}; } catch {}
  const off = parseOff(s.paymentOff);
  return String(s.paymentOptions || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [name = "", desc = "", ...rest] = l.split("|");
      return { name: name.trim(), logo: logos[name.trim()] || "", desc: desc.trim(), instructions: rest.join("|").trim() || s.paymentInstructions };
    })
    .filter((o) => o.name && !off.has(o.name));
}

export function parseCoupons(text) {
  const out = [];
  for (const l of String(text || "").split(/\r?\n/)) {
    const [code = "", val = "", ...note] = l.trim().split("|");
    const v = val.trim();
    const value = parseFloat(v);
    if (!code.trim() || !(value > 0)) continue;
    out.push({ code: code.trim().toUpperCase(), pct: v.endsWith("%"), value, note: note.join("|").trim() });
  }
  return out;
}

export function applyCoupon(text, code, subtotal) {
  const c = parseCoupons(text).find((x) => x.code === String(code || "").trim().toUpperCase());
  if (!c) return null;
  const discount = c.pct ? Math.floor((subtotal * Math.min(c.value, 100)) / 100) : Math.min(Math.floor(c.value), subtotal);
  return { code: c.code, discount, label: c.pct ? `${c.value}% off` : `৳${c.value} off` };
}

// Dollar amount for a ৳ total at the admin's rate (৳ per 1 USD), rounded up so a buyer never underpays.
// Returns null when no valid rate is set.
export function toUsd(taka, rate) {
  const r = parseFloat(rate);
  if (!(r > 0) || !(taka > 0)) return null;
  return Math.ceil((taka / r) * 100) / 100;
}
