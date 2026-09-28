import crypto from "crypto";
import { prisma } from "./db";

const hashOf = (s) => crypto.createHash("sha256").update(s).digest("hex");
const MAX_LEN = 4800; // stays comfortably under the free endpoint's per-request limit

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// Circuit breaker: if the free endpoint is down or rate-limiting this server outright (not just one
// flaky string), retrying every single string in the page for minutes just makes the toggle look
// permanently stuck. After a few consecutive failures, stop calling Google for a cooldown window and
// fall back to the original English text immediately - the whole page then resolves in a couple of
// seconds instead of minutes, and it starts trying Google again on its own once the cooldown passes.
const CIRCUIT_TRIP_THRESHOLD = 4;
const CIRCUIT_COOLDOWN_MS = 45_000;
let consecutiveFailures = 0;
let circuitOpenUntil = 0;

// Free, keyless Google Translate endpoint (the same one many "auto-translate my site" tools use). No
// API key, no cost - the trade-off is it's unofficial and, under concurrent load, occasionally flakes
// on an individual request even while its neighbours in the same batch succeed. Retried once with
// backoff before giving up, so a page never ends up half-translated because of one bad request.
async function callGoogleTranslate(text, target, attempt = 1) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${target}&dt=t&q=${encodeURIComponent(text.slice(0, MAX_LEN))}`;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(7000) });
    if (!r.ok) throw new Error(`translate endpoint ${r.status}`);
    const data = await r.json();
    const chunks = data?.[0];
    if (!Array.isArray(chunks)) throw new Error("unexpected translate response");
    consecutiveFailures = 0;
    return chunks.map((c) => c[0]).join("");
  } catch (e) {
    if (attempt >= 2) throw e;
    await sleep(attempt * 350);
    return callGoogleTranslate(text, target, attempt + 1);
  }
}

// Translates a batch of English strings to `lang` (currently only "bn" is used by the site), reusing
// the DB cache and only calling out to the translation endpoint for strings never seen before.
// Always resolves - a string that fails to translate is returned unchanged (English) rather than
// throwing, so a translation hiccup can never take a page down.
export async function translateBatch(texts, lang = "bn") {
  const unique = [...new Set(texts.map((t) => String(t ?? "")).filter((t) => t.trim()))];
  const result = {};
  if (!unique.length) return result;

  const withHash = unique.map((text) => ({ text, hash: hashOf(text) }));
  let cached = [];
  try {
    cached = await prisma.translation.findMany({ where: { lang, hash: { in: withHash.map((h) => h.hash) } } });
  } catch {}
  const cacheMap = new Map(cached.map((c) => [c.hash, c.text]));

  const toFetch = [];
  for (const { text, hash } of withHash) {
    if (cacheMap.has(hash)) result[text] = cacheMap.get(hash);
    else toFetch.push({ text, hash });
  }

  const CONCURRENCY = 5;
  for (let i = 0; i < toFetch.length; i += CONCURRENCY) {
    if (Date.now() < circuitOpenUntil) {
      // Google is currently down/blocking us - skip straight to English for everything left rather
      // than spending minutes retrying a batch that has no chance of succeeding right now.
      for (const { text } of toFetch.slice(i)) result[text] = text;
      break;
    }
    const slice = toFetch.slice(i, i + CONCURRENCY);
    await Promise.all(
      slice.map(async ({ text, hash }) => {
        // Two independent steps on purpose: a cache-write failure (e.g. the DB briefly unreachable)
        // must never discard a translation that was already fetched successfully.
        let translated;
        try {
          translated = await callGoogleTranslate(text, lang);
        } catch {
          consecutiveFailures++;
          if (consecutiveFailures >= CIRCUIT_TRIP_THRESHOLD) circuitOpenUntil = Date.now() + CIRCUIT_COOLDOWN_MS;
          result[text] = text; // fail-safe: show the original English rather than breaking anything
          return;
        }
        result[text] = translated;
        try {
          await prisma.translation.upsert({ where: { hash_lang: { hash, lang } }, update: { text: translated }, create: { hash, lang, source: text.slice(0, 4800), text: translated.slice(0, 4800) } });
        } catch {} // couldn't cache it this time - the translation shown to this visitor is still correct
      })
    );
  }

  return result;
}
