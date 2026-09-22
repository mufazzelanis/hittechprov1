import { readFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

// Serves admin-uploaded images straight from public/uploads.
// Next.js only serves files that existed in /public when the server started, so images uploaded later
// (logo, favicon, tool covers) would 404 in production without this route.
const TYPES = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif", svg: "image/svg+xml" };

export async function GET(_req, { params }) {
  const name = params.name;
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name) || name.includes("..")) return new Response("Not found", { status: 404 });
  const ext = name.split(".").pop().toLowerCase();
  if (!TYPES[ext]) return new Response("Not found", { status: 404 });
  try {
    const file = await readFile(path.join(process.cwd(), "public", "uploads", name));
    return new Response(file, {
      headers: {
        "Content-Type": TYPES[ext],
        // file names are unique (timestamp + random), so they can be cached forever
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        // an SVG opened directly must not be able to run scripts
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
