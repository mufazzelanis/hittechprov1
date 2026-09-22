// Opens the "Coming soon" popup (mounted once in SiteShell) for a product that cannot be bought yet.
// Opens the product quick-view sheet (mounted once in SiteShell).
export const openTool = (tool) => {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("htp-tool", { detail: tool }));
};

export const openSoon = (name) => {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("htp-soon", { detail: { name } }));
};
