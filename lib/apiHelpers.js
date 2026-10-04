import { RESOURCES } from "./resources";
import { getSession } from "./auth";
import { images, parseFiles, parsePackages } from "./catalog";

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
      case "decimal":
        v = Math.round(Math.max(0, parseFloat(v) || 0) * 100) / 100;
        break;
      case "gallery":
        v = images(v).join("\n") || null;
        break;
      case "files":
        v = JSON.stringify(parseFiles(v));
        break;
      case "packages": {
        const pk = parsePackages(v);
        v = pk.length ? JSON.stringify(pk) : "";
        break;
      }
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
