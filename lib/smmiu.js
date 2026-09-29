// Thin client for the SMMIU reseller API (https://my.smmiu.com/api/v2) - a standard "Perfect Panel"
// style API also used by most other SMM panels, so swapping providers later mostly means changing the
// base URL and key. One POST per call, `key` + `action` always required, JSON in and out.
const BASE_URL = "https://my.smmiu.com/api/v2";

async function call(params) {
  const key = process.env.SMMIU_API_KEY;
  if (!key) throw new Error("SMMIU_API_KEY is not configured");
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

// { balance, currency }
export const smmBalance = () => call({ action: "balance" });

export const smmRefill = (orderId) => call({ action: "refill", order: String(orderId) });
export const smmRefillStatus = (refillId) => call({ action: "refill_status", refill: String(refillId) });
export const smmCancel = (orderIds) => call({ action: "cancel", orders: orderIds.join(",") });
