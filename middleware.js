import { NextResponse } from "next/server";

// IndexNow (Bing, Yandex, ...) verifies the site owns this key by fetching /<key>.txt and expecting the
// raw key back - handled in middleware (not a route file) because the exact URL depends on an env var,
// and the site already has a catch-all [page] route at this same top level that a matching dynamic route
// segment would collide with.
export function middleware(req) {
  const key = process.env.INDEXNOW_KEY;
  if (key && req.nextUrl.pathname === `/${key}.txt`) {
    return new NextResponse(key, { headers: { "content-type": "text/plain; charset=utf-8" } });
  }
  return NextResponse.next();
}

// Broad but cheap: skips static assets and API routes, and the function body itself only ever acts on
// the one exact path, so a wider matcher here costs nothing.
export const config = {
  matcher: ["/((?!_next/static|_next/image|api/).*)"],
};
