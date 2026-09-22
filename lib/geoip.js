// Free, keyless IP -> city/country lookup (ip-api.com's free tier: ~45 req/min, no signup).
// Results are cached in memory per server process so a visitor's many page views only look up their
// IP once. A private/local IP or a failed/rate-limited lookup simply yields no location - it never
// blocks or fails the request that asked for it.
const cache = new Map(); // ip -> { data, exp }
const CACHE_MS = 6 * 3600 * 1000;
const MAX_CACHE = 5000;

const isPrivate = (ip) =>
  !ip || ip === "127.0.0.1" || ip === "::1" || /^10\./.test(ip) || /^192\.168\./.test(ip) || /^172\.(1[6-9]|2\d|3[01])\./.test(ip);

export async function geoLookup(ip) {
  if (isPrivate(ip)) return null;
  const hit = cache.get(ip);
  if (hit && hit.exp > Date.now()) return hit.data;
  try {
    const r = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,regionName,city`, { signal: AbortSignal.timeout(2500) });
    const j = await r.json();
    const data = j.status === "success" ? { country: j.country || null, region: j.regionName || null, city: j.city || null } : null;
    if (cache.size > MAX_CACHE) cache.clear();
    cache.set(ip, { data, exp: Date.now() + CACHE_MS });
    return data;
  } catch {
    return null;
  }
}
