// Phone number checker shared by the checkout form (live feedback) and the orders API (final gate).
// It can't prove a SIM is active - that needs an OTP - but it rejects numbers that cannot exist
// (bad prefix/length) and the patterns people type to skip the field (0000000, 12345678, 1212...).

export const PHONE_CODES = ["+880", "+91", "+1", "+44", "+971", "+966", "+60", "+65"];

const BD_OPERATORS = { 3: "Grameenphone", 7: "Grameenphone", 4: "Banglalink", 9: "Banglalink", 5: "Teletalk", 6: "Airtel (Robi)", 8: "Robi" };

// Mobile number shape per country code: national digits (no trunk 0), length and allowed start.
const RULES = {
  "+91": { len: [10], re: /^[6-9]/, hint: "10 digits starting with 6, 7, 8 or 9" },
  "+1": { len: [10], re: /^[2-9]\d{2}[2-9]/, hint: "10 digits, e.g. 212 555 0123" },
  "+44": { len: [10], re: /^7/, hint: "a mobile number starting with 7 (07XXX XXXXXX)" },
  "+971": { len: [9], re: /^5/, hint: "9 digits starting with 5 (05X XXX XXXX)" },
  "+966": { len: [9], re: /^5/, hint: "9 digits starting with 5 (05X XXX XXXX)" },
  "+60": { len: [9, 10], re: /^1/, hint: "9-10 digits starting with 1 (01X-XXX XXXX)" },
  "+65": { len: [8], re: /^[89]/, hint: "8 digits starting with 8 or 9" },
};

// Patterns that are almost never a real subscriber number.
function fakeReason(sub) {
  if (/^(\d)\1+$/.test(sub)) return "all the same digit";
  const asc = "01234567890123456789", desc = "98765432109876543210";
  if (sub.length >= 6 && (asc.includes(sub) || desc.includes(sub))) return "a counting sequence";
  if (new Set(sub).size <= 2) return "only one or two different digits";
  if (/^(\d{2,4})\1+\d{0,3}$/.test(sub)) return "a repeating pattern";
  if (/(\d)\1{5,}/.test(sub)) return "the same digit repeated 6+ times";
  if (/(0123456|1234567|2345678|3456789|9876543|8765432|7654321|6543210)/.test(sub)) return "a long counting sequence";
  return "";
}

// Splits a stored/posted "+8801712345678" or "+880 1712345678" into its country code and the rest.
export function splitPhone(value) {
  const s = String(value ?? "").trim();
  const cc = PHONE_CODES.filter((c) => s.replace(/\s/g, "").startsWith(c)).sort((a, b) => b.length - a.length)[0];
  return cc ? { cc, rest: s.replace(/\s/g, "").slice(cc.length) } : { cc: "", rest: s };
}

/**
 * @returns {{ status: "empty"|"error"|"warn"|"ok", messages: {type:"error"|"warn"|"ok"|"info", text:string}[], e164: string, display: string, operator: string }}
 */
export function checkPhone(cc, raw) {
  const out = { status: "empty", messages: [], e164: "", display: "", operator: "" };
  const input = String(raw ?? "").trim();
  if (!input) return out;
  const err = (text) => out.messages.push({ type: "error", text });
  const warn = (text) => out.messages.push({ type: "warn", text });

  if (/[a-z]/i.test(input)) err("Letters are not allowed - use digits only.");
  if (/[^\d\s()+\-.]/.test(input.replace(/[a-z]/gi, ""))) err("Remove symbols - only digits, spaces or dashes are allowed.");

  let digits = input.replace(/\D/g, "");
  // A "+" or "00" prefix inside the box means the country code was typed again.
  if (/^\s*(\+|00)/.test(input)) {
    const typed = PHONE_CODES.filter((c) => digits.replace(/^00/, "").startsWith(c.slice(1))).sort((a, b) => b.length - a.length)[0];
    if (typed && typed !== cc) {
      err(`You typed ${typed} but selected ${cc} - pick ${typed} from the country code list on the left.`);
      out.status = "error";
      return out;
    }
    digits = digits.replace(/^00/, "");
    if (typed === cc) digits = digits.slice(cc.length - 1);
  }

  if (cc === "+880") {
    if (digits.startsWith("880")) digits = digits.slice(3);
    if (digits.startsWith("0")) digits = digits.slice(1);
    if (!digits.startsWith("1")) err("Bangladeshi mobile numbers start with 01 (e.g. 017XXXXXXXX).");
    else if (digits.length >= 2 && !BD_OPERATORS[digits[1]]) err(`01${digits[1]} is not a valid Bangladeshi operator prefix (use 013-019).`);
    if (digits.length < 10) err(`Too short - ${10 - digits.length} more digit${10 - digits.length > 1 ? "s" : ""} needed (11 digits in total, e.g. 01712345678).`);
    if (digits.length > 10) err(`Too long - Bangladeshi mobile numbers have exactly 11 digits (you have ${digits.length + 1}).`);
    if (digits.length === 10 && BD_OPERATORS[digits[1]]) out.operator = BD_OPERATORS[digits[1]];
    out.display = `+880 ${digits.slice(0, 4)}-${digits.slice(4)}`;
  } else {
    const r = RULES[cc];
    if (digits.startsWith("0") && cc !== "+1") digits = digits.replace(/^0+/, "");
    if (cc === "+1" && digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
    if (r) {
      if (digits.length < Math.min(...r.len)) err(`Too short for ${cc} - enter ${r.hint}.`);
      else if (digits.length > Math.max(...r.len)) err(`Too long for ${cc} - enter ${r.hint}.`);
      else if (!r.re.test(digits)) err(`This is not a valid ${cc} mobile number - enter ${r.hint}.`);
      if (cc === "+1" && /^\d{3}55501\d{2}$/.test(digits)) err("555-01XX numbers are reserved for films and tests - they are not real.");
    }
    out.display = `${cc} ${digits}`;
  }

  // Judge the subscriber part (what follows the operator/area prefix) for fake patterns.
  // Skipped while the format is still wrong, so the user sees one clear problem at a time.
  const formatOk = !out.messages.some((m) => m.type === "error");
  const sub = digits.slice(cc === "+880" ? 2 : cc === "+1" ? 3 : 1);
  const whole = fakeReason(digits);
  const reason = whole || (sub.length >= 6 ? fakeReason(sub) : "");
  if (formatOk && reason && digits.length >= 6) err(`This looks like a fake number (${reason}). Enter your real mobile number.`);
  else if (formatOk && /(\d)\1{3}/.test(sub)) warn("Your number has 4 identical digits in a row - double-check it is correct.");

  out.e164 = `${cc}${digits}`;
  const hasErr = out.messages.some((m) => m.type === "error");
  out.status = hasErr ? "error" : out.messages.length ? "warn" : "ok";
  if (!hasErr) out.messages.unshift({ type: "ok", text: `Valid ${out.operator ? `${out.operator} ` : ""}number format: ${out.display}` });
  return out;
}
