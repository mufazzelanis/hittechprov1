// HiT Tech Pro service worker.
// - Static assets: cache-first (safe, fingerprinted).
// - Public pages: network-first, cached copy only used when offline.
// - Anything private or dynamic (api, admin, account, checkout, login): NEVER cached.
const V = "htp-v2"; // bump when cached assets (icons, logo) change
const STATIC = `${V}-static`;
const PAGES = `${V}-pages`;
const PRIVATE = ["/api/", "/admin", "/account", "/checkout", "/login"];
const PUBLIC_PAGE = /^\/($|tools$|tool\/|affiliate$|privacy$|terms$|refund$)/;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(STATIC).then((c) => c.addAll(["/offline.html", "/icons/icon-192.png", "/icons/icon-512.png"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => !k.startsWith(V)).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (PRIVATE.some((p) => url.pathname === p.replace(/\/$/, "") || url.pathname.startsWith(p))) {
    if (req.mode === "navigate") e.respondWith(fetch(req).catch(() => caches.match("/offline.html")));
    return;
  }

  if (/^\/(_next\/static\/|uploads\/|icons\/|icon\.svg)/.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) caches.open(STATIC).then((c) => c.put(req, res.clone()));
            return res;
          })
      )
    );
    return;
  }

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok && PUBLIC_PAGE.test(url.pathname)) caches.open(PAGES).then((c) => c.put(req, res.clone()));
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match("/offline.html")))
    );
  }
});
