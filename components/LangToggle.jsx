"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Languages, Loader2 } from "lucide-react";
import { useLang } from "./LangProvider";

// A real EN/বাংলা switch (not just an icon button) - the sliding thumb sits over whichever side is
// active, the other language's label stays visible in the track. A soft brand-red glow pools behind EN
// and a gold glow behind বা (the same red/gold pairing used for accents everywhere else on the site), so
// which language is live reads at a glance even before the thumb finishes sliding. Never disabled:
// clicking mid-translate switches immediately (LangProvider cancels the now-stale in-flight request
// rather than blocking the UI on it) - the thumb's icon crossfades to a small spinner only while a
// translation is actually in flight. data-no-translate keeps this control's own labels out of the page's
// text walk, and keeps its loading spinner from being mistaken for new page content by the
// "translate newly-added content" watcher.
//
// Track is defined at module scope, not inside LangToggle - a component defined inside another
// component's render body gets a fresh function identity every render, and React treats that as a brand
// new component type: it unmounts and remounts the whole button on every re-render instead of just
// updating it. Since `ready` flips on every translate cycle, that remount fired constantly, and each one
// is a genuine "new node added to the page" DOM mutation - which the translate-new-content watcher (also
// in this file's sibling LangProvider) picked up as real content and used to trigger another translate
// pass, which flipped `ready` again, remounting the button again: a self-sustaining loop that never
// settled. Keeping Track stable fixes it at the source.
function Track({ isEn, ready, toggle, size }) {
  const dims =
    size === "lg"
      ? { w: 72, h: 36, thumb: 30, travel: 36, label: "text-[11px]", bn: 13, icon: 15 }
      : { w: 64, h: 32, thumb: 26, travel: 32, label: "text-[10px]", bn: 11.5, icon: 13 };

  return (
    <motion.button
      type="button"
      onClick={toggle}
      data-no-translate
      role="switch"
      aria-checked={!isEn}
      aria-label={isEn ? "Switch site to Bangla" : "Switch site to English"}
      title={isEn ? "বাংলায় দেখুন" : "View in English"}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.95 }}
      style={{ width: dims.w, height: dims.h }}
      className="group/lang relative inline-flex shrink-0 items-center rounded-full border border-line bg-panel2 shadow-[inset_0_1px_4px_rgba(0,0,0,0.3)] transition-colors duration-300 hover:border-brand/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-panel"
    >
      {/* Clipped separately from the button itself - the thumb's own drop-shadow/ring sits right at the
          track's edge and must NOT be clipped, only this background glow needs to stay inside the pill. */}
      <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
        <span
          className="absolute inset-0 transition-[background] duration-500"
          style={{
            background: isEn
              ? "radial-gradient(circle at 18% 50%, rgba(232,53,43,0.30), transparent 65%)"
              : "radial-gradient(circle at 82% 50%, rgba(232,178,59,0.30), transparent 65%)",
          }}
        />
      </span>

      <span className={`relative z-10 flex-1 text-center font-bold uppercase tracking-wide transition-colors duration-300 ${dims.label} ${isEn ? "text-white" : "text-mist"}`}>EN</span>
      <span className={`relative z-10 flex-1 text-center font-bold transition-colors duration-300 ${!isEn ? "text-white" : "text-mist"}`} style={{ fontSize: dims.bn }}>বা</span>

      <motion.span
        className="absolute top-[3px] left-[3px] z-20 flex items-center justify-center rounded-full bg-gradient-to-br from-brand-light via-brand to-brand-dark shadow-[0_2px_8px_-1px_rgba(232,53,43,0.7)] ring-1 ring-white/20"
        style={{ width: dims.thumb, height: dims.thumb }}
        animate={{ x: isEn ? 0 : dims.travel }}
        transition={{ type: "spring", stiffness: 500, damping: 34 }}
      >
        <AnimatePresence initial={false}>
          {!ready ? (
            <motion.span key="loading" initial={{ opacity: 0, scale: 0.5, rotate: -90 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 0.5, rotate: 90 }} transition={{ duration: 0.16 }}>
              <Loader2 size={dims.icon} className="animate-spin text-white" />
            </motion.span>
          ) : (
            <motion.span key="icon" initial={{ opacity: 0, scale: 0.5, rotate: -90 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 0.5, rotate: 90 }} transition={{ duration: 0.16 }}>
              <Languages size={dims.icon} className="text-white" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.span>
    </motion.button>
  );
}

export default function LangToggle({ variant = "icon", className = "" }) {
  const { lang, ready, toggle } = useLang();
  const isEn = lang === "en";

  if (variant === "row") {
    return (
      <div className={`w-full flex items-center justify-between gap-3 rounded-lg border border-line px-4 py-2.5 ${className}`}>
        <span className="text-sm text-mist">Language</span>
        <Track isEn={isEn} ready={ready} toggle={toggle} size="lg" />
      </div>
    );
  }

  return (
    <div className={`shrink-0 ${className}`}>
      <Track isEn={isEn} ready={ready} toggle={toggle} size="sm" />
    </div>
  );
}
