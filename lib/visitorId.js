// A stable per-browser id (localStorage, not a cookie - nothing server-rendered needs it). Every page
// view and every form submit (order, lead, offer claim) sends the same id, so the admin can see a
// visitor's whole path through the site and, once they identify themselves, who they turned out to be.
const KEY = "htp_vid";

export function getVisitorId() {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}
