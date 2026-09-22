"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/track";
import { navStart } from "./LoadingSystem";
import { openSoon } from "@/lib/soon";

// Basket state, shared by every page (mounted once in app/layout.js).
// The basket lives in this browser (localStorage); prices are re-read from the database at checkout.
const CartCtx = createContext({ items: [], ready: false, add() {}, remove() {}, clear() {}, checkout() {} });
const OpenCtx = createContext(() => {});

// useCheckout() -> "buy this now": adds the item to the basket and goes to /checkout.
export const useCheckout = () => useContext(OpenCtx);
export const useCart = () => useContext(CartCtx);

const KEY = "htp_cart";
const same = (a, b) => a.type === b.type && a.id === b.id;

function read() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(raw) ? raw.slice(0, 20) : [];
  } catch {
    return [];
  }
}
function write(items) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {}
}

export default function CartProvider({ children }) {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(read());
    setReady(true);
    const onStorage = (e) => e.key === KEY && setItems(read());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);


  // Write synchronously so a navigation right after add() never loses the item.
  const commit = useCallback((next) => {
    write(next);
    setItems(next);
  }, []);

  // A product switched to "Coming soon" cannot stay in a basket: drop it and tell the buyer.
  useEffect(() => {
    if (!ready) return;
    fetch("/api/soon", { cache: "no-store" })
      .then((r) => r.json())
      .then(({ ids = [] }) => {
        const cur = read();
        const gone = cur.filter((x) => ids.includes(x.id));
        if (!gone.length) return;
        commit(cur.filter((x) => !ids.includes(x.id)));
        openSoon(gone[0].name);
      })
      .catch(() => {});
  }, [ready, commit]);

  const add = useCallback(
    (it) => {
      const cur = read();
      if (!cur.some((x) => same(x, it))) {
        commit([...cur, it].slice(0, 20));
        track("AddToCart", { content_ids: [it.id], content_name: it.name, content_type: "product", value: it.price, currency: "BDT" });
      }
    },
    [commit]
  );
  const remove = useCallback((type, id) => commit(read().filter((x) => !same(x, { type, id }))), [commit]);
  const clear = useCallback(() => commit([]), [commit]);
  const checkout = useCallback(() => {
    navStart();
    router.push("/checkout");
  }, [router]);
  const buyNow = useCallback(
    (it) => {
      add(it);
      navStart();
      router.push("/checkout");
    },
    [add, router]
  );

  return (
    <OpenCtx.Provider value={buyNow}>
      <CartCtx.Provider value={{ items, ready, add, remove, clear, checkout }}>{children}</CartCtx.Provider>
    </OpenCtx.Provider>
  );
}
