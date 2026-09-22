"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, BellOff, Check, ShoppingCart, Inbox, Gift, Wallet, UserPlus, BellRing, Volume2, VolumeX } from "lucide-react";
import { navStart } from "@/components/LoadingSystem";

const ICON = { order: ShoppingCart, lead: Inbox, claim: Gift, payout: Wallet, signup: UserPlus };
const COLOR = { order: "text-brand bg-brand/15", lead: "text-sky-300 bg-sky-400/15", claim: "text-pink-300 bg-pink-400/15", payout: "text-amber-300 bg-amber-400/15", signup: "text-emerald-300 bg-emerald-400/15" };
const MUTE_KEY = "htp_admin_mute";
const MAX_BADGE = 99;

function timeAgo(iso) {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// A short, pleasant two-note chime built with the Web Audio API, so no audio file needs hosting.
function ding() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const play = (freq, start, dur) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.05);
    };
    play(880, 0, 0.16);
    play(1320, 0.1, 0.22);
    setTimeout(() => ctx.close().catch(() => {}), 500);
  } catch {}
}

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [unread, setUnread] = useState(0);
  const [ring, setRing] = useState(0); // bumped on every new item, to replay the bell animation
  const [muted, setMuted] = useState(false);
  const [notifPerm, setNotifPerm] = useState("default");
  const ref = useRef(null);
  const titleRef = useRef(null);
  const mutedRef = useRef(false); // mirrors `muted` for the SSE/poll callbacks below, which are wired
  // up once on mount - a plain closure over `muted` would freeze at its value from that first render
  // and never see later mute-button clicks, so every sound decision reads this ref instead.
  const knownIds = useRef(new Set()); // every notification id already shown, so the polling fallback
  // (unlike SSE) can tell which rows in its next fetch are genuinely new and deserves a ding for them.
  const loadedOnce = useRef(false);

  useEffect(() => {
    try { setMuted(localStorage.getItem(MUTE_KEY) === "1"); } catch {}
    if (typeof Notification !== "undefined") setNotifPerm(Notification.permission);
    titleRef.current = document.title;
  }, []);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    document.title = unread > 0 ? `(${unread > MAX_BADGE ? MAX_BADGE + "+" : unread}) ${titleRef.current}` : titleRef.current;
  }, [unread]);

  const ringFor = useCallback((row) => {
    setRing((n) => n + 1);
    if (!mutedRef.current) ding();
    if (document.hidden && typeof Notification !== "undefined" && Notification.permission === "granted") {
      try {
        const n = new Notification(row.title, { body: row.body || "", icon: "/icons/icon-192.png", tag: row.id });
        n.onclick = () => { window.focus(); n.close(); };
      } catch {}
    }
  }, []);

  const onIncoming = useCallback((row) => {
    knownIds.current.add(row.id);
    setRows((rs) => [row, ...rs].slice(0, 40));
    setUnread((n) => n + 1);
    ringFor(row);
  }, [ringFor]);

  // Plain polling fallback (older browser, a proxy that blocks a long-lived stream, ...). It re-fetches
  // the same list SSE would have pushed, so any row not already in `knownIds` is one the fallback path
  // has never announced yet and still needs its sound + desktop alert, in oldest-first order.
  const load = useCallback(async () => {
    const r = await fetch("/api/admin/notifications", { cache: "no-store" });
    if (!r.ok) return;
    const j = await r.json();
    const rows = j.rows || [];
    if (loadedOnce.current) {
      const fresh = rows.filter((row) => !row.read && !knownIds.current.has(row.id)).reverse();
      fresh.forEach(ringFor);
    }
    rows.forEach((row) => knownIds.current.add(row.id));
    loadedOnce.current = true;
    setRows(rows);
    setUnread(j.unread || 0);
  }, [ringFor]);

  // Live push via SSE; falls back to plain polling if the stream can't be kept open (older browser, a
  // proxy that blocks it, ...). EventSource itself already auto-reconnects on a dropped connection.
  useEffect(() => {
    load();
    let poll;
    let es;
    let failures = 0;
    const startPolling = () => { if (!poll) poll = setInterval(load, 15000); };
    if (typeof EventSource !== "undefined") {
      es = new EventSource("/api/admin/notifications/stream");
      es.addEventListener("notification", (e) => { try { onIncoming(JSON.parse(e.data)); } catch {} });
      es.onerror = () => { failures++; if (failures > 2) startPolling(); };
      es.onopen = () => { failures = 0; if (poll) { clearInterval(poll); poll = null; } };
    } else startPolling();
    return () => { es?.close(); if (poll) clearInterval(poll); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open]);

  async function markAllRead() {
    setUnread(0);
    setRows((rs) => rs.map((r) => ({ ...r, read: true })));
    await fetch("/api/admin/notifications", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) });
  }

  async function openRow(row) {
    if (!row.read) {
      setUnread((n) => Math.max(0, n - 1));
      setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, read: true } : r)));
      fetch("/api/admin/notifications", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: row.id }) }).catch(() => {});
    }
    setOpen(false);
    if (row.href) { navStart(); router.push(row.href); }
  }

  function toggleMute() {
    setMuted((m) => { try { localStorage.setItem(MUTE_KEY, m ? "0" : "1"); } catch {} return !m; });
  }
  function askPermission() {
    Notification.requestPermission().then(setNotifPerm);
  }

  return (
    <div ref={ref} className="relative">
      <motion.button
        type="button" onClick={() => setOpen((o) => !o)} aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        animate={ring ? { rotate: [0, -14, 12, -8, 5, 0] } : {}} transition={{ duration: 0.5 }}
        className="relative w-10 h-10 rounded-lg border border-line flex items-center justify-center text-mist hover:text-fg hover:border-mist transition-colors"
      >
        <Bell size={17} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-brand text-white text-[9px] font-bold flex items-center justify-center">
            {unread > MAX_BADGE ? `${MAX_BADGE}+` : unread}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu" aria-label="Notifications"
            initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 z-50 w-[22rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-panel shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 h-12 border-b border-line shrink-0">
              <p className="font-display font-semibold text-sm flex-1">Notifications</p>
              <button type="button" onClick={toggleMute} aria-label={muted ? "Unmute the notification sound" : "Mute the notification sound"} title={muted ? "Sound off" : "Sound on"} className="p-1.5 text-mist hover:text-fg">
                {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>
              {unread > 0 && (
                <button type="button" onClick={markAllRead} className="flex items-center gap-1 text-[11px] text-mist hover:text-fg" title="Mark all as read"><Check size={12} /> Mark all read</button>
              )}
            </div>

            {typeof window !== "undefined" && typeof Notification !== "undefined" && notifPerm === "default" && (
              <button type="button" onClick={askPermission} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-brand hover:bg-panel2 border-b border-line">
                <BellRing size={14} /> Enable desktop alerts, even when this tab isn't focused
              </button>
            )}

            <div className="max-h-[70vh] overflow-y-auto">
              {rows.length === 0 && (
                <div className="py-14 text-center px-6">
                  <BellOff size={26} className="mx-auto text-mist" />
                  <p className="mt-3 text-sm text-mist">Nothing yet. New orders, messages and claims from customers will show up here the moment they happen.</p>
                </div>
              )}
              {rows.map((r) => {
                const I = ICON[r.type] || Inbox;
                return (
                  <button key={r.id} type="button" onClick={() => openRow(r)} className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-line/60 last:border-0 transition-colors hover:bg-panel2/60 ${!r.read ? "bg-brand/[0.04]" : ""}`}>
                    <span className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center ${COLOR[r.type] || COLOR.lead}`}><I size={16} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium leading-snug">{r.title}</span>
                        {!r.read && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand shrink-0" aria-hidden />}
                      </span>
                      {r.body && <span className="block text-xs text-mist mt-0.5 truncate">{r.body}</span>}
                      <span className="block text-[10px] text-mist mt-1">{timeAgo(r.createdAt)}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
