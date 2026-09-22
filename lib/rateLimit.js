import { NextResponse } from "next/server";

// Small in-memory limiter (per server process). Enough to stop password guessing and form spam on a single
// Node server; behind several instances/serverless workers use a shared store (Redis) instead.
const hits = new Map();

function clientIp(req) {
  const h = req.headers;
  return (h.get("x-forwarded-for") || "").split(",")[0].trim() || h.get("x-real-ip") || "local";
}

// Returns a 429 response when `bucket` is over `max` requests per `windowSec` for this IP, else null.
export function limited(req, bucket, max, windowSec) {
  const now = Date.now();
  const key = bucket + ":" + clientIp(req);
  const list = (hits.get(key) || []).filter((t) => now - t < windowSec * 1000);
  if (list.length >= max) {
    hits.set(key, list);
    const wait = Math.ceil((windowSec * 1000 - (now - list[0])) / 1000);
    return NextResponse.json({ error: `Too many attempts. Please try again in ${wait > 90 ? Math.ceil(wait / 60) + " minutes" : wait + " seconds"}.` }, { status: 429, headers: { "Retry-After": String(wait) } });
  }
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.length || now - v[v.length - 1] > 3600e3) hits.delete(k);
  return null;
}
