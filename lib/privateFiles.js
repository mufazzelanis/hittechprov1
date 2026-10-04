import { createReadStream } from "fs";
import { mkdir, stat, writeFile } from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { isStoredName } from "./catalog";

// Paid files (template downloads, service deliveries) live OUTSIDE /public, so they are never reachable
// by URL - only through /api/downloads, which checks the buyer's order first.
export const STORAGE_DIR = path.join(process.cwd(), "storage", "private");

export const MAX_FILE_BYTES = 200 * 1024 * 1024;

const ALLOWED = new Set([
  "zip", "rar", "7z", "pdf", "png", "jpg", "jpeg", "webp", "gif", "svg", "psd", "ai", "eps", "fig", "sketch", "xd",
  "indd", "mp4", "mov", "webm", "mp3", "wav", "txt", "md", "csv", "json", "html", "docx", "doc", "pptx", "ppt", "xlsx", "xls",
  "key", "pages", "ttf", "otf", "woff", "woff2",
]);

const extOf = (name) => (String(name).toLowerCase().match(/\.([a-z0-9]{1,8})$/) || [])[1] || "";

// The buyer-facing name: no folders, no control characters, a sane length.
export function cleanName(name) {
  const base = String(name || "file").split(/[\\/]/).pop().replace(/[\u0000-\u001f\u007f"<>|*?:]/g, "").trim();
  return (base || "file").slice(0, 150);
}

// Saves an uploaded File and returns its reference. The stored name is generated here, never taken from
// the upload, so it can't contain a path.
export async function saveUpload(file) {
  if (!file || typeof file === "string") throw new Error("No file");
  const ext = extOf(file.name);
  if (!ALLOWED.has(ext)) throw new Error(`.${ext || "?"} files are not allowed. Use ZIP, PDF, images, design or document files.`);
  if (file.size > MAX_FILE_BYTES) throw new Error("File is too large (max 200 MB). Zip it or share a cloud link in the delivery text instead.");
  await mkdir(STORAGE_DIR, { recursive: true });
  const stored = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
  await writeFile(path.join(STORAGE_DIR, stored), Buffer.from(await file.arrayBuffer()));
  return { id: Math.random().toString(36).slice(2, 12), name: cleanName(file.name), stored, size: file.size };
}

// Streams a stored file as an attachment. Returns null if it is missing.
export async function fileResponse(ref) {
  if (!isStoredName(ref?.stored)) return null;
  const full = path.join(STORAGE_DIR, ref.stored);
  const info = await stat(full).catch(() => null);
  if (!info?.isFile()) return null;
  const name = cleanName(ref.name || ref.stored);
  const ascii = name.replace(/[^\x20-\x7e]/g, "_");
  return new Response(Readable.toWeb(createReadStream(full)), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(info.size),
      "Content-Disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
