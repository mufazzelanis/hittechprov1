// Email checker shared by the checkout form (live feedback) and the server. This file runs in the
// browser too, so it only does offline checks; the domain's mail (MX) records are looked up by
// lib/emailServer.js. Neither can prove the inbox belongs to the user - that needs a sent code.

// Throwaway inbox services. Matched on the domain and on any parent domain (x.mailinator.com).
const DISPOSABLE = new Set(`
mailinator.com mailinator.net mailinator.org mailinater.com guerrillamail.com guerrillamail.net guerrillamail.org
guerrillamail.biz guerrillamail.de guerrillamailblock.com sharklasers.com grr.la pokemail.net spam4.me
10minutemail.com 10minutemail.net 10minutemail.co.uk 10minemail.com 20minutemail.com 30minutemail.com
tempmail.com temp-mail.org temp-mail.io tempmail.net tempmail.dev tempmailo.com tempmail.plus tempmailaddress.com
tempinbox.com tempr.email tempail.com temp-mail.ru tmpmail.org tmpmail.net tmpeml.com tmails.net
throwawaymail.com throwaway.email trashmail.com trashmail.net trashmail.de trashmail.me trash-mail.com
yopmail.com yopmail.net yopmail.fr cool.fr.nf jetable.fr.nf nospam.ze.tc nomail.xl.cx mega.zik.dj speed.1s.fr
getnada.com nada.email dispostable.com disposablemail.com mailnesia.com maildrop.cc mailcatch.com
mintemail.com mohmal.com emailondeck.com fakeinbox.com fakemail.net fakemailgenerator.com fake-mail.net
getairmail.com airmail.cc spamgourmet.com spambox.us spamfree24.org mytrashmail.com mt2015.com
mailforspam.com mailexpire.com incognitomail.org anonbox.net anonymbox.com burnermail.io
33mail.com emailfake.com email-fake.com fakemail.fr crazymailing.com discard.email discardmail.com
dropmail.me 1secmail.com 1secmail.net 1secmail.org esiix.com wwjmp.com xojxe.com yoggm.com
mail.tm mail.gw inboxkitten.com linshiyouxiang.net moakt.com moakt.cc tmail.ws tmailor.com
harakirimail.com mailpoof.com emailtemporanea.net correotemporal.org spamdecoy.net mvrht.net
luxusmail.org owlymail.com minuteinbox.com inboxbear.com mailsac.com mail7.io tempm.com
guerrillamail.info kurzepost.de objectmail.com proxymail.eu rcpt.at trash2009.com wegwerfmail.de
wegwerfmail.net wegwerfemail.de einrot.com sofort-mail.de emailsensei.com mailbox52.ga
spamherelots.com thisisnotmyrealemail.com dodgit.com mailmetrash.com trbvm.com byom.de
cuvox.de dayrep.com einrot.de fleckens.hu gustr.com jourrapide.com rhyta.com superrito.com teleworm.us
armyspy.com vomoto.com emlhub.com emltmp.com emlpro.com tempmailin.com tempmail.us.com
`.trim().split(/\s+/));

// Domains that exist only for documentation or testing.
const PLACEHOLDER = new Set(["example.com", "example.org", "example.net", "test.com", "test.org", "domain.com", "email.test", "mail.test", "localhost", "invalid", "sample.com", "yourdomain.com", "yourmail.com", "abc.com", "xyz.com", "asdf.com", "qwerty.com", "fake.com", "noemail.com", "nomail.com", "none.com"]);

// Common misspellings of the big providers -> the domain the user almost certainly meant.
const TYPOS = {
  "gmail.co": "gmail.com", "gmail.cm": "gmail.com", "gmail.con": "gmail.com", "gmail.cmo": "gmail.com", "gmail.om": "gmail.com",
  "gmail.comm": "gmail.com", "gmail.coom": "gmail.com", "gmail.c": "gmail.com", "gmail.in": "gmail.com", "gmail.net": "gmail.com",
  "gmail.org": "gmail.com", "gmail.bd": "gmail.com", "gmail.com.bd": "gmail.com", "gamil.com": "gmail.com", "gmial.com": "gmail.com",
  "gmai.com": "gmail.com", "gmal.com": "gmail.com", "gmil.com": "gmail.com", "gnail.com": "gmail.com", "gmaill.com": "gmail.com",
  "gmaail.com": "gmail.com", "ggmail.com": "gmail.com", "gimail.com": "gmail.com", "gemail.com": "gmail.com", "gmali.com": "gmail.com",
  "gmsil.com": "gmail.com", "gmaik.com": "gmail.com", "gmaul.com": "gmail.com", "gmeil.com": "gmail.com", "hmail.com": "gmail.com",
  "fmail.com": "gmail.com", "gamail.com": "gmail.com", "g.mail.com": "gmail.com", "googlemail.co": "googlemail.com",
  "yahoo.co": "yahoo.com", "yahoo.cm": "yahoo.com", "yahoo.con": "yahoo.com", "yaho.com": "yahoo.com", "yahooo.com": "yahoo.com",
  "yhoo.com": "yahoo.com", "yahho.com": "yahoo.com", "yaoo.com": "yahoo.com", "ymail.co": "ymail.com",
  "hotmail.co": "hotmail.com", "hotmail.cm": "hotmail.com", "hotmail.con": "hotmail.com", "hotmal.com": "hotmail.com",
  "hotmial.com": "hotmail.com", "hotmai.com": "hotmail.com", "hotmil.com": "hotmail.com", "hotmaill.com": "hotmail.com",
  "hotamil.com": "hotmail.com", "homail.com": "hotmail.com", "htmail.com": "hotmail.com",
  "outlook.co": "outlook.com", "outlook.cm": "outlook.com", "outlook.con": "outlook.com", "outlok.com": "outlook.com",
  "outloo.com": "outlook.com", "outllook.com": "outlook.com", "otlook.com": "outlook.com", "outlool.com": "outlook.com",
  "icloud.co": "icloud.com", "icloud.con": "icloud.com", "iclod.com": "icloud.com", "icoud.com": "icloud.com", "icluod.com": "icloud.com",
  "live.co": "live.com", "live.con": "live.com", "protonmail.co": "protonmail.com", "proton.me.com": "proton.me",
};

// Local parts people type to get past a required field.
const FAKE_LOCAL = /^(test\d*|testing\d*|tester|fake\d*|fakeemail|asdf+\w*|qwert\w*|abc\d*|abcd\w*|xyz\d*|aaa+|bbb+|xxx+|zzz+|none|no|na|n\/a|noemail|nomail|noreply|no-reply|donotreply|example|sample|demo|dummy|null|nobody|anonymous|anon|user\d*|email\d*|mail\d*|someone|something|name|myemail|my\.?email|your\.?email|yourname|hello|hi|temp\d*|spam\d*|junk\d*|\d+|(.)\2{3,})$/i;

export function suggestEmail(email) {
  const [local, domain] = String(email || "").trim().toLowerCase().split("@");
  return local && TYPOS[domain] ? `${local}@${TYPOS[domain]}` : "";
}

export function isDisposable(domain) {
  const parts = String(domain || "").toLowerCase().split(".");
  for (let i = 0; i < parts.length - 1; i++) if (DISPOSABLE.has(parts.slice(i).join("."))) return true;
  return false;
}

/**
 * Offline checks only.
 * @returns {{ status: "empty"|"error"|"warn"|"ok", messages: {type:"error"|"warn"|"ok"|"info", text:string}[], email: string, domain: string, suggestion: string }}
 */
export function checkEmail(raw) {
  const email = String(raw ?? "").trim().toLowerCase();
  const out = { status: "empty", messages: [], email, domain: "", suggestion: "" };
  if (!email) return out;
  const err = (text) => out.messages.push({ type: "error", text });
  const done = () => {
    out.status = out.messages.some((m) => m.type === "error") ? "error" : out.messages.length ? "warn" : "ok";
    return out;
  };

  if (/\s/.test(email)) { err("Remove the spaces - an email address cannot contain spaces."); return done(); }
  const at = email.split("@").length - 1;
  if (at === 0) { err("Missing \"@\" - an email looks like name@gmail.com."); return done(); }
  if (at > 1) { err("Use only one \"@\" in the email address."); return done(); }
  const [local, domain] = email.split("@");
  out.domain = domain;
  if (!local) { err("Add your name before the \"@\" (e.g. yourname@gmail.com)."); return done(); }
  if (!domain) { err("Add the email provider after the \"@\" (e.g. @gmail.com)."); return done(); }
  if (email.length > 254 || local.length > 64) { err("This email address is too long."); return done(); }
  if (!/^[a-z0-9._%+\-']+$/.test(local)) err("The part before \"@\" can only use letters, numbers, dots, dashes, underscores or +.");
  if (/^\.|\.$|\.\./.test(local)) err("Dots cannot be at the start or end, or next to each other, before the \"@\".");
  if (!/^[a-z0-9.-]+$/.test(domain)) err("The part after \"@\" can only use letters, numbers, dots and dashes.");
  else if (!domain.includes(".")) err(`"${domain}" is incomplete - it needs an ending like .com (e.g. ${domain}.com).`);
  else if (/^[.-]|[.-]$|\.\.|-\.|\.-/.test(domain)) err("The part after \"@\" is not a valid domain.");
  else if (!/\.[a-z]{2,24}$/.test(domain)) err("The email ending (like .com or .net) is not valid.");
  if (out.messages.length) return done();

  const fix = TYPOS[domain];
  if (fix) {
    out.suggestion = `${local}@${fix}`;
    err(`"${domain}" looks like a typo. Did you mean ${out.suggestion}?`);
    return done();
  }
  if (PLACEHOLDER.has(domain)) { err(`"${domain}" is a placeholder domain, not a real email provider.`); return done(); }
  if (isDisposable(domain)) { err("Temporary / disposable email addresses are not allowed. Use your permanent email (Gmail, Yahoo, Outlook...)."); return done(); }

  // Provider-specific username rules for the biggest mailbox providers.
  if (domain === "gmail.com" || domain === "googlemail.com") {
    const plain = local.split("+")[0];
    if (!/^[a-z0-9.]+$/.test(plain)) err("Gmail addresses only use letters, numbers and dots before the \"@\".");
    else if (plain.replace(/\./g, "").length < 6) err("Gmail usernames have at least 6 characters - this Gmail address cannot exist.");
    else if (plain.replace(/\./g, "").length > 30) err("Gmail usernames have at most 30 characters - this Gmail address cannot exist.");
  } else if (/^(yahoo|ymail|rocketmail)\./.test(domain)) {
    if (!/^[a-z][a-z0-9._]{3,31}$/.test(local)) err("Yahoo usernames start with a letter and have 4-32 letters, numbers, dots or underscores.");
  } else if (/^(hotmail|outlook|live|msn)\./.test(domain)) {
    if (!/^[a-z]/.test(local)) err("Outlook / Hotmail usernames must start with a letter.");
  }
  if (out.messages.length) return done();

  const bare = local.split("+")[0];
  if (FAKE_LOCAL.test(bare)) err(`"${local}@" looks like a made-up address. Enter the email you actually use.`);
  else if (new Set(bare.replace(/[^a-z0-9]/g, "")).size <= 2 && bare.length >= 4) err(`"${local}@" looks like a made-up address. Enter the email you actually use.`);
  else if (/(.)\1{4,}/.test(bare)) out.messages.push({ type: "warn", text: "Your email has 5+ repeated characters - double-check it is typed correctly." });
  return done();
}
