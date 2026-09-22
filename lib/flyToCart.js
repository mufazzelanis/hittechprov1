// "Add to cart" theater: flings a small clone of the product image from the button that was
// clicked to the basket icon in the nav (whichever one is actually visible, desktop or mobile),
// then tells the icon to bump. Purely cosmetic - safe to no-op if the nav icon isn't mounted yet.
export function flyToCart({ from, image }) {
  if (typeof window === "undefined" || !from) return;

  let target = null;
  for (const el of document.querySelectorAll("[data-cart-icon]")) {
    if (el.offsetParent !== null) { target = el; break; }
  }
  if (!target) return;

  const fromRect = from.getBoundingClientRect();
  const toRect = target.getBoundingClientRect();
  const size = 44;

  const el = document.createElement("div");
  el.style.cssText = `position:fixed;top:0;left:0;width:${size}px;height:${size}px;border-radius:12px;overflow:hidden;z-index:9999;pointer-events:none;box-shadow:0 12px 30px rgba(0,0,0,.45);background:rgb(232 53 43);`;
  if (image) {
    const img = document.createElement("img");
    img.src = image;
    img.style.cssText = "width:100%;height:100%;object-fit:cover;display:block;";
    el.appendChild(img);
  }
  document.body.appendChild(el);

  const startX = fromRect.left + fromRect.width / 2 - size / 2;
  const startY = fromRect.top + fromRect.height / 2 - size / 2;
  const endX = toRect.left + toRect.width / 2 - size / 2;
  const endY = toRect.top + toRect.height / 2 - size / 2;
  const midX = (startX + endX) / 2;
  const midY = Math.min(startY, endY) - Math.max(100, Math.abs(startY - endY) * 0.5);

  const anim = el.animate(
    [
      { transform: `translate(${startX}px, ${startY}px) scale(1) rotate(0deg)`, opacity: 1, offset: 0 },
      { transform: `translate(${midX}px, ${midY}px) scale(0.75) rotate(20deg)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${endX}px, ${endY}px) scale(0.15) rotate(35deg)`, opacity: 0.4, offset: 1 },
    ],
    { duration: 750, easing: "cubic-bezier(.32,.64,.35,1)", fill: "forwards" }
  );

  const finish = () => {
    el.remove();
    window.dispatchEvent(new CustomEvent("cart:bump"));
  };
  anim.onfinish = finish;
  anim.oncancel = finish;
}
