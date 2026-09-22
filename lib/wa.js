// WhatsApp helpers shared by server pages and client components (no server-only imports).

// Adds ?text=... so the chat opens with the message already typed. Works for wa.me links and wa.me-style URLs.
export function withText(href, text) {
  try {
    const u = new URL(href);
    u.searchParams.set("text", text);
    return u.toString();
  } catch {
    return href;
  }
}

// Fills {placeholders} in an admin-editable message template.
export const fillMsg = (tpl, vars) => String(tpl || "").replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));

// The WhatsApp entry from getChannels(), if it is switched on and filled in.
export const waChannel = (channels) => (channels || []).find((c) => c.key === "whatsapp") || null;
