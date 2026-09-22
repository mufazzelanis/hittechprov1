"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { useTheme } from "@/lib/theme";

const OPTIONS = [
  ["light", "Light", Sun],
  ["dark", "Dark", Moon],
  ["system", "Match device", Monitor],
];

// Compact icon button + popover (nav bars). `variant="row"` renders a full-width labelled row instead,
// for a mobile menu or a sidebar where a floating popover would feel out of place.
export default function ThemeToggle({ variant = "icon", className = "" }) {
  const { mode, resolved, setMode } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open]);

  function choose(next, e) {
    // Where the click happened, so the theme reveal animation grows from this exact spot.
    const r = e.currentTarget.getBoundingClientRect();
    window.__htpToggleX = r.left + r.width / 2;
    window.__htpToggleY = r.top + r.height / 2;
    setMode(next);
    setOpen(false);
  }

  const Icon = resolved === "light" ? Sun : Moon;

  if (variant === "row") {
    return (
      <div className={className}>
        <p className="px-1 pb-1.5 text-[11px] uppercase tracking-wider text-mist">Appearance</p>
        <div className="grid grid-cols-3 gap-1.5">
          {OPTIONS.map(([k, label, I]) => (
            <button
              key={k} type="button" onClick={(e) => choose(k, e)} aria-pressed={mode === k}
              className={`flex flex-col items-center gap-1.5 rounded-xl border py-2.5 text-[11px] font-medium transition-colors ${mode === k ? "border-brand/50 bg-brand/10 text-fg" : "border-line text-mist hover:text-fg hover:border-mist"}`}
            >
              <I size={16} /> {label === "Match device" ? "System" : label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button" onClick={() => setOpen((o) => !o)} aria-label="Change theme" aria-expanded={open}
        className="relative w-10 h-10 rounded-lg border border-line flex items-center justify-center text-mist hover:text-fg hover:border-mist transition-colors overflow-hidden"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={resolved} initial={{ rotate: -90, opacity: 0, scale: 0.5 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} exit={{ rotate: 90, opacity: 0, scale: 0.5 }} transition={{ duration: 0.25 }} className="flex">
            <Icon size={17} />
          </motion.span>
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu" aria-label="Theme"
            initial={{ opacity: 0, y: -6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.96 }} transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 z-50 w-44 rounded-xl border border-line bg-panel p-1.5 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)]"
          >
            {OPTIONS.map(([k, label, I]) => (
              <button key={k} type="button" role="menuitemradio" aria-checked={mode === k} onClick={(e) => choose(k, e)} className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${mode === k ? "bg-brand/15 text-fg" : "text-mist hover:text-fg hover:bg-panel2"}`}>
                <I size={15} className="shrink-0" /> <span className="flex-1 text-left">{label}</span> {mode === k && <Check size={14} className="text-brand shrink-0" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
