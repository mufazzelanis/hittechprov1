// Thin client for the SMMIU reseller API (https://my.smmiu.com/api/v2) - a standard "Perfect Panel"
// style API also used by most other SMM panels, so swapping providers later mostly means changing the
// base URL and key. One POST per call, `key` + `action` always required, JSON in and out.
import { getSettings } from "./settings";

const BASE_URL = "https://my.smmiu.com/api/v2";

// Admin -> SMM Services holds the key in the database (takes effect immediately, no restart) - the
// SMMIU_API_KEY env var is only a fallback. Trimmed defensively: a stray trailing space/newline from
// copy-pasting the key is a common cause of an otherwise-inexplicable 401.
export async function smmiuKey() {
  const s = await getSettings({ withSecrets: true });
  return (s.smmiuApiKey || process.env.SMMIU_API_KEY || "").trim();
}

async function call(params, keyOverride) {
  const key = keyOverride != null ? String(keyOverride).trim() : await smmiuKey();
  if (!key) throw new Error("SMMIU API key is not configured");
  const body = new URLSearchParams({ key, ...params });
  const r = await fetch(BASE_URL, { method: "POST", body, signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`SMMIU API responded ${r.status}`);
  const data = await r.json();
  if (data?.error) throw new Error(data.error);
  return data;
}

// [{ service, name, type, category, rate, min, max, refill, cancel }, ...]
export const smmServices = () => call({ action: "services" });

// { order: 23501 }
export const smmAddOrder = ({ service, link, quantity }) =>
  call({ action: "add", service: String(service), link: String(link), quantity: String(quantity) });

// { charge, start_count, status, remains, currency }
export const smmOrderStatus = (orderId) => call({ action: "status", order: String(orderId) });

// { "<id>": { charge, start_count, status, remains, currency } | { error }, ... } for up to 100 ids
export const smmMultiStatus = (orderIds) => call({ action: "status", orders: orderIds.join(",") });

// { balance, currency }. Pass `keyOverride` to test a key before saving it (Admin -> SMM Services).
export const smmBalance = (keyOverride) => call({ action: "balance" }, keyOverride);

export const smmRefill = (orderId) => call({ action: "refill", order: String(orderId) });
export const smmRefillStatus = (refillId) => call({ action: "refill_status", refill: String(refillId) });
export const smmCancel = (orderIds) => call({ action: "cancel", orders: orderIds.join(",") });
