"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { getVisitorId } from "@/lib/visitorId";

function Tracker() {
  const pathname = usePathname();
  const search = useSearchParams();
  const last = useRef("");

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    const qs = search?.toString();
    const full = qs ? `${pathname}?${qs}` : pathname;
    if (last.current === full) return;
    last.current = full;

    const sessionId = getVisitorId();
    if (!sessionId) return;
    fetch("/api/track-visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        sessionId,
        path: full,
        referrer: document.referrer || "",
        utm: {
          source: search?.get("utm_source") || undefined,
          medium: search?.get("utm_medium") || undefined,
          campaign: search?.get("utm_campaign") || undefined,
        },
      }),
    }).catch(() => {});
  }, [pathname, search]);

  return null;
}

// useSearchParams() requires a Suspense boundary in the App Router.
export default function VisitTracker() {
  return (
    <Suspense fallback={null}>
      <Tracker />
    </Suspense>
  );
}
