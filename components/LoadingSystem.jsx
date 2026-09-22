"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

// Call before router.push()/replace() so the loader starts even when no link was clicked.
export const navStart = () => {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("htp-nav-start"));
};

const RIPPLE_TARGETS = '.btn-primary,.btn-ghost,.btn-shine,button[class*="bg-brand"],a[class*="bg-brand"]';

function Progress() {
  const path = usePathname();
  const sp = useSearchParams();
  const key = `${path}?${sp.toString()}`;
  const [s, setS] = useState({ on: false, p: 0, slow: false });
  const on = useRef(false);
  const t = useRef({});

  const clear = () => Object.values(t.current).forEach((x) => (clearInterval(x), clearTimeout(x)));

  const done = useCallback(() => {
    if (!on.current) return;
    clear();
    setS((v) => ({ ...v, p: 100 }));
    t.current.end = setTimeout(() => {
      on.current = false;
      setS({ on: false, p: 0, slow: false });
    }, 280);
  }, []);

  const start = useCallback(() => {
    if (on.current) return;
    on.current = true;
    clear();
    setS({ on: true, p: 10, slow: false });
    t.current.trickle = setInterval(() => setS((v) => ({ ...v, p: v.p + (92 - v.p) * 0.07 })), 180); // creeps toward 92%
    t.current.slow = setTimeout(() => setS((v) => (v.on ? { ...v, slow: true } : v)), 650); // still loading: show the loader card
    t.current.safety = setTimeout(done, 15000); // never get stuck
  }, [done]);

  // route changed -> finish
  useEffect(() => {
    done();
  }, [key, done]);

  useEffect(() => {
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest?.("a[href]");
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      let u;
      try { u = new URL(a.href, location.href); } catch { return; }
      if (u.origin !== location.origin) return;
      if (u.pathname === location.pathname && u.search === location.search) return; // same page / #hash only
      start();
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener("htp-nav-start", start);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("htp-nav-start", start);
      clear();
    };
  }, [start]);

  return (
    <>
      <div className="fixed top-0 inset-x-0 z-[95] h-[3px] pointer-events-none" aria-hidden>
        <div className="h-full origin-left bg-gradient-to-r from-brand via-gold to-brand-light shadow-[0_0_12px_2px_rgba(232,53,43,0.7)]" style={{ transform: `scaleX(${s.on ? s.p / 100 : 0})`, opacity: s.on ? 1 : 0, transition: `transform ${s.p === 100 ? 0.25 : 0.2}s ease-out, opacity 0.3s ease 0.1s` }} />
      </div>

      <AnimatePresence>
        {s.on && s.slow && (
          <motion.div
            key="loader"
            role="status"
            aria-live="polite"
            className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/55 backdrop-blur-[3px] pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div initial={{ scale: 0.85, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }} transition={{ type: "spring", stiffness: 300, damping: 24 }} className="flex flex-col items-center gap-4 rounded-3xl border border-line bg-panel/90 px-9 py-7 shadow-glow">
              <span className="relative flex w-16 h-16 items-center justify-center">
                <span className="absolute inset-0 rounded-full border-[3px] border-line" />
                <span className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-brand border-r-brand/50 animate-spin" />
                <span className="absolute inset-2 rounded-full bg-brand/15 animate-pulse" />
                <img src="/logo-mark.png" alt="" className="relative h-7 w-auto" />
              </span>
              <span className="flex items-center gap-2 text-sm font-medium text-fg/90">
                Loading
                <span className="flex gap-1" aria-hidden>
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </span>
              </span>
              <span className="h-1 w-32 overflow-hidden rounded-full bg-line" aria-hidden>
                <span className="block h-full w-1/2 rounded-full bg-gradient-to-r from-brand to-gold animate-[slide_1.1s_ease-in-out_infinite]" />
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Instant click feedback: a ripple from the exact tap point on every primary button.
function useRipple() {
  useEffect(() => {
    const down = (e) => {
      const el = e.target.closest?.(RIPPLE_TARGETS);
      if (!el || el.disabled || el.getAttribute("aria-disabled") === "true") return;
      const r = el.getBoundingClientRect();
      const d = Math.max(r.width, r.height) * 2.2;
      const dot = document.createElement("span");
      dot.className = "htp-ripple";
      dot.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
      if (getComputedStyle(el).position === "static") el.style.position = "relative";
      el.style.overflow = "hidden";
      el.appendChild(dot);
      setTimeout(() => dot.remove(), 650);
    };
    document.addEventListener("pointerdown", down, { passive: true });
    return () => document.removeEventListener("pointerdown", down);
  }, []);
}

export default function LoadingSystem() {
  useRipple();
  return (
    <Suspense fallback={null}>
      <Progress />
    </Suspense>
  );
}
