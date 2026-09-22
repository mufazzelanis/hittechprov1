// Browser-side tracking helper. One call fans out to:
//  - Facebook Pixel (+ Conversions API mirror with the same event id so Meta counts it once)
//  - Google Analytics 4 (gtag), with the event names GA4 expects
// Does nothing when neither is configured (<html data-fbp / data-ga> are set by the layout) or inside the admin panel.
const GA = {
  PageView: "page_view",
  ViewContent: "view_item",
  AddToCart: "add_to_cart",
  InitiateCheckout: "begin_checkout",
  Purchase: "purchase",
  Lead: "generate_lead",
  Contact: "contact",
  CompleteRegistration: "sign_up",
};

function gaParams(name, d) {
  const ids = Array.isArray(d.content_ids) ? d.content_ids : [];
  const p = { currency: d.currency, value: d.value };
  if (name === "PageView") return { page_location: location.href, page_path: location.pathname, page_title: document.title };
  if (ids.length) p.items = ids.map((id) => ({ item_id: String(id), item_name: ids.length === 1 ? d.content_name : undefined, price: ids.length === 1 ? d.value : undefined, quantity: 1 }));
  if (name === "Purchase") p.transaction_id = d.order_id;
  if (name === "Lead" || name === "Contact") p.method = d.content_name;
  return p;
}

export function track(name, data = {}, { server = true, eventId, fb = true } = {}) {
  if (typeof window === "undefined" || location.pathname.startsWith("/admin")) return;
  const de = document.documentElement.dataset;
  const id = eventId || `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  if (de.fbp && fb) {
    let tries = 0;
    const fire = () => {
      if (typeof window.fbq === "function") window.fbq("track", name, data, { eventID: id });
      else if (tries++ < 20) setTimeout(fire, 300); // Pixel script still loading
    };
    fire();
    if (server) {
      fetch("/api/fb-event", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, eventId: id, url: location.href, data }), keepalive: true }).catch(() => {});
    }
  }

  if (de.ga && GA[name]) {
    let tries = 0;
    const send = () => {
      if (typeof window.gtag === "function") window.gtag("event", GA[name], gaParams(name, data));
      else if (tries++ < 20) setTimeout(send, 300);
    };
    send();
  }
  return id;
}
