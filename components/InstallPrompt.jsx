"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Download, X, Share, PlusSquare } from "lucide-react";

const KEY = "htp_install_dismissed";
const DAYS = 7;

// Android/Chrome/Edge: real install button. iPhone/iPad Safari has no install API, so we show the
// two-step "Share -> Add to Home Screen" hint instead.
export default function InstallPrompt() {
  const path = usePathname();
  const [evt, setEvt] = useState(null);
  const [ios, setIos] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    if (standalone) return;
    try {
      const t = Number(localStorage.getItem(KEY) || 0);
      if (t && Date.now() - t < DAYS * 864e5) return;
    } catch {}

    const ua = navigator.userAgent;
    const isIos = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
    let timer;

    const onPrompt = (e) => {
      e.preventDefault();
      setEvt(e);
      timer = setTimeout(() => setShow(true), 6000);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    if (isIos && isSafari) {
      setIos(true);
      timer = setTimeout(() => setShow(true), 8000);
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      clearTimeout(timer);
    };
  }, []);

  const hidden = path.startsWith("/checkout") || path.startsWith("/admin/login");
  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(KEY, String(Date.now()));
    } catch {}
  };
  async function install() {
    if (!evt) return;
    evt.prompt();
    await evt.userChoice.catch(() => {});
    setEvt(null);
    dismiss();
  }

  return (
    <AnimatePresence>
      {show && !hidden && (evt || ios) && (
        <motion.div
          role="dialog"
          aria-label="Install app"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="fixed z-[60] left-3 right-3 sm:left-auto sm:right-5 sm:w-96 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] nav:bottom-5 rounded-2xl border border-line bg-panel/95 backdrop-blur p-4 shadow-glow"
        >
          <button onClick={dismiss} aria-label="Dismiss" className="absolute top-3 right-3 text-mist hover:text-fg"><X size={16} /></button>
          <div className="flex gap-3">
            <img src="/icons/icon-192.png" alt="" className="w-11 h-11 rounded-xl shrink-0" />
            <div className="min-w-0 pr-5">
              <p className="font-semibold text-sm">Install the app</p>
              {evt ? (
                <p className="text-xs text-mist mt-0.5">Faster access to your orders and tools, right from your home screen.</p>
              ) : (
                <p className="text-xs text-mist mt-0.5 leading-relaxed">
                  Tap <Share size={12} className="inline -mt-0.5 text-brand" /> <b>Share</b>, then <PlusSquare size={12} className="inline -mt-0.5 text-brand" /> <b>Add to Home Screen</b>.
                </p>
              )}
            </div>
          </div>
          {evt && (
            <button onClick={install} className="btn-primary w-full justify-center mt-3"><Download size={15} /> Install</button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
