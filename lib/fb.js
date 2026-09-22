// Facebook Conversions API (server side). Never import this from client components: it uses the secret access token.
import crypto from "crypto";
import { prisma } from "./db";
import { getSettings } from "./settings";

const sha = (v) => crypto.createHash("sha256").update(String(v).trim().toLowerCase()).digest("hex");

// Bangladesh-friendly phone normalisation -> digits with country code (Meta hashes digits only).
export function normPhone(p) {
  let d = String(p || "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = "88" + d;
  else if (d.length === 10 && d.startsWith("1")) d = "880" + d;
  return d;
}

// Browser hints Meta uses for matching (cookies set by the Pixel) + connection info.
export function reqContext(req) {
  const h = req.headers;
  const cookie = h.get("cookie") || "";
  const get = (n) => (cookie.match(new RegExp("(?:^|; )" + n + "=([^;]*)")) || [])[1];
  return {
    ip: (h.get("x-forwarded-for") || "").split(",")[0].trim() || h.get("x-real-ip") || "",
    ua: h.get("user-agent") || "",
    fbp: get("_fbp") || "",
    fbc: get("_fbc") || "",
  };
}

function clean(o) {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && !v.length)));
}

export function userData({ name, email, phone, externalId }, ctx = {}) {
  const [fn, ...rest] = String(name || "").trim().split(/\s+/);
  const ph = normPhone(phone);
  return clean({
    em: email ? [sha(email)] : undefined,
    ph: ph ? [sha(ph)] : undefined,
    fn: fn ? [sha(fn)] : undefined,
    ln: rest.length ? [sha(rest.join(" "))] : undefined,
    external_id: externalId ? [sha(externalId)] : undefined,
    client_ip_address: ctx.ip,
    client_user_agent: ctx.ua,
    fbp: ctx.fbp,
    fbc: ctx.fbc,
  });
}

export function purchaseEvent({ order, ctx = {}, url, source = "website" }) {
  return clean({
    event_name: "Purchase",
    event_time: Math.floor(Date.now() / 1000),
    event_id: `purchase-${order.id}`,
    event_source_url: url,
    action_source: source,
    user_data: userData({ name: order.name, email: order.email, phone: order.phone, externalId: order.userId }, ctx),
    custom_data: { currency: "BDT", value: order.amount, content_type: "product", content_name: order.itemName, order_id: String(order.number) },
  });
}

export async function sendCapi(s, events) {
  if (!s.fbPixelId || !s.fbCapiToken || !events.length) return { skipped: true };
  const body = { data: events };
  const GRAPH = process.env.FB_GRAPH_URL || "https://graph.facebook.com";
  if (s.fbTestCode) body.test_event_code = s.fbTestCode;
  try {
    const r = await fetch(`${GRAPH}/v19.0/${encodeURIComponent(s.fbPixelId)}/events?access_token=${encodeURIComponent(s.fbCapiToken)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
    return { ok: r.ok, status: r.status };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}

// "Purchase when I confirm payment" mode: called whenever an order's status is saved in admin.
// Sends once per order (remembered in the Setting table), never throws.
export async function capiOnPaid(order) {
  try {
    if (!["PAID", "DELIVERED"].includes(order.status)) return;
    const s = await getSettings({ withSecrets: true });
    if (!s.fbPixelId || !s.fbCapiToken || s.fbPurchaseMode !== "paid") return;
    const flag = `fbsent:${order.id}`;
    if (await prisma.setting.findUnique({ where: { key: flag } })) return;
    const raw = await prisma.setting.findUnique({ where: { key: `orderfb:${order.id}` } });
    const c = raw ? JSON.parse(raw.value) : null;
    const r = await sendCapi(s, [purchaseEvent({ order, ctx: c || {}, url: c?.url, source: c ? "website" : "phone_call" })]);
    if (r.ok) await prisma.setting.upsert({ where: { key: flag }, update: { value: "1" }, create: { key: flag, value: "1" } });
  } catch {}
}
