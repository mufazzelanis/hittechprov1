// Sales days are counted in Bangladesh time (UTC+6, no daylight saving), whatever timezone the server runs in.
const OFFSET = 6 * 3600 * 1000;
const pad = (n) => String(n).padStart(2, "0");

// Date -> "YYYY-MM-DD" (Dhaka calendar day)
export function dhakaDay(d) {
  const x = new Date(new Date(d).getTime() + OFFSET);
  return `${x.getUTCFullYear()}-${pad(x.getUTCMonth() + 1)}-${pad(x.getUTCDate())}`;
}
// "YYYY-MM-DD" -> Date at 00:00 Dhaka time
export function dhakaStart(day) {
  const [y, m, d] = String(day).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) - OFFSET);
}
export const addDays = (day, n) => dhakaDay(new Date(dhakaStart(day).getTime() + n * 86400000 + 3600000));
export const validDay = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || "")) && !Number.isNaN(dhakaStart(s).getTime());
export const daysBetween = (a, b) => Math.round((dhakaStart(b) - dhakaStart(a)) / 86400000) + 1;
