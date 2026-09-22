// Canonical list of footer social-media platforms: shared by the Settings editor (lib/settingsSchema.js),
// the setting defaults (lib/settingsDefaults.js) and the public footer (components/Footer.jsx). Adding a
// platform means adding one row here (plus its icon in components/BrandLogo.jsx) - nowhere else.
// `key` is the URL setting; `toggle` is its own on/off switch, independent of the chat widget's channel
// toggles (facebook/instagram/etc. URLs can be shared, but a platform can be shown in the footer while
// hidden from - or absent from - the chat widget, and vice versa).
export const SOCIAL_PLATFORMS = [
  { key: "facebook", toggle: "socialFacebookOn", icon: "facebook", label: "Facebook", placeholder: "https://facebook.com/..." },
  { key: "instagram", toggle: "socialInstagramOn", icon: "instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
  { key: "twitter", toggle: "socialXOn", icon: "x", label: "X / Twitter", placeholder: "https://x.com/..." },
  { key: "linkedin", toggle: "socialLinkedinOn", icon: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/..." },
  { key: "youtube", toggle: "socialYoutubeOn", icon: "youtube", label: "YouTube", placeholder: "https://youtube.com/@..." },
  { key: "tiktok", toggle: "socialTiktokOn", icon: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@..." },
  { key: "pinterest", toggle: "socialPinterestOn", icon: "pinterest", label: "Pinterest", placeholder: "https://pinterest.com/..." },
  { key: "threads", toggle: "socialThreadsOn", icon: "threads", label: "Threads", placeholder: "https://threads.net/@..." },
  { key: "discord", toggle: "socialDiscordOn", icon: "discord", label: "Discord", placeholder: "https://discord.gg/..." },
  { key: "snapchat", toggle: "socialSnapchatOn", icon: "snapchat", label: "Snapchat", placeholder: "https://snapchat.com/add/..." },
  { key: "reddit", toggle: "socialRedditOn", icon: "reddit", label: "Reddit", placeholder: "https://reddit.com/r/..." },
];

const clean = (v) => String(v || "").trim();

// Only a platform that is BOTH switched on AND has a link filled in ever reaches the footer - so an
// empty field never renders a dead "#" icon, and a filled-in field can still be hidden with the switch.
export function getSocialLinks(s) {
  return SOCIAL_PLATFORMS.filter((p) => s[p.toggle] !== "false" && clean(s[p.key])).map((p) => ({ key: p.icon, label: p.label, href: clean(s[p.key]) }));
}
