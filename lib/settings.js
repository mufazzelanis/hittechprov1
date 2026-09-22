import { prisma } from "./db";
import { SETTING_DEFAULTS } from "./settingsDefaults";

// Values that must never reach the browser (they would appear in page HTML / RSC payloads).
const SECRET_KEYS = ["coupons", "fbCapiToken"];

// A value cleared in the admin falls back to its default, so a page never ends up with an empty heading.
// Pass { withSecrets: true } only from server code that really needs them (checkout APIs, admin settings).
export async function getSettings({ withSecrets = false } = {}) {
  const out = { ...SETTING_DEFAULTS };
  try {
    const rows = await prisma.setting.findMany();
    for (const r of rows) {
      if (!(r.key in out)) continue;
      if (String(r.value).trim() === "" && SETTING_DEFAULTS[r.key] !== "") continue;
      out[r.key] = r.value;
    }
  } catch {}
  if (!withSecrets) for (const k of SECRET_KEYS) delete out[k];
  return out;
}
