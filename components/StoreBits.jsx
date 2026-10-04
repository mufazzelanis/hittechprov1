"use client";

import { useState } from "react";
import { ShoppingCart, Check, Zap, Loader2 } from "lucide-react";
import { flyToCart } from "@/lib/flyToCart";
import { useCart, useCheckout } from "./CheckoutProvider";
import FitImage from "./FitImage";

// Add-to-basket + Buy now for a template or a service package.
// item: { type: "product" | "service", id, name, price (৳), usd ($ or null), image }
export function BuyButtons({ item, buyLabel = "Buy now", className = "" }) {
  const cart = useCart();
  const checkout = useCheckout();
  const inCart = cart.items.some((x) => x.type === item.type && x.id === item.id);
  const [busy, setBusy] = useState(false);

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      <button type="button" onClick={() => checkout(item)} className="btn-primary px-6 py-3 flex-1 justify-center min-w-[150px]"><Zap size={16} /> {buyLabel}</button>
      <button
        type="button"
        disabled={busy}
        aria-busy={busy}
        onClick={(e) => {
          if (inCart) return cart.checkout();
          const btn = e.currentTarget;
          setBusy(true);
          setTimeout(() => { cart.add(item); flyToCart({ from: btn, image: item.image }); setBusy(false); }, 350);
        }}
        className="btn-ghost px-5 py-3 justify-center"
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : inCart ? <Check size={16} /> : <ShoppingCart size={16} />}
        {inCart ? "In basket" : "Add to basket"}
      </button>
    </div>
  );
}

// "Save" to Pinterest. A plain link (no Pinterest script on the page), opened in a small window.
export function PinButton({ url, image, description }) {
  if (!image) return null;
  const href = `https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=${encodeURIComponent(image)}&description=${encodeURIComponent(description || "")}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => { if (window.open(href, "pin", "width=750,height=620")) e.preventDefault(); }}
      className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white hover:brightness-110 transition"
      style={{ background: "#E60023" }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 0a12 12 0 0 0-4.37 23.17c-.1-.94-.2-2.4.04-3.43l1.4-5.96s-.36-.72-.36-1.78c0-1.67.97-2.92 2.17-2.92 1.02 0 1.52.77 1.52 1.69 0 1.03-.66 2.57-1 4-.28 1.19.6 2.17 1.78 2.17 2.13 0 3.77-2.25 3.77-5.5 0-2.87-2.06-4.88-5.01-4.88-3.41 0-5.42 2.56-5.42 5.21 0 1.03.4 2.14.9 2.74.1.12.11.22.08.34l-.33 1.37c-.05.22-.18.27-.4.16-1.5-.7-2.43-2.88-2.43-4.64 0-3.78 2.75-7.25 7.92-7.25 4.16 0 7.39 2.96 7.39 6.92 0 4.13-2.6 7.45-6.21 7.45-1.21 0-2.36-.63-2.75-1.38l-.75 2.85c-.27 1.04-1 2.35-1.49 3.15A12 12 0 1 0 12 0z" /></svg>
      Save
    </a>
  );
}

// Main image + thumbnails.
export function Gallery({ images, name, accent = "#E8352B" }) {
  const [i, setI] = useState(0);
  if (!images.length) {
    return (
      <div className="aspect-[4/3] rounded-2xl border border-line flex items-center justify-center font-display text-6xl font-bold text-white" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}66)` }}>
        {name.charAt(0)}
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <a href={images[i]} target="_blank" rel="noopener noreferrer" title="Open full size" className="block rounded-2xl border border-line overflow-hidden">
        <FitImage key={images[i]} src={images[i]} alt={`${name} preview ${i + 1}`} eager className="aspect-[4/3] w-full" />
      </a>
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((src, j) => (
            <button key={src + j} type="button" onClick={() => setI(j)} aria-label={`Show image ${j + 1}`} aria-current={i === j}
              className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${i === j ? "border-brand" : "border-line hover:border-mist"}`}>
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
