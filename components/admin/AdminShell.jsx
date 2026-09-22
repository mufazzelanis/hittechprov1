"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, ShoppingCart, Wrench, Tags, Package, Layers, MessageSquareQuote, HelpCircle,
  Settings, Inbox, Wallet, BarChart3, FileText, Users, Gauge, Gift, LogOut, Menu, X, ExternalLink, Wand2, Activity,
} from "lucide-react";
import { NAV } from "@/lib/resources";
import Logo from "@/components/Logo";
import { navStart } from "@/components/LoadingSystem";
import AdminSearch from "./AdminSearch";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";

const ICONS = {
  dashboard: LayoutDashboard, orders: ShoppingCart, sales: BarChart3, analytics: Activity, tools: Wrench, categories: Tags, bundles: Package,
  leads: Inbox, offers: Gift, prompts: Wand2, limits: Gauge, affiliates: Users, payouts: Wallet, content: FileText, plans: Layers, reviews: MessageSquareQuote, faqs: HelpCircle, settings: Settings,
};

const BAR = NAV.filter((n) => ["/admin", "/admin/orders", "/admin/tools", "/admin/payouts"].includes(n.href));

export default function AdminShell({ user, logo = "", children }) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const isActive = (href) => (href === "/admin" ? path === "/admin" : path.startsWith(href));
  const current = NAV.find((n) => isActive(n.href));

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    navStart();
    router.replace("/admin/login");
    router.refresh();
  }

  const sidebar = (
    <div className="flex flex-col h-full">
      <Link href="/admin" className="flex items-center gap-2 px-5 h-16 border-b border-line font-display font-bold">
        <Logo src={logo} className="h-8" />
        HiT <span className="text-brand">Admin</span>
      </Link>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {NAV.map((n) => {
          const I = ICONS[n.icon];
          const on = isActive(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                on ? "bg-brand/15 text-fg border border-brand/30" : "text-mist hover:text-fg hover:bg-panel2 border border-transparent"
              }`}
            >
              <I size={17} className={on ? "text-brand" : ""} />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-line space-y-3">
        <ThemeToggle variant="row" />
        <a href="/" target="_blank" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-mist hover:text-fg hover:bg-panel2">
          <ExternalLink size={17} /> View website
        </a>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-ink text-fg">
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 bg-panel border-r border-line">{sidebar}</aside>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-[85vw] max-w-xs bg-panel border-r border-line">{sidebar}</div>
          <button className="flex-1 bg-black/60" aria-label="Close menu" onClick={() => setOpen(false)} />
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 h-16 bg-ink/90 backdrop-blur border-b border-line flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <button className="lg:hidden min-w-[44px] min-h-[44px] -ml-3 flex items-center justify-center" onClick={() => setOpen(true)} aria-label="Open menu">
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
            <h1 className="font-display font-semibold">{current?.label || "Admin"}</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <AdminSearch onLogout={logout} />
            <NotificationBell />
            <ThemeToggle />
            <div className="hidden sm:block text-right leading-tight">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-mist">{user.email}</p>
            </div>
            <button onClick={logout} className="flex items-center gap-2 text-sm text-mist hover:text-fg border border-line rounded-lg px-3 py-2">
              <LogOut size={15} /> <span className="hidden sm:inline">Logout</span>
            </button>
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
                <Link href={n.href} className={`flex flex-col items-center justify-center gap-1 h-[58px] text-[10px] font-medium ${on ? "text-brand" : "text-mist"}`}>
                  <I size={21} strokeWidth={on ? 2.4 : 2} />
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
