// Settings page structure (tabs, blocks, fields). Shared by the Settings editor and the admin global search.
// Field icons are brand-logo names; tab icons are attached in components/admin/SettingsForm.jsx.
import { SOCIAL_PLATFORMS } from "./socials";

export const SETTINGS_TABS = [
  {
    id: "general", label: "General", desc: "Name, logo and contact details",
    blocks: [
      { title: "Branding", hint: "Leave a field empty to use the default HiT Tech Pro artwork. Logo: a PNG/SVG with a transparent background looks best on the dark site. Favicon: a square image, 192x192 or larger.", fields: [
        { key: "siteName", label: "Site name" },
        { key: "logo", label: "Site logo (navbar, footer, admin)", type: "image" },
        { key: "favicon", label: "Favicon (browser tab and bookmarks)", type: "image" },
      ] },
      { title: "Contact & company", fields: [
        { key: "contactEmail", label: "Email", toggle: "chatEmailOn", placeholder: "you@domain.com" },
        { key: "phone", label: "Phone (call button)", toggle: "chatPhoneOn", placeholder: "+8801XXXXXXXXX" },
        { key: "address", label: "Address" },
        { key: "footerAbout", label: "Footer about text", type: "textarea", max: 260 },
      ] },
    ],
  },
  {
    id: "seo", label: "SEO & Tracking", desc: "Google, Pixel and analytics",
    blocks: [
      { title: "SEO & Google", hint: "Controls how your site appears in Google and when links are shared. After launch, add the site in Google Search Console, paste the verification code here, and submit your sitemap: your-domain/sitemap.xml", fields: [
        { key: "siteUrl", label: "Website address (live domain, with https://)", placeholder: "https://hittechpro.net" },
        { key: "seoTitle", label: "Home page title", max: 60 },
        { key: "seoDescription", label: "Home page description", type: "textarea", max: 155 },
        { key: "seoKeywords", label: "Keywords (comma separated)", type: "textarea" },
        { key: "googleVerification", label: "Google Search Console verification code" },
        { key: "bingVerification", label: "Bing Webmaster verification code" },
        { key: "gaId", label: "Google Analytics 4 Measurement ID", placeholder: "G-XXXXXXXXXX" },
        { key: "ogImage", label: "Share image for Facebook/WhatsApp/X (1200x630). Empty = default logo image", type: "image" },
      ], custom: "seoPreview" },
      { title: "Facebook Pixel & Conversions API", hint: "Pixel ID alone tracks in the browser. Add the Conversions API access token (Events Manager -> Settings) to also send events from the server, which survives ad-blockers and iOS limits. Use the Test event code while testing, then clear it.", fields: [
        { key: "fbPixelId", label: "Facebook Pixel ID (numbers only)", placeholder: "1234567890" },
        { key: "fbCapiToken", label: "Conversions API access token (kept private)", type: "secret" },
        { key: "fbTestCode", label: "Test event code (optional)", placeholder: "TEST12345" },
        { key: "fbPurchaseMode", label: "Send 'Purchase' when", type: "select", options: [["order", "An order is placed"], ["paid", "An order is marked paid"]] },
      ] },
    ],
  },
  {
    id: "payments", label: "Payments", desc: "Methods, logos and coupons",
    blocks: [
      { custom: "payments", keys: ["paymentOptions", "paymentLogos"] },
      { custom: "coupons", keys: ["coupons"] },
      { title: "Default payment instructions", hint: "Shown for any method that has no instructions of its own.", fields: [
        { key: "paymentInstructions", label: "Payment instructions (shown to buyer)", type: "textarea" },
      ] },
    ],
  },
  {
    id: "channels", label: "Chat & Social", desc: "WhatsApp, Telegram, social links",
    blocks: [
      { title: "Chat widget channels", hint: "Use the switch on each channel to show or hide it in the chat widget. A channel also needs a number or link to appear.", fields: [
        { key: "whatsapp", label: "WhatsApp", hintText: "Number with country code, or a link", toggle: "chatWhatsappOn", icon: "whatsapp", placeholder: "+8801XXXXXXXXX" },
        { key: "telegram", label: "Telegram", hintText: "Username or link", toggle: "chatTelegramOn", icon: "telegram", placeholder: "@yourchannel" },
        { key: "messenger", label: "Messenger", hintText: "Page username or link", toggle: "chatMessengerOn", icon: "messenger", placeholder: "yourpage" },
        { key: "instagram", label: "Instagram", hintText: "Username or link", toggle: "chatInstagramOn", icon: "instagram", placeholder: "@yourname" },
      ] },
      { title: "Footer social icons", hint: "Every platform here has its own switch, separate from the chat channels above. A platform needs both the switch on and a link filled in to appear in the footer.", fields: SOCIAL_PLATFORMS.map((p) => ({ key: p.key, label: p.label, toggle: p.toggle, icon: p.icon, placeholder: p.placeholder })) },
    ],
  },
  {
    id: "affiliate", label: "Affiliate", desc: "Program switch and commission",
    blocks: [
      { title: "Affiliate program", master: "affiliateOn", hint: "Turn this on when you are ready to launch the affiliate program. While it is off the Affiliate page and menu link are hidden, referral links are not tracked and no commission is earned.", fields: [
        { key: "affCommission", label: "Max commission shown on site (%)", type: "number" },
        { key: "affRate", label: "Actual commission rate paid (%)", type: "number" },
        { key: "affCookieDays", label: "Cookie days", type: "number" },
        { key: "affMinPayout", label: "Minimum payout (৳)", type: "number" },
      ] },
    ],
  },
  {
    id: "trust", label: "Trust Popup", desc: "\"Someone just bought this\" notifications",
    blocks: [
      { title: "Trust popup", master: "salesPopOn", hint: "A small card in the bottom-left corner that cycles through tools people are currently buying, to build trust for new visitors. It only ever suggests real, currently-buyable tools (never a Coming soon or paused one) and leans towards tools getting more views. The display names shown are illustrative, not real customer data.", fields: [
        { key: "salesPopMinSec", label: "Minimum gap between popups (seconds)", type: "number" },
        { key: "salesPopMaxSec", label: "Maximum gap between popups (seconds)", type: "number" },
      ] },
    ],
  },
  { id: "security", label: "Security", desc: "Admin password and backup", blocks: [{ custom: "security", keys: [] }] },
];
