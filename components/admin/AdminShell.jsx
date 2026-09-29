"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard, ShoppingCart, Wrench, Tags, Package, Layers, MessageSquareQuote, HelpCircle,
  Settings, Inbox, Wallet, BarChart3, FileText, Users, Gauge, Gift, LogOut, Menu, X, ExternalLink, Wand2, Activity,
  PanelLeftClose, PanelLeftOpen, ChevronDown, ChevronRight, Share2, PiggyBank,
} from "lucide-react";
import { NAV } from "@/lib/resources";
import Logo from "@/components/Logo";
import { navStart } from "@/components/LoadingSystem";
import AdminSearch from "./AdminSearch";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";

const ICONS = {
  dashboard: LayoutDashboard, orders: ShoppingCart, sales: BarChart3, analytics: Activity, tools: Wrench, categories: Tags, bundles: Package,
  leads: Inbox, offers: Gift, prompts: Wand2, limits: Gauge, affiliates: Users, payouts: Wallet, content: FileText, plans: Layers, reviews: MessageSquareQuote, faqs: HelpCircle, settings: Settings, smm: Share2, smmReport: BarChart3, wallet: PiggyBank,
};

// Sidebar sections. Any NAV entry not listed here lands in "More" so a new page never disappears.
const GROUPS = [
  { id: "overview", label: "Overview", hrefs: ["/admin", "/admin/orders", "/admin/sales", "/admin/analytics"] },
  { id: "catalog", label: "Catalog", hrefs: ["/admin/tools", "/admin/tool-limits", "/admin/categories", "/admin/bundles", "/admin/plans"] },
  { id: "growth", label: "Growth", hrefs: ["/admin/free-offers", "/admin/smm-services", "/admin/smm-report", "/admin/prompts", "/admin/leads", "/admin/affiliates", "/admin/payouts", "/admin/wallet-topups"] },
  { id: "content", label: "Content", hrefs: ["/admin/reviews", "/admin/faqs", "/admin/content"] },
  { id: "system", label: "System", hrefs: ["/admin/settings"] },
];
const SECTIONS = (() => {
  const listed = new Set(GROUPS.flatMap((g) => g.hrefs));
  const out = GROUPS.map((g) => ({ ...g, items: g.hrefs.map((h) => NAV.find((n) => n.href === h)).filter(Boolean) }));
  const rest = NAV.filter((n) => !listed.has(n.href));
  if (rest.length) out.push({ id: "more", label: "More", items: rest });
  return out.filter((g) => g.items.length);
})();

const BAR = NAV.filter((n) => ["/admin", "/admin/orders", "/admin/tools", "/admin/payouts"].includes(n.href));
const COOKIE = "admin_sb";

const initials = (name = "", email = "") => (name || email).split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "A";

function Badge({ n, compact }) {
  if (!n) return null;
  const txt = n > 99 ? "99+" : n;
  return compact
    ? <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-brand text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-panel">{txt}</span>
    : <span className="ml-auto min-w-[22px] h-5 px-1.5 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center shadow-[0_4px_12px_-4px_rgb(var(--brand))]">{txt}</span>;
}

export default function AdminShell({ user, logo = "", initialCollapsed = false, children }) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false); // mobile drawer
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [closedGroups, setClosedGroups] = useState([]);
  const [counts, setCounts] = useState({});
  const [tip, setTip] = useState(null); // { label, top, left } for the collapsed rail
  const [menu, setMenu] = useState(false); // header user menu
  const menuRef = useRef(null);

  const isActive = (href) => (href === "/admin" ? path === "/admin" : path.startsWith(href));
  const current = NAV.find((n) => isActive(n.href));
  const currentGroup = SECTIONS.find((g) => g.items.some((n) => isActive(n.href)));
  const CurIcon = current ? ICONS[current.icon] : LayoutDashboard;

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      document.cookie = `${COOKIE}=${next ? 1 : 0}; path=/admin; max-age=31536000; samesite=lax`;
      return next;
    });
    setTip(null);
  }, []);

  // Collapsed sections are a per-browser preference.
  useEffect(() => {
    try { setClosedGroups(JSON.parse(localStorage.getItem("admin_sb_groups") || "[]")); } catch {}
  }, []);
  function toggleGroup(id) {
    setClosedGroups((g) => {
      const next = g.includes(id) ? g.filter((x) => x !== id) : [...g, id];
      try { localStorage.setItem("admin_sb_groups", JSON.stringify(next)); } catch {}
      return next;
    });
  }

  // Ctrl/Cmd+B toggles the sidebar; Esc closes the mobile drawer and the user menu.
  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b" && !e.target.isContentEditable) {
        e.preventDefault();
        toggleCollapsed();
      }
      if (e.key === "Escape") { setOpen(false); setMenu(false); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleCollapsed]);

  // Badge counts: on navigation, when the tab regains focus, and every minute.
  useEffect(() => {
    let live = true;
    const load = () => fetch("/api/admin/nav-counts").then((r) => (r.ok ? r.json() : null)).then((j) => live && j && setCounts(j)).catch(() => {});
    load();
    const t = setInterval(load, 60000);
    window.addEventListener("focus", load);
    return () => { live = false; clearInterval(t); window.removeEventListener("focus", load); };
  }, [path]);

  useEffect(() => { setOpen(false); setMenu(false); }, [path]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  useEffect(() => {
    if (!menu) return;
    const close = (e) => { if (!menuRef.current?.contains(e.target)) setMenu(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menu]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    navStart();
    router.replace("/admin/login");
    router.refresh();
  }

  const showTip = (label) => (e) => {
    if (!collapsed) return;
    const r = e.currentTarget.getBoundingClientRect();
    setTip({ label, top: r.top + r.height / 2, left: r.right + 12 });
  };
  const tipProps = (label) => ({ onMouseEnter: showTip(label), onFocus: showTip(label), onMouseLeave: () => setTip(null), onBlur: () => setTip(null) });

  // `rail` = the collapsed desktop sidebar; the mobile drawer always renders the full version.
  const sidebar = (rail) => (
    <div className="flex flex-col h-full">
      <div className={`flex items-center h-16 border-b border-line shrink-0 ${rail ? "justify-center px-2" : "gap-2 px-5"}`}>
        <Link href="/admin" className="flex items-center gap-2 font-display font-bold min-w-0" {...tipProps("Dashboard")}>
          <Logo src={logo} className="h-8 shrink-0" />
          {!rail && <span className="truncate">HiT <span className="text-brand">Admin</span></span>}
        </Link>
      </div>

      <nav className={`flex-1 overflow-y-auto overflow-x-hidden py-3 ${rail ? "px-2.5" : "px-3"}`} aria-label="Admin sections" onScroll={() => setTip(null)}>
        {SECTIONS.map((g, gi) => {
          const closed = !rail && closedGroups.includes(g.id) && g.id !== currentGroup?.id;
          const groupCount = g.items.reduce((n, it) => n + (counts[it.href] || 0), 0);
          return (
            <div key={g.id} className={gi ? "mt-3" : ""}>
              {rail ? (
                gi > 0 && <div className="mx-2 mb-3 h-px bg-line" />
              ) : (
                <button type="button" onClick={() => toggleGroup(g.id)} aria-expanded={!closed} className="w-full flex items-center gap-2 px-3 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-mist/80 hover:text-fg">
                  <span>{g.label}</span>
                  {closed && groupCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-brand" />}
                  <ChevronDown size={12} className={`ml-auto transition-transform ${closed ? "-rotate-90" : ""}`} />
                </button>
              )}
              <AnimatePresence initial={false}>
                {!closed && (
                  <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-0.5 overflow-hidden">
                    {g.items.map((n) => {
                      const I = ICONS[n.icon] || LayoutDashboard;
                      const on = isActive(n.href);
                      const c = counts[n.href] || 0;
                      return (
                        <li key={n.href}>
                          <Link
                            href={n.href}
                            aria-current={on ? "page" : undefined}
                            aria-label={rail ? `${n.label}${c ? ` (${c} waiting)` : ""}` : undefined}
                            {...tipProps(c ? `${n.label} · ${c} waiting` : n.label)}
                            className={`group relative flex items-center rounded-xl text-sm transition-colors ${rail ? "justify-center h-11" : "gap-3 px-3 py-2"} ${
                              on ? "text-fg font-semibold" : "text-mist hover:text-fg hover:bg-panel2"
                            }`}
                          >
                            {on && (
                              <motion.span layoutId={rail ? "nav-on-rail" : "nav-on"} className="absolute inset-0 rounded-xl bg-gradient-to-r from-brand/20 to-brand/5 border border-brand/30" transition={{ type: "spring", stiffness: 400, damping: 34 }}>
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 -ml-px w-[3px] h-5 rounded-r-full bg-brand" />
                              </motion.span>
                            )}
                            <span className={`relative flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-colors ${on ? "bg-brand text-white shadow-[0_6px_16px_-6px_rgb(var(--brand))]" : "bg-panel2/70 group-hover:bg-panel2 group-hover:text-brand"}`}>
                              <I size={16} />
                              {rail && <Badge n={c} compact />}
                            </span>
                            {!rail && <span className="relative truncate">{n.label}</span>}
                            {!rail && <span className="relative ml-auto"><Badge n={c} /></span>}
                          </Link>
                        </li>
                      );
                    })}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      <div className={`border-t border-line shrink-0 ${rail ? "p-2.5 space-y-1.5" : "p-3 space-y-2"}`}>
        {rail ? (
          <div className="flex justify-center"><ThemeToggle /></div>
        ) : (
          <ThemeToggle variant="row" />
        )}
        <a href="/" target="_blank" rel="noreferrer" {...tipProps("View website")} className={`flex items-center rounded-xl text-sm text-mist hover:text-fg hover:bg-panel2 ${rail ? "justify-center h-10" : "gap-3 px-3 py-2"}`}>
          <ExternalLink size={16} /> {!rail && "View website"}
        </a>
        <div className={`flex items-center rounded-xl border border-line bg-panel2/40 ${rail ? "flex-col gap-1.5 p-1.5" : "gap-3 p-2.5"}`}>
          <span className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-brand to-brand-light text-white text-xs font-bold flex items-center justify-center" {...tipProps(user.name || user.email)}>{initials(user.name, user.email)}</span>
          {!rail && (
            <div className="min-w-0 flex-1 leading-tight">
              <p className="text-sm font-semibold truncate">{user.name || "Admin"}</p>
              <p className="text-[11px] text-mist truncate">{user.email}</p>
            </div>
          )}
          <button type="button" onClick={logout} aria-label="Log out" {...tipProps("Log out")} className="p-2 rounded-lg text-mist hover:text-red-400 hover:bg-panel"><LogOut size={16} /></button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-ink text-fg">
      <aside className={`hidden lg:block fixed inset-y-0 left-0 z-40 bg-panel border-r border-line transition-[width] duration-300 ease-out ${collapsed ? "w-[76px]" : "w-64"}`}>
        {sidebar(collapsed)}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
          title={collapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
          className="absolute top-[52px] -right-3 w-6 h-6 rounded-full border border-line bg-panel text-mist hover:text-white hover:bg-brand hover:border-brand shadow flex items-center justify-center transition-colors"
        >
          <ChevronRight size={13} strokeWidth={2.5} className={`transition-transform duration-300 ${collapsed ? "" : "rotate-180"}`} />
        </button>
      </aside>

      {/* Tooltip for the icon rail (fixed, so the scrolling nav can't clip it). */}
      {collapsed && tip && (
        <div role="tooltip" className="hidden lg:block fixed z-[60] -translate-y-1/2 pointer-events-none rounded-lg bg-fg text-ink text-xs font-semibold px-2.5 py-1.5 shadow-lg whitespace-nowrap" style={{ top: tip.top, left: tip.left }}>
          <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 bg-fg" />
          <span className="relative">{tip.label}</span>
        </div>
      )}

      <AnimatePresence>
        {open && (
          <div className="lg:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Admin menu">
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", stiffness: 380, damping: 38 }} className="relative w-[85vw] max-w-xs bg-panel border-r border-line shadow-2xl">
              {sidebar(false)}
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="absolute top-3.5 right-3 p-2 rounded-lg text-mist hover:text-fg hover:bg-panel2"><X size={18} /></button>
            </motion.div>
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 bg-black/60 backdrop-blur-[2px]" aria-label="Close menu" onClick={() => setOpen(false)} />
          </div>
        )}
      </AnimatePresence>

      <div className={`transition-[padding] duration-300 ease-out ${collapsed ? "lg:pl-[76px]" : "lg:pl-64"}`}>
        <header className="sticky top-0 z-30 h-16 bg-ink/85 backdrop-blur-md border-b border-line flex items-center justify-between gap-3 px-4 sm:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button className="lg:hidden min-w-[44px] min-h-[44px] -ml-3 flex items-center justify-center" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu size={22} />
            </button>
            <button type="button" onClick={toggleCollapsed} className="hidden lg:flex w-9 h-9 -ml-2 items-center justify-center rounded-lg text-mist hover:text-fg hover:bg-panel2" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={`${collapsed ? "Expand" : "Collapse"} sidebar (Ctrl+B)`}>
              {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
            <span className="hidden sm:flex w-9 h-9 shrink-0 rounded-lg bg-brand/15 text-brand items-center justify-center"><CurIcon size={17} /></span>
            <div className="min-w-0 leading-tight">
              <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1 text-[11px] text-mist">
                <Link href="/admin" className="hover:text-fg">Admin</Link>
                {currentGroup && <><ChevronRight size={11} /><span>{currentGroup.label}</span></>}
              </nav>
              <h1 className="font-display font-semibold truncate">{current?.label || "Admin"}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <AdminSearch onLogout={logout} />
            <NotificationBell />
            <ThemeToggle />
            <div ref={menuRef} className="relative">
              <button type="button" onClick={() => setMenu((m) => !m)} aria-haspopup="menu" aria-expanded={menu} className="flex items-center gap-2 rounded-full sm:rounded-xl sm:border sm:border-line sm:pl-1 sm:pr-2.5 sm:py-1 hover:bg-panel2">
                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-brand-light text-white text-[11px] font-bold flex items-center justify-center">{initials(user.name, user.email)}</span>
                <span className="hidden md:block text-left leading-tight max-w-[140px]">
                  <span className="block text-sm font-medium truncate">{user.name || "Admin"}</span>
                  <span className="block text-[10px] text-mist truncate">{user.email}</span>
                </span>
                <ChevronDown size={14} className={`hidden sm:block text-mist transition-transform ${menu ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {menu && (
                  <motion.div role="menu" initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }} transition={{ duration: 0.15 }} className="absolute right-0 mt-2 w-60 rounded-xl border border-line bg-panel shadow-2xl p-1.5 z-50">
                    <div className="px-3 py-2.5 border-b border-line mb-1">
                      <p className="text-sm font-semibold truncate">{user.name || "Admin"}</p>
                      <p className="text-[11px] text-mist truncate">{user.email}</p>
                    </div>
                    <Link role="menuitem" href="/admin/settings" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-mist hover:text-fg hover:bg-panel2"><Settings size={15} /> Settings</Link>
                    <a role="menuitem" href="/" target="_blank" rel="noreferrer" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-mist hover:text-fg hover:bg-panel2"><ExternalLink size={15} /> View website</a>
                    <button role="menuitem" type="button" onClick={toggleCollapsed} className="hidden lg:flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-mist hover:text-fg hover:bg-panel2">
                      {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />} {collapsed ? "Expand" : "Collapse"} sidebar <kbd className="ml-auto text-[10px] rounded border border-line px-1.5 py-0.5">Ctrl B</kbd>
                    </button>
                    <div className="my-1 h-px bg-line" />
                    <button role="menuitem" type="button" onClick={logout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10"><LogOut size={15} /> Log out</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>
        <main className="p-4 sm:p-8 max-lg:pb-[calc(5.5rem+env(safe-area-inset-bottom))]">{children}</main>
      </div>

      <nav aria-label="Admin" className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-line bg-ink/92 backdrop-blur-md" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <ul className="grid grid-cols-5">
          {BAR.map((n) => {
            const I = ICONS[n.icon];
            const on = isActive(n.href);
            return (
              <li key={n.href}>
                <Link href={n.href} className={`relative flex flex-col items-center justify-center gap-1 h-[58px] text-[10px] font-medium ${on ? "text-brand" : "text-mist"}`}>
                  {on && <motion.span layoutId="bar-on" className="absolute top-0 inset-x-5 h-0.5 rounded-b-full bg-brand" />}
                  <span className="relative"><I size={21} strokeWidth={on ? 2.4 : 2} /><Badge n={counts[n.href]} compact /></span>
                  {n.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button onClick={() => setOpen(true)} className="w-full flex flex-col items-center justify-center gap-1 h-[58px] text-[10px] font-medium text-mist">
              <Menu size={21} /> More
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
