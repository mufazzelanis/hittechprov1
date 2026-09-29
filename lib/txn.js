// Payment Transaction ID checks shared by the checkout form (live) and the orders API (final gate).
// These catch typos, placeholders and pasted phone numbers; whether the payment really arrived is
// still confirmed by an admin against the bKash/Nagad/Rocket statement.

// Which family a payment option belongs to, from the name the admin gave it in Settings.
export function methodKind(name) {
  const n = String(name || "").toLowerCase();
  if (/bkash|b-kash|bikash/.test(n)) return "bkash";
  if (/nagad|nogod/.test(n)) return "nagad";
  if (/rocket|dbbl/.test(n)) return "rocket";
  if (/upay/.test(n)) return "upay";
  if (/crypto|usdt|btc|eth|binance|trc20|erc20/.test(n)) return "crypto";
  if (/bank|deposit|transfer/.test(n)) return "bank";
  return "other";
}

// Per-family facts used by the form: USSD code, usual Transaction ID shape, example, brand colour.
export const METHOD_INFO = {
  bkash: { brand: "#E2136E", ussd: "*247#", app: "bKash app", len: [10], example: "9A7B6C5D4E", where: "In the bKash confirmation SMS it appears after \"TrxID\" (10 letters and numbers). In the app: Inbox → the Send Money entry." },
  nagad: { brand: "#F6921E", ussd: "*167#", app: "Nagad app", len: [8, 10], example: "7A1B2C3D", where: "In the Nagad confirmation SMS it appears after \"TxnID\". In the app: Transactions → tap the Send Money entry." },
  rocket: { brand: "#8C3494", ussd: "*322#", app: "Rocket app", len: [10, 12], example: "1234567890", where: "In the Rocket confirmation SMS it appears after \"TxnId\". In the app: Statement → the Send Money entry." },
  upay: { brand: "#FFC20E", ussd: "*268#", app: "Upay app", len: [8, 12], example: "AB12CD34EF", where: "In the Upay confirmation SMS it appears after \"TrxID\"." },
  bank: { brand: "#0EA5E9", example: "Deposit slip / reference no.", where: "Use the reference number on your deposit slip or in your bank app's transfer receipt." },
  crypto: { brand: "#26A17B", example: "64-character TXID / hash", where: "Open the transaction in your wallet or exchange (Binance: Wallet → Transaction History) and copy the TXID / hash." },
  other: { brand: "#E8352B", example: "", where: "Copy the transaction or reference number from your payment receipt or SMS." },
};

const MFS = new Set(["bkash", "nagad", "rocket", "upay"]);

// Pull the ID out of a pasted confirmation SMS such as "...Fee Tk 0.00. TrxID BGH4K7N2PQ at 28/09/2026".
export function extractTxn(raw) {
  const s = String(raw ?? "");
  const m = s.match(/\b(?:trx\s*id|txn\s*id|trans(?:action)?\s*id|tx\s*id|txid|trnx\s*id|ref(?:erence)?(?:\s*no)?)\b\s*[:#.\-]?\s*([A-Za-z0-9]{6,70})/i);
  return m ? m[1] : "";
}

/**
 * @returns {{ status: "empty"|"error"|"warn"|"ok", value: string, extracted: boolean, messages: {type:string, text:string}[] }}
 */
export function checkTxn(kind, raw, amount) {
  const out = { status: "empty", value: "", extracted: false, messages: [] };
  let s = String(raw ?? "").trim();
  if (!s) return out;
  const fromSms = s.length > 25 || /\s/.test(s.trim()) ? extractTxn(s) : "";
  if (fromSms) { s = fromSms; out.extracted = true; }
  s = kind === "bank" ? s.replace(/\s+/g, " ").trim() : s.replace(/[\s-]/g, "");
  if (MFS.has(kind)) s = s.toUpperCase();
  if (kind === "crypto") s = s.replace(/^0X/, "0x");
  out.value = s;
  const err = (text) => out.messages.push({ type: "error", text });
  const warn = (text) => out.messages.push({ type: "warn", text });
  const info = METHOD_INFO[kind] || METHOD_INFO.other;
  const bare = s.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

  if (kind !== "bank" && /[^A-Za-z0-9]/.test(s)) err("Only letters and numbers are allowed in a Transaction ID.");
  else if (bare.length < 6) err(`Too short - a Transaction ID has at least 6 characters${info.len ? ` (usually ${info.len.join(" or ")})` : ""}.`);
  else if (s.length > 80) err("Too long - paste only the Transaction ID, not the whole message.");
  else if (/^(?:\+?88)?01[3-9]\d{8}$/.test(bare)) err("This is a phone number, not a Transaction ID. Copy the TrxID from your payment SMS.");
  else if (amount && bare === String(amount)) err("This is the amount, not the Transaction ID.");
  else if (/^(.)\1+$/.test(bare) || /^(X+|TEST\w*|FAKE\w*|NONE|NA|ABCDEF\w*|QWERTY\w*|TRXID|TXNID|123456\d*|0123456\d*)$/.test(bare) || "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".includes(bare))
    err("This looks like a placeholder, not a real Transaction ID.");
  else if (kind === "crypto" && !/^(0x)?[a-fA-F0-9]{64}$/.test(s)) err("A crypto TXID is a 64-character hash (0-9, a-f). Copy it from your wallet's transaction details.");
  else if (MFS.has(kind)) {
    if (info.len && !info.len.includes(bare.length)) warn(`${kind === "bkash" ? "bKash" : kind[0].toUpperCase() + kind.slice(1)} Transaction IDs usually have ${info.len.join(" or ")} characters - yours has ${bare.length}. Please double-check it.`);
    else if (kind === "bkash" && !/[A-Z]/.test(bare)) warn("bKash TrxIDs normally contain letters as well as numbers - please double-check it.");
  }

  const hasErr = out.messages.some((m) => m.type === "error");
  if (!hasErr && out.extracted) out.messages.unshift({ type: "info", text: `Transaction ID picked out of the pasted message: ${s}` });
  out.status = hasErr ? "error" : out.messages.some((m) => m.type === "warn") ? "warn" : "ok";
  return out;
}

// Numbers, wallet addresses and bank fields in the admin's instructions, so the form can offer
// one-tap copy buttons. Labelled fields ("Wallet: ...", "Account no: ...") are read even while
// they still hold placeholders like XXXX.
export function findCopyables(text) {
  const s = String(text || "");
  const found = [];
  const add = (value, label) => {
    const v = String(value || "").trim().replace(/[.,;)]+$/, "");
    // Placeholders like "XXXX" repeat across fields, so for those only the same label counts as a duplicate.
    const placeholder = /^[X\s-]+$/i.test(v);
    if (v.length >= 3 && !found.some((f) => f.value === v && (!placeholder || f.label === label))) found.push({ value: v, label });
  };
  for (const m of s.matchAll(/\b(?:0x[a-fA-F0-9]{40}|T[1-9A-HJ-NP-Za-km-z]{33}|bc1[a-zA-HJ-NP-Z0-9]{25,59}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})\b/g)) add(m[0], "Wallet address");
  for (const m of s.matchAll(/\b(?:wallet|address)(?:\s+address)?\s*(?:is\s*)?[:\-]?\s*([A-Za-z0-9]{4,})/gi)) if (!/^(network|and|then|below|the)$/i.test(m[1])) add(m[1], "Wallet address");
  for (const m of s.matchAll(/\b(bank(?:\s*name)?|account\s*name|a\/c\s*name|account\s*(?:no|number)\.?|a\/c(?:\s*no)?\.?|branch|routing(?:\s*(?:no|number))?\.?|swift(?:\s*code)?)\s*[:\-]\s*([^,;\n]+?)(?=\s*(?:[,;\n]|\.\s|\.$|$))/gi)) {
    const k = m[1].toLowerCase();
    const label = /name/.test(k) && !/^bank/.test(k) ? "Account name" : /^bank/.test(k) ? "Bank" : /branch/.test(k) ? "Branch" : /routing/.test(k) ? "Routing no." : /swift/.test(k) ? "SWIFT" : "Account no.";
    add(m[2], label);
  }
  for (const m of s.matchAll(/(?:\+?88)?01[3-9X][\dX]{8}(?:-[\dX])?/g)) add(m[0], "Number");
  return found;
}

// "network TRC20" / "(TRC20)" in crypto instructions.
export function findNetwork(text) {
  const m = String(text || "").match(/\b(TRC-?20|ERC-?20|BEP-?20|BEP-?2|Polygon|Solana|SOL|Arbitrum|Optimism|TON|Bitcoin|BTC|Lightning)\b/i);
  return m ? m[1].toUpperCase().replace(/-/, "") : "";
}
