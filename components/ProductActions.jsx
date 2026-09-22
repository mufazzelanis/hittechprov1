"use client";

import { useState } from "react";
import { ShoppingCart, Check, Zap, Loader2, MessageCircle, Clock } from "lucide-react";
import { openSoon } from "@/lib/soon";
import { track } from "@/lib/track";
import { useCart, useCheckout } from "./CheckoutProvider";

export default function ProductActions({ tool, wa, soon, soonLabel }) {
  const cart = useCart();
  const checkout = useCheckout();
  const inCart = cart.items.some((x) => x.type === "tool" && x.id === tool.id);
  const [pop, setPop] = useState(false);
  const [busy, setBusy] = useState(false);
  const item = { type: "tool", id: tool.id, name: tool.name, price: tool.price, per: `/${tool.duration}`, image: tool.image || null, accent: tool.accent || null };

  return (
    <div className="flex flex-wrap gap-3">
      {soon ? (
        <button type="button" onClick={() => openSoon(tool.name)} className="inline-flex items-center gap-2 rounded-lg border border-amber-500/50 bg-amber-500/15 px-6 py-3 text-sm font-semibold text-amber-300 hover:bg-amber-500/25 transition-colors"><Clock size={16} className="animate-pulse" /> {soonLabel}</button>
      ) : (
      <>
      <button
        onClick={() => {
          if (inCart) return cart.checkout();
          setBusy(true);
          setTimeout(() => {
            cart.add(item);
            setBusy(false);
            setPop(true);
            setTimeout(() => setPop(false), 1500);
          }, 450);
        }}
        className="btn-primary px-6 py-3" disabled={busy} aria-busy={busy}
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : inCart ? <Check size={16} /> : <ShoppingCart size={16} />}
        {busy ? "Adding..." : inCart ? (pop ? "Added to basket" : "Checkout basket") : "Add to Cart"}
      </button>
      <button onClick={() => checkout(item)} className="btn-ghost px-6 py-3"><Zap size={16} /> Buy now</button>
      </>
      )}
      {wa && (
        <a href={wa.href} target="_blank" rel="noopener noreferrer" onClick={() => track("Contact", { content_name: "whatsapp", content_ids: [tool.id] })} className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white hover:brightness-110 transition" style={{ background: "linear-gradient(135deg,#2BE372,#0E9F6E)" }}>
          <MessageCircle size={16} /> {wa.label}
        </a>
      )}
    </div>
  );
}
