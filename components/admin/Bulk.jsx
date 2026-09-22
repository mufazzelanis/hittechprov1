"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Minus, X, Loader2, AlertTriangle } from "lucide-react";

/* ---------------------------------------------------------- selection hook */
// rows: the currently visible rows (need .id). Supports shift-click range select.
export function useSelection(rows) {
  const [sel, setSel] = useState(() => new Set());
  const last = useRef(null);
  const ids = useMemo(() => rows.map((r) => r.id), [rows]);

  // drop ids that are no longer listed (filtered out, deleted)
  useEffect(() => {
    setSel((s) => {
      const keep = new Set([...s].filter((id) => ids.includes(id)));
      return keep.size === s.size ? s : keep;
    });
  }, [ids]);

  const toggle = useCallback((id, e) => {
    const from = last.current;
    const shift = !!e?.shiftKey;
    setSel((s) => {
      const n = new Set(s);
      const i = ids.indexOf(id);
      if (shift && from !== null && ids[from] !== undefined) {
        const [a, b] = [Math.min(from, i), Math.max(from, i)];
        const on = !s.has(id);
        for (let k = a; k <= b; k++) (on ? n.add(ids[k]) : n.delete(ids[k]));
      } else n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
    last.current = ids.indexOf(id);
  }, [ids]);

  const all = ids.length > 0 && ids.every((id) => sel.has(id));
  const some = sel.size > 0 && !all;
  const toggleAll = useCallback(() => setSel(all ? new Set() : new Set(ids)), [all, ids]);
  const clear = useCallback(() => { setSel(new Set()); last.current = null; }, []);

  useEffect(() => {
    const k = (e) => { if (e.key === "Escape" && !document.querySelector("[data-bulk-modal]")) clear(); };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [clear]);

  return { sel, has: (id) => sel.has(id), toggle, all, some, toggleAll, clear, count: sel.size, ids: [...sel] };
}

export const plural = (noun, n) => (n === 1 ? noun : /[^aeiou]y$/.test(noun) ? noun.slice(0, -1) + "ies" : noun + "s");

/* ------------------------------------------------------------- checkboxes */
export function Check3({ checked, indeterminate, onChange, label, className = "" }) {
  return (
    <button
      type="button" role="checkbox" aria-checked={indeterminate ? "mixed" : checked} aria-label={label}
      onClick={(e) => onChange(e)}
      className={`relative shrink-0 w-[18px] h-[18px] rounded-[5px] border flex items-center justify-center transition-colors after:absolute after:-inset-3 after:content-[''] ${checked || indeterminate ? "bg-brand border-brand text-white" : "border-mist/60 hover:border-fg bg-transparent"} ${className}`}
    >
      <AnimatePresence initial={false}>
        {(checked || indeterminate) && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 500, damping: 25 }}>
            {indeterminate && !checked ? <Minus size={12} strokeWidth={3} /> : <Check size={12} strokeWidth={3} />}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

/* --------------------------------------------------------------- action bar */
// actions: [{ label, icon: Icon, onClick, danger?, hideOnMobileLabel? }]
export function BulkBar({ count, noun = "item", onClear, actions, busy }) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 90, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 90, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="fixed z-40 left-3 right-3 lg:left-[19rem] lg:right-8 bottom-20 lg:bottom-6 mx-auto max-w-3xl flex items-center gap-2 sm:gap-3 rounded-2xl border border-brand/40 bg-panel/95 backdrop-blur px-3 sm:px-4 py-2.5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.85)]"
        >
          <button type="button" onClick={onClear} aria-label="Clear selection" className="p-1.5 -ml-1 text-mist hover:text-fg"><X size={17} /></button>
          <span className="text-sm font-semibold whitespace-nowrap">
            <span className="text-brand">{count}</span> <span className="hidden sm:inline">{plural(noun, count)} </span><span className="hidden min-[420px]:inline">selected</span>
          </span>
          <span className="flex-1" />
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
            {busy && <Loader2 size={16} className="animate-spin text-mist shrink-0" />}
            {actions.map((a) => (
              <button
                key={a.label} type="button" onClick={a.onClick} disabled={busy} title={a.label}
                className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-2 text-xs sm:text-[13px] font-semibold transition-colors disabled:opacity-50 ${a.danger ? "bg-red-500/15 text-red-300 hover:bg-red-500/25" : "border border-line hover:border-mist"}`}
              >
                {a.icon && <a.icon size={14} />}<span className={a.mobileIconOnly ? "hidden sm:inline" : ""}>{a.label}</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ dialog */
export function Modal({ open, onClose, title, children, footer, wide }) {
  useEffect(() => {
    if (!open) return;
    const k = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div data-bulk-modal className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-6 bg-black/70 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
          <motion.div role="dialog" aria-modal="true" aria-label={title} initial={{ y: 40, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 28 }} className={`w-full ${wide ? "sm:max-w-xl" : "sm:max-w-md"} max-h-[92dvh] flex flex-col rounded-t-3xl sm:rounded-2xl border border-line bg-panel shadow-2xl`}>
            <div className="flex items-center justify-between px-5 h-14 border-b border-line shrink-0">
              <h3 className="font-display font-semibold">{title}</h3>
              <button type="button" onClick={onClose} aria-label="Close" className="text-mist hover:text-fg p-1"><X size={19} /></button>
            </div>
            <div className="p-5 overflow-y-auto">{children}</div>
            {footer && <div className="p-4 border-t border-line flex items-center justify-end gap-3 shrink-0">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmDelete({ open, count, noun = "item", names = [], busy, onConfirm, onCancel, extra }) {
  const [typed, setTyped] = useState("");
  useEffect(() => { if (!open) setTyped(""); }, [open]);
  const needTyping = count > 5;
  return (
    <Modal open={open} onClose={onCancel} title={`Delete ${count} ${plural(noun, count)}?`} footer={
      <>
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="button" disabled={busy || (needTyping && typed !== "DELETE")} onClick={onConfirm} className="inline-flex items-center gap-2 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-40 px-5 py-2.5 text-sm font-semibold text-white">
          {busy ? <Loader2 size={15} className="animate-spin" /> : null} Delete {count}
        </button>
      </>
    }>
      <p className="flex items-start gap-2.5 text-sm text-red-300"><AlertTriangle size={18} className="shrink-0 mt-0.5" /> This cannot be undone.</p>
      {extra && <p className="text-xs text-mist mt-2">{extra}</p>}
      {names.length > 0 && (
        <ul className="mt-3 max-h-40 overflow-y-auto rounded-lg border border-line divide-y divide-line text-sm">
          {names.slice(0, 30).map((n, i) => <li key={i} className="px-3 py-2 truncate">{n}</li>)}
          {names.length > 30 && <li className="px-3 py-2 text-mist">and {names.length - 30} more…</li>}
        </ul>
      )}
      {needTyping && (
        <div className="mt-4">
          <label className="block text-xs text-mist mb-1.5">Type <b className="text-fg">DELETE</b> to confirm</label>
          <input className="input" value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus />
        </div>
      )}
    </Modal>
  );
}

/* --------------------------------------------------------------- CSV export */
export function downloadCsv(filename, header, rows) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const body = [header, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["﻿" + body], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
