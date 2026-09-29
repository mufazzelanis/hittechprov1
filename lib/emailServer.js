import { promises as dns } from "dns";
import { checkEmail } from "./email";

// Domains that obviously receive mail - skip the DNS round trip.
const KNOWN = new Set(["gmail.com", "googlemail.com", "yahoo.com", "ymail.com", "hotmail.com", "outlook.com", "live.com", "msn.com", "icloud.com", "me.com", "proton.me", "protonmail.com", "aol.com", "zoho.com", "yandex.com", "gmx.com", "mail.com"]);

const cache = new Map(); // domain -> { at, result }
const TTL = 6 * 3600e3;

const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(Object.assign(new Error("timeout"), { code: "ETIMEOUT" })), ms))]);

// Can this domain receive email? "no" = it doesn't exist or has no mail server; "unknown" = DNS
// was unreachable, in which case we don't block a customer over our own network trouble.
async function domainMail(domain) {
  if (KNOWN.has(domain)) return "yes";
  const hit = cache.get(domain);
  if (hit && Date.now() - hit.at < TTL) return hit.result;
  let result;
  try {
    const mx = await withTimeout(dns.resolveMx(domain), 4000);
    // RFC 7505 "null MX" (a single "." exchange) means the domain explicitly accepts no mail.
    result = mx.some((r) => r.exchange && r.exchange !== ".") ? "yes" : "no";
  } catch (e) {
    if (e.code === "ENOTFOUND") result = "no"; // the domain isn't registered at all
    else if (e.code === "ENODATA") result = "no-mx"; // it exists (maybe a website) but has no mail server
    else result = "unknown";
  }
  if (result !== "unknown") cache.set(domain, { at: Date.now(), result });
  if (cache.size > 5000) cache.clear();
  return result;
}

/** Full check: the offline rules plus a live DNS lookup of the domain's mail servers. */
export async function verifyEmail(raw) {
  const r = checkEmail(raw);
  if (r.status === "error" || r.status === "empty") return r;
  const mail = await domainMail(r.domain);
  if (mail === "no") {
    r.messages = [{ type: "error", text: `"${r.domain}" does not exist or cannot receive email. Check the spelling after the "@".` }];
  } else if (mail === "no-mx") {
    r.messages = [{ type: "error", text: `"${r.domain}" has no mail server set up, so it cannot receive email. Use a different address.` }];
  } else if (mail === "yes") {
    r.messages.unshift({ type: "ok", text: `Email domain verified - ${r.domain} accepts email.` });
  }
  r.status = r.messages.some((m) => m.type === "error") ? "error" : r.messages.some((m) => m.type === "warn") ? "warn" : "ok";
  r.dns = mail;
  return r;
}
