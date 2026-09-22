"use client";

import { useEffect } from "react";

// Stores ?ref=CODE in a 30-day cookie and counts one click per browser session.
export default function RefCapture({ enabled = true }) {
  useEffect(() => {
    if (!enabled) return;
    const code = new URLSearchParams(window.location.search).get("ref");
    if (!code || !/^[A-Za-z0-9]{4,12}$/.test(code)) return;
    document.cookie = `htp_ref=${code.toUpperCase()}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
    try {
      if (sessionStorage.getItem("htp_ref_counted") === code) return;
      sessionStorage.setItem("htp_ref_counted", code);
    } catch {}
    fetch("/api/ref", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
  }, [enabled]);
  return null;
}
