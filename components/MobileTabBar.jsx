"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Wrench, Flame, ShoppingCart, User } from "lucide-react";
import { useCart } from "./CheckoutProvider";

const TABS = [
  { href: "/", label: "Home", icon: Home, match: (p) => p === "/" },
  { href: "/tools", label: "Tools", icon: Wrench, match: (p) => p === "/tools" || p.startsWith("/tool/") },
  { href: "/tools?cat=Personal", label: "Deals", icon: Flame, live: true, match: () => false },
  { href: "/checkout", label: "Basket", icon: ShoppingCart, badge: true, match: (p) => p.startsWith("/checkout") },
  { href: "/account", label: "Account", icon: User, match: (p) => p.startsWith("/account") || p.startsWith("/login") },
];

// App-style bottom navigation for phones and small tablets. Hidden from lg upwards.
export default function MobileTabBar() {
  const path = usePathname();
  const cart = useCart();

  return (
    <nav
      aria-label="Main"
      className="xl:hidden fixed bottom-0 inset-x-0 z-50 border-t border-line bg-ink/92 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5 max-w-xl mx-auto">
        {TABS.map((t) => {
          const on = t.match(path);
          return (
            <li key={t.label}>
              <Link href={t.href} aria-current={on ? "page" : undefined} className="relative flex flex-col items-center justify-center gap-1 h-[58px] text-[10px] font-medium">
                {on && <motion.span layoutId="tab-pill" className="absolute top-0 h-0.5 w-8 rounded-full bg-brand" />}
                <span className={`relative ${on ? "text-brand" : "text-mist"}`}>
                  <t.icon size={21} strokeWidth={on ? 2.4 : 2} />
                  {t.live && (
                    <span className="absolute -top-0.5 -right-1 flex w-2 h-2" aria-hidden>
                      <span className="absolute inline-flex w-full h-full rounded-full bg-brand opacity-75 animate-ping" />
                      <span className="relative inline-flex w-2 h-2 rounded-full bg-brand" />
                    </span>
                  )}
                  {t.badge && cart.items.length > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-brand text-white text-[9px] font-bold flex items-center justify-center">{cart.items.length}</span>
                  )}
                </span>
                <span className={on ? "text-fg" : "text-mist"}>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
