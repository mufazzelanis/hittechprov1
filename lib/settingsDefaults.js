// Default site settings + the field groups shown in Admin → Settings.
import { CONTENT_DEFAULTS } from "./content";

// Business settings. All page copy lives in lib/content.js and is merged in below.
const CORE = {
  siteName: "HiT Tech Pro",
  logo: "",
  favicon: "",
  // SEO
  siteUrl: "https://hittechpro.net",
  seoTitle: "HiT Tech Pro | Premium SEO, Design & AI Tools at Real Prices",
  seoDescription: "HiT Tech Pro (hittechpro.net): premium SEO, design and AI tools like Ahrefs, SEMrush, Canva Pro and CapCut Pro at real prices. Instant access, verified, 24/7 support.",
  seoKeywords: "HiT Tech Pro, hittechpro, hittechpro.net, group buy SEO tools, Ahrefs group buy, SEMrush group buy, Canva Pro price in Bangladesh, premium tools Bangladesh, cheap SEO tools",
  googleVerification: "",
  bingVerification: "",
  ogImage: "",
  gaId: "",
  // Facebook Pixel + Conversions API
  fbPixelId: "",
  fbCapiToken: "",
  fbTestCode: "",
  fbPurchaseMode: "order",
  startingPrice: "239",
  paymentInstructions:
    "Send the amount via bKash / Nagad / Rocket to 01XXXXXXXXX (Personal), then enter the Transaction ID below. We activate your access within minutes.",
  contactEmail: "admin@hittechpro.net",
  phone: "+8801XXXXXXXXX",
  address: "Dhaka, Bangladesh",
  whatsapp: "",
  telegram: "",
  messenger: "",
  // Chat widget switches: "true" shows the channel (when it also has a link/number), "false" hides it.
  chatWhatsappOn: "true",
  chatTelegramOn: "true",
  chatMessengerOn: "true",
  chatInstagramOn: "false",
  chatPhoneOn: "false",
  chatEmailOn: "true",
  facebook: "",
  instagram: "",
  linkedin: "",
  twitter: "",
  youtube: "",
  tiktok: "",
  pinterest: "",
  threads: "",
  discord: "",
  snapchat: "",
  reddit: "",
  // Footer social icon switches: each is independent of the chat widget's own channel toggles above, so
  // a link can be shown in the footer, in the chat widget, in both, or in neither. On by default - once a
  // URL is filled in for a platform it appears immediately; turn the switch off to hide it without erasing the link.
  socialFacebookOn: "true",
  socialInstagramOn: "true",
  socialXOn: "true",
  socialLinkedinOn: "true",
  socialYoutubeOn: "true",
  socialTiktokOn: "true",
  socialPinterestOn: "true",
  socialThreadsOn: "true",
  socialDiscordOn: "true",
  socialSnapchatOn: "true",
  socialRedditOn: "true",
  footerAbout:
    "HiT Tech Pro provides premium SEO tools and digital marketing solutions at affordable prices. Access professional-grade tools like Ahrefs, SEMrush and more to boost your online presence.",
  // Master switch for the whole affiliate program. Off = no page, no links, no tracking, no commission.
  affiliateOn: "false",
  // Master switch for the Free Offers page. Off = "Coming soon" page.
  freeOffersOn: "false",
  // Master switch for the AI Prompt Vault page. Off = "Coming soon" page.
  promptVaultOn: "false",
  // "Someone just bought this" trust popup (components/TrustPop.jsx). On by default; the display names
  // are illustrative, never real customer data. Min/max seconds control the gap between popups.
  salesPopOn: "true",
  salesPopMinSec: "10",
  salesPopMaxSec: "30",
  affCommission: "30",
  affRate: "10",
  paymentOptions: [
    "bKash|Send money to our personal bKash number|Send the amount via bKash (Send Money) to 01XXXXXXXXX, then enter the Transaction ID below.",
    "Nagad|Send money to our personal Nagad number|Send the amount via Nagad (Send Money) to 01XXXXXXXXX, then enter the Transaction ID below.",
    "Rocket|Send money to our personal Rocket number|Send the amount via Rocket to 01XXXXXXXXX-X, then enter the Transaction ID below.",
    "Bank Transfer|Deposit to our bank account|Bank: XXXX, Account name: XXXX, Account no: XXXX. Enter the deposit reference as the Transaction ID.",
    "Crypto (USDT)|USDT / BTC / ETH|Send to wallet XXXX (network TRC20), then paste the TXID below.",
  ].join(String.fromCharCode(10)),
  coupons: "",
  paymentLogos: "{}",
  affCookieDays: "30",
  affMinPayout: "500",
};

export const SETTING_DEFAULTS = { ...CORE, ...CONTENT_DEFAULTS };

export const SETTING_GROUPS = [
  {
    title: "Branding",
    hint: "Leave a field empty to use the default HiT Tech Pro artwork. Logo: a PNG/SVG with a transparent background looks best on the dark site. Favicon: a square image, 192x192 or larger.",
    fields: [
      ["siteName", "Site name"],
      ["logo", "Site logo (navbar, footer, admin)", "image"],
      ["favicon", "Favicon (browser tab and bookmarks)", "image"],
    ],
  },
  {
    title: "SEO & Google",
    hint: "Controls how your site appears in Google and when links are shared. After launch, add the site in Google Search Console, paste the verification code here, and submit your sitemap: your-domain/sitemap.xml",
    fields: [
      ["siteUrl", "Website address (live domain, with https://)"],
      ["seoTitle", "Home page title (about 60 characters)"],
      ["seoDescription", "Home page description (about 155 characters)", "textarea"],
      ["seoKeywords", "Keywords (comma separated)", "textarea"],
      ["googleVerification", "Google Search Console verification code"],
      ["bingVerification", "Bing Webmaster verification code"],
      ["gaId", "Google Analytics 4 Measurement ID (looks like G-XXXXXXXXXX)"],
      ["ogImage", "Share image for Facebook/WhatsApp/X (1200x630). Empty = default logo image", "image"],
    ],
  },
  {
    title: "Facebook Pixel & Conversions API",
    hint: "Pixel ID alone tracks in the browser. Add the Conversions API access token (Events Manager -> Settings) to also send events from the server, which survives ad-blockers and iOS limits. Use the Test event code while testing, then clear it.",
    fields: [
      ["fbPixelId", "Facebook Pixel ID (numbers only)"],
      ["fbCapiToken", "Conversions API access token (kept private)"],
      ["fbTestCode", "Test event code (optional, e.g. TEST12345)"],
      ["fbPurchaseMode", "Send 'Purchase' when: order or paid", "text", ""],
    ],
  },
  {
    title: "Affiliate program",
    master: "affiliateOn",
    hint: "Turn this on when you are ready to launch the affiliate program. While it is off the Affiliate page and menu link are hidden, referral links are not tracked and no commission is earned.",
    fields: [
      ["affCommission", "Max commission shown on site (%)"],
      ["affRate", "Actual commission rate paid (%)"],
      ["affCookieDays", "Cookie days"],
      ["affMinPayout", "Minimum payout (৳)"],
    ],
  },
  {
    title: "Checkout",
    fields: [
      ["paymentOptions", "Payment options (one per line: Name | Short description | Instructions)", "textarea"],
      ["paymentLogos", "Payment method logos", "paymentLogos"],
      ["coupons", "Coupons (one per line: CODE | 10%  or  CODE | 100 for ৳100 off)", "textarea"],
      ["paymentInstructions", "Payment instructions (shown to buyer)", "textarea"],
    ],
  },
  {
    title: "Contact & company",
    fields: [
      ["contactEmail", "Email", "text", "chatEmailOn"],
      ["phone", "Phone (call button)", "text", "chatPhoneOn"],
      ["address", "Address"],
      ["footerAbout", "Footer about text", "textarea"],
    ],
  },
  {
    title: "Chat widget & social channels",
    hint: "Use the switch on each channel to show or hide it in the chat widget. A channel also needs a number/link filled in to appear.",
    fields: [
      ["whatsapp", "WhatsApp (number with country code, or link)", "text", "chatWhatsappOn"],
      ["telegram", "Telegram (username or link)", "text", "chatTelegramOn"],
      ["messenger", "Messenger (page username or link)", "text", "chatMessengerOn"],
      ["instagram", "Instagram (username or link)", "text", "chatInstagramOn"],
      ["facebook", "Facebook page (footer icon)"],
      ["linkedin", "LinkedIn"],
      ["twitter", "X / Twitter"],
    ],
  },
];
