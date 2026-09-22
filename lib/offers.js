import jwt from "jsonwebtoken";
import { prisma } from "./db";

// Free offers live in the Setting table as JSON ("freeoffer:<id>") so no schema change is needed.
// Claims are stored as Leads (type "free-offer", message "[offer:<id>] <name>") so they also show in Admin -> Leads.
export const OFFER_PREFIX = "freeoffer:";
export const offerKey = (id) => OFFER_PREFIX + id;
export const claimTag = (id) => `[offer:${id}]`;
const JOIN_TYPES = ["telegram", "whatsapp", "facebook", "instagram", "youtube", "other"];

const int = (v, min, max, def) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
};

// "Join our channel" steps: only real http(s) links are kept, at most three.
function normalizeJoins(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((j) => ({
      type: JOIN_TYPES.includes(j?.type) ? j.type : "other",
      url: String(j?.url || "").trim().slice(0, 300),
      label: String(j?.label || "").trim().slice(0, 60),
    }))
    .filter((j) => /^https?:\/\/\S+$/i.test(j.url))
    .slice(0, 3);
}

export function normalizeOffer(o = {}) {
  return {
    name: String(o.name || "").trim().slice(0, 80),
    badge: String(o.badge ?? "FREE").trim().slice(0, 20),
    desc: String(o.desc || "").trim().slice(0, 400),
    image: String(o.image || "").trim().slice(0, 300),
    accent: /^#[0-9a-fA-F]{6}$/.test(o.accent || "") ? o.accent : "#E8352B",
    reward: String(o.reward || "").trim().slice(0, 600), // revealed only after a claim
    cta: String(o.cta || "").trim().slice(0, 30),
    joins: normalizeJoins(o.joins),
    max: int(o.max, 0, 1000000, 0), // 0 = unlimited
    ends: /^\d{4}-\d{2}-\d{2}$/.test(o.ends || "") ? o.ends : "",
    active: o.active === false || o.active === "false" ? false : true,
    sort: int(o.sort, 0, 100000, 0),
  };
}

export const isEnded = (o) => !!o.ends && Date.now() > new Date(o.ends + "T23:59:59").getTime();

// A claim on an offer with join steps must come with a token issued when the popup opened, and enough time
// must have passed for the visitor to open the channel(s). This stops instant scripted claims; it cannot
// prove they really joined (that needs a Telegram bot), so the handle they type is saved for manual checking.
import { jwtSecret } from "./secret";
const secret = jwtSecret;
export const signStart = (offerId) => jwt.sign({ o: offerId, k: "offer-start" }, secret(), { expiresIn: "2h" });
export function startAge(token, offerId) {
  try {
    const p = jwt.verify(String(token || ""), secret());
    if (p.k !== "offer-start" || p.o !== offerId) return null;
    return Math.floor(Date.now() / 1000) - p.iat;
  } catch {
    return null;
  }
}
export const MIN_SECONDS_PER_JOIN = 4;

export async function getOffers() {
  try {
    const [rows, leads] = await Promise.all([
      prisma.setting.findMany({ where: { key: { startsWith: OFFER_PREFIX } } }),
      prisma.lead.findMany({ where: { type: "free-offer" }, select: { message: true } }),
    ]);
    const counts = {};
    for (const l of leads) {
      const m = /^\[offer:([^\]]+)\]/.exec(l.message || "");
      if (m) counts[m[1]] = (counts[m[1]] || 0) + 1;
    }
    return rows
      .map((r) => {
        try {
          const id = r.key.slice(OFFER_PREFIX.length);
          return { id, ...normalizeOffer(JSON.parse(r.value)), created: JSON.parse(r.value).created || "", claims: counts[id] || 0 };
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.sort - b.sort || String(b.created).localeCompare(String(a.created)));
  } catch {
    return [];
  }
}
