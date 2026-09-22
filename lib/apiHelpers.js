import { RESOURCES } from "./resources";
import { getSession } from "./auth";

export function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "item";
}

export function requireAdmin() {
  return getSession();
}

export function getResource(name) {
  return RESOURCES[name] || null;
}

// Coerce a raw JSON body into a clean Prisma data object, using the resource config.
export function buildData(res, body, { partial = false } = {}) {
  const data = {};
  for (const f of res.fields) {
    if (f.type === "readonly" || f.type === "soon") continue;
    if (!(f.key in body)) {
      if (!partial && f.def !== undefined) data[f.key] = f.def;
      continue;
    }
    let v = body[f.key];
    switch (f.type) {
      case "number":
        v = parseInt(v, 10);
        if (Number.isNaN(v)) v = f.def ?? 0;
        break;
      case "bool":
        v = v === true || v === "true";
        break;
      case "category":
        v = v ? String(v) : null;
        break;
      case "image":
        v = v ? String(v) : null;
        break;
      case "select":
      case "status":
        if (!f.options.includes(v)) v = f.def;
        break;
      default:
        v = v == null ? "" : String(v).trim();
    }
    data[f.key] = v;
  }
  return data;
}

export function missingRequired(res, data, { partial = false } = {}) {
  for (const f of res.fields) {
    if (!f.required) continue;
    if (partial && !(f.key in data)) continue;
    const v = data[f.key];
    if (v === undefined || v === null || v === "" || (f.type === "number" && v < 0)) return f.label;
  }
  return null;
}
