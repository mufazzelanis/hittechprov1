"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

// Three choices: "light" | "dark" | "system". What actually gets painted is the "resolved" theme.
export const THEME_KEY = "htp_theme";
const MODES = ["system", "light", "dark"];

// Executed as a raw inline <script> in <head>, before hydration, so the very first paint already has
// the right theme (no flash of the wrong colours). Keep this string self-contained (no imports).
export const NO_FLASH_SCRIPT = `(function(){try{
  var k="${THEME_KEY}",m=localStorage.getItem(k),s=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";
  var r=(m==="light"||m==="dark")?m:s;
  document.documentElement.setAttribute("data-theme",r);
  document.documentElement.setAttribute("data-theme-mode",m||"system");
}catch(e){}})();`;

const ThemeCtx = createContext({ mode: "system", resolved: "dark", setMode: () => {}, cycle: () => {} });

function applyMetaColor(resolved) {
  const c = resolved === "light" ? "#F6F7FA" : "#0A0A0C";
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", c);
}

export function ThemeProvider({ children }) {
  // The no-flash script already painted <html> with the real theme before this ever runs, but React's
  // first client render must still match the server's HTML exactly (server has no DOM to read) or React
  // throws a hydration-mismatch error. So both start from the same fixed default here, and a `useEffect`
  // below immediately re-syncs to whatever the script actually set — a normal post-mount state update,
  // not a hydration diff. The toggle button may show the wrong icon for one frame; the page's real colours
  // are already correct the whole time (the inline script handles that part, not React).
  const [mode, setModeState] = useState("system");
  const [resolved, setResolved] = useState("dark");

  useEffect(() => {
    const real = document.documentElement.getAttribute("data-theme") || "dark";
    setModeState(document.documentElement.getAttribute("data-theme-mode") || "system");
    setResolved(real);
    applyMetaColor(real); // read straight off the DOM: `resolved` state isn't updated yet in this same commit
  }, []);

  const paint = useCallback((nextMode) => {
    const sysLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    const next = nextMode === "light" || nextMode === "dark" ? nextMode : sysLight ? "light" : "dark";
    const root = document.documentElement;
    const go = () => {
      root.setAttribute("data-theme", next);
      root.setAttribute("data-theme-mode", nextMode);
      setResolved(next);
      applyMetaColor(next);
    };
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // A soft animated wipe from wherever the toggle was clicked; browsers without View Transitions
    // get a plain cross-fade of colours instead of a hard cut (see the .htp-theme-anim rule in globals.css).
    if (document.startViewTransition && !reduced) {
      root.style.setProperty("--vt-x", (window.__htpToggleX ?? window.innerWidth / 2) + "px");
      root.style.setProperty("--vt-y", (window.__htpToggleY ?? window.innerHeight / 2) + "px");
      document.startViewTransition(go);
    } else if (!reduced) {
      root.classList.add("htp-theme-anim");
      go();
      setTimeout(() => root.classList.remove("htp-theme-anim"), 300);
    } else go();
  }, []);

  const setMode = useCallback((next) => {
    setModeState(next);
    try { next === "system" ? localStorage.removeItem(THEME_KEY) : localStorage.setItem(THEME_KEY, next); } catch {}
    paint(next);
  }, [paint]);

  const cycle = useCallback(() => setMode(MODES[(MODES.indexOf(mode) + 1) % MODES.length]), [mode, setMode]);

  // Follow the OS when the user hasn't picked a side, and stay in sync across tabs.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onMq = () => { if ((document.documentElement.getAttribute("data-theme-mode") || "system") === "system") paint("system"); };
    const onStorage = (e) => { if (e.key === THEME_KEY) { const v = e.newValue; setModeState(v || "system"); paint(v || "system"); } };
    mq.addEventListener("change", onMq);
    window.addEventListener("storage", onStorage);
    return () => { mq.removeEventListener("change", onMq); window.removeEventListener("storage", onStorage); };
  }, [paint]);

  const value = useMemo(() => ({ mode, resolved, setMode, cycle }), [mode, resolved, setMode, cycle]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
