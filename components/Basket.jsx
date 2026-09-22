"use client";

import Link from "next/link";
import { X, ShoppingBag } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "./CheckoutProvider";

export default function Basket() {
  const cart = useCart();
  const total = cart.items.reduce((n, x) => n + x.price, 0);

  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      {cart.items.length === 0 ? (
        <p className="text-sm text-mist">Your basket is empty. <Link href="/tools" className="text-brand underline">Continue shopping</Link></p>
      ) : (
        <>
          <ul className="divide-y divide-line">
            <AnimatePresence initial={false}>
              {cart.items.map((x) => (
                <motion.li key={x.type + x.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="flex items-center justify-between gap-2 py-2.5 text-sm">
                    <span className="min-w-0 truncate">{x.name}</span>
                    <span className="flex items-center gap-2 shrink-0">
                      <span className="text-mist">৳{x.price.toLocaleString()}</span>
                      <button onClick={() => cart.remove(x.type, x.id)} aria-label={`Remove ${x.name}`} className="p-2.5 -m-2.5 text-mist hover:text-red-400"><X size={14} /></button>
                    </span>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          <div className="flex justify-between font-semibold text-sm pt-3 border-t border-line">
            <span>Total</span><span className="text-brand">৳{total.toLocaleString()}</span>
          </div>
          <button onClick={cart.checkout} className="btn-primary w-full justify-center mt-3"><ShoppingBag size={15} /> Checkout</button>
        </>
      )}
    </div>
  );
}
