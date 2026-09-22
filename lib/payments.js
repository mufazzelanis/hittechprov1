// Payment options and coupons are plain text in Admin -> Settings.
//   paymentOptions:  Name | Short description | Instructions shown to the buyer   (one per line)
//   coupons:         CODE | 10%  or  CODE | 100   (percent or flat ৳ off)          (one per line)

export function getPaymentOptions(s) {
  let logos = {};
  try { logos = JSON.parse(s.paymentLogos || "{}") || {}; } catch {}
  return String(s.paymentOptions || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [name = "", desc = "", ...rest] = l.split("|");
      return { name: name.trim(), logo: logos[name.trim()] || "", desc: desc.trim(), instructions: rest.join("|").trim() || s.paymentInstructions };
    })
    .filter((o) => o.name);
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
