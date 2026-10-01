import { siteUrl } from "./seo";

// IndexNow (adopted by Bing, Yandex and others - not Google, which has no public equivalent) lets a site
// push "this URL changed" the instant it happens, instead of waiting for the next crawl. One shared key,
// proven by serving it back at /<key>.txt (see middleware.js), authorizes submissions for the whole host.
export async function submitUrls(s, urls) {
  const key = process.env.INDEXNOW_KEY;
  if (!key || !urls?.length) return { ok: false, skipped: true };
  const host = new URL(siteUrl(s)).host;
  try {
    const r = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host, key, keyLocation: `${siteUrl(s)}/${key}.txt`, urlList: urls.slice(0, 10000) }),
      signal: AbortSignal.timeout(8000),
    });
    return { ok: r.ok, status: r.status };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// One URL right after it changes (a tool's price/visibility, a new tool, a feature switching on) -
// never blocks the admin action it's called from: always fire-and-forget with .catch(() => {}).
export const submitUrl = (s, path) => submitUrls(s, [path.startsWith("http") ? path : `${siteUrl(s)}${path}`]);
