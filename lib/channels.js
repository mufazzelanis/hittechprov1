// Turns the admin settings into the list of contact channels that are switched on AND filled in.
const clean = (v) => String(v || "").trim();
const isUrl = (v) => /^https?:\/\//i.test(v);
const handle = (v) => v.replace(/^@/, "").replace(/\s+/g, "");

export function getChannels(s) {
  const on = (k) => s[k] !== "false";
  const out = [];

  const wa = clean(s.whatsapp);
  if (on("chatWhatsappOn") && wa) out.push({ key: "whatsapp", label: "WhatsApp", sub: isUrl(wa) ? "Chat on WhatsApp" : wa, href: isUrl(wa) ? wa : `https://wa.me/${wa.replace(/\D/g, "")}` });

  const tg = clean(s.telegram);
  if (on("chatTelegramOn") && tg) out.push({ key: "telegram", label: "Telegram", sub: isUrl(tg) ? "Chat on Telegram" : `@${handle(tg)}`, href: isUrl(tg) ? tg : `https://t.me/${handle(tg)}` });

  const ms = clean(s.messenger);
  if (on("chatMessengerOn") && ms) out.push({ key: "messenger", label: "Messenger", sub: isUrl(ms) ? "Chat on Messenger" : handle(ms), href: isUrl(ms) ? ms : `https://m.me/${handle(ms)}` });

  const ig = clean(s.instagram);
  if (on("chatInstagramOn") && ig) out.push({ key: "instagram", label: "Instagram", sub: isUrl(ig) ? "Message on Instagram" : `@${handle(ig)}`, href: isUrl(ig) ? ig : `https://instagram.com/${handle(ig)}` });

  const ph = clean(s.phone);
  if (on("chatPhoneOn") && ph) out.push({ key: "phone", label: "Call us", sub: ph, href: `tel:${ph.replace(/[^\d+]/g, "")}` });

  const em = clean(s.contactEmail);
  if (on("chatEmailOn") && em) out.push({ key: "email", label: "Email", sub: em, href: `mailto:${em}` });

  return out;
}
