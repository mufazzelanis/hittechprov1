"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "./CheckoutProvider";
import { navStart } from "./LoadingSystem";
import Logo from "./Logo";
import { Menu, X, Home, Wrench, Package, Users, Clock, User, Flame, ShoppingCart, Gift, Wand2, ChevronDown } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const DOT = (
  <span className="relative flex w-3 h-3 mx-[2px]" aria-hidden>
    <span className="absolute inline-flex w-full h-full rounded-full bg-brand opacity-75 animate-ping" />
    <span className="relative inline-flex w-3 h-3 rounded-full bg-brand" />
  </span>
);

// "Exclusive Deals" is a dropdown: itself, plus the AI Prompt Vault tucked inside it.
const ALL_LINKS = [
  { label: "Home", href: "/", icon: Home },
  { label: "Single Tools", href: "/tools", icon: Wrench },
  { label: "Group Tools", href: "/#bundles", icon: Package },
  {
    label: "Exclusive Deals", icon: Flame, dot: true,
    children: [
      { label: "Exclusive Deals", href: "/tools?cat=Personal", icon: Flame, dot: true, desc: "Personal tools, not shared" },
      { label: "Prompt Vault", href: "/prompts", icon: Wand2, soonKey: "prompts", desc: "AI prompts for ChatGPT, Midjourney" },
    ],
  },
  { label: "Free Offers", href: "/free-offers", icon: Gift, soonKey: "offers" },
  { label: "Affiliate", href: "/affiliate", icon: Users, soonKey: "affiliate" },
  { label: "Tool Limits", href: "/limits", icon: Clock },
];

export default function Nav({ name = "HiT Tech Pro", logo = "", affiliate = true, offers = true, prompts = true }) {
  const links = ALL_LINKS;
  const path = usePathname();
  const router = useRouter();
  const cart = useCart();
  const soonOn = { affiliate, offers, prompts };
  const isSoon = (l) => l.soonKey && !soonOn[l.soonKey];
  const openCart = () => (cart.items.length ? cart.checkout() : (navStart(), router.push("/tools")));
  const cartBtn = (
    <button onClick={openCart} aria-label={`Basket, ${cart.items.length} items`} className="relative min-w-[44px] min-h-[44px] flex items-center justify-center text-mist hover:text-fg">
      <ShoppingCart size={20} />
      {cart.items.length > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-brand text-[10px] font-bold flex items-center justify-center">{cart.items.length}</span>}
    </button>
  );
  const [open, setOpen] = useState(false);
  const [mobileSub, setMobileSub] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const [first, ...rest] = name.split(" ");
  const isActive = (h) => (h === "/" ? path === "/" : !h.includes("#") && !h.includes("?") && path.startsWith(h));

  const Soon = () => <span className="text-[9px] font-bold uppercase tracking-wide bg-brand/20 text-brand px-1.5 py-0.5 rounded">Soon</span>;

  return (
    <header style={{ paddingTop: "env(safe-area-inset-top)" }} className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled || path !== "/" ? "bg-ink/85 backdrop-blur-md border-b border-line" : "bg-transparent"}`}>
      <nav className="container-x flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2 font-display font-bold text-lg whitespace-nowrap">
          <Logo src={logo} className="h-8" />
          {first} <span className="text-brand">{rest.join(" ")}</span>
        </Link>

        <div className="hidden xl:flex items-center gap-1 text-sm">
          {links.map((l) =>
            l.children ? (
              <DesktopDropdown key={l.label} item={l} active={l.children.some((c) => isActive(c.href))} isSoon={isSoon} Soon={Soon} />
            ) : (
              <Link key={l.label} href={l.href} className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg whitespace-nowrap transition-colors ${isActive(l.href) ? "bg-brand/15 text-brand" : "text-mist hover:text-fg"}`}>
                {l.dot ? DOT : <l.icon size={14} className="hidden 2xl:block" />} {l.label}
                {isSoon(l) && <Soon />}
              </Link>
            )
          )}
        </div>

        <div className="hidden xl:flex items-center gap-2">
          {cartBtn}
          <ThemeToggle />
          <Link href="/account" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand hover:bg-brand-dark transition-colors text-sm font-semibold whitespace-nowrap text-white">
          <User size={15} /> Client Area
          </Link>
        </div>

        <div className="xl:hidden flex items-center gap-1">
          {cartBtn}
        <button onClick={() => setOpen((o) => !o)} aria-label="Toggle menu" aria-expanded={open} className="min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
        </div>
      </nav>

      {open && (
        <div className="xl:hidden bg-panel border-t border-line px-5 py-4 flex flex-col gap-1 max-h-[calc(100dvh-4rem)] overflow-y-auto">
          {links.map((l) =>
            l.children ? (
              <div key={l.label}>
                <button type="button" onClick={() => setMobileSub((s) => !s)} aria-expanded={mobileSub} className="w-full flex items-center gap-3 py-2.5 text-mist hover:text-fg">
                  {l.dot ? DOT : <l.icon size={16} />} {l.label}
                  <ChevronDown size={15} className={`ml-auto transition-transform ${mobileSub ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence initial={false}>
                  {mobileSub && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pl-4 border-l border-line ml-3">
                      {l.children.map((c) => (
                        <Link key={c.label} href={c.href} onClick={() => { setOpen(false); setMobileSub(false); }} className="flex items-center gap-3 py-2.5 text-mist hover:text-fg">
                          {c.dot ? DOT : <c.icon size={16} />} {c.label}
                          {isSoon(c) && <Soon />}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link key={l.label} href={l.href} onClick={() => setOpen(false)} className="flex items-center gap-3 py-2.5 text-mist hover:text-fg">
                {l.dot ? DOT : <l.icon size={16} />} {l.label}
                {isSoon(l) && <Soon />}
              </Link>
            )
          )}
          <div className="flex items-center justify-between gap-3 mt-2 pt-3 border-t border-line">
            <span className="text-sm text-mist">Theme</span>
            <ThemeToggle />
          </div>
          <Link href="/account" onClick={() => setOpen(false)} className="mt-2 px-4 py-2.5 rounded-lg bg-brand text-center font-semibold text-white">Client Area</Link>
        </div>
      )}
    </header>
  );
}

// Click-to-open dropdown for a nav item with children (desktop only).
function DesktopDropdown({ item, active, isSoon, Soon }) {
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

  return (
    <div ref={ref} className="relative">
      <button
        type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu"
        className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg whitespace-nowrap transition-colors ${active || open ? "bg-brand/15 text-brand" : "text-mist hover:text-fg"}`}
      >
        {item.dot ? DOT : <item.icon size={14} className="hidden 2xl:block" />} {item.label}
        <ChevronDown size={13} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu" aria-label={item.label}
            initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-2 w-64 rounded-xl border border-line bg-panel p-1.5 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)]"
          >
            {item.children.map((c) => (
              <Link key={c.label} href={c.href} role="menuitem" onClick={() => setOpen(false)} className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-panel2 transition-colors">
                <span className="mt-0.5 shrink-0 text-brand">{c.dot ? DOT : <c.icon size={16} />}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-sm font-medium text-fg">{c.label}{isSoon(c) && <Soon />}</span>
                  {c.desc && <span className="block text-xs text-mist mt-0.5">{c.desc}</span>}
                </span>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
