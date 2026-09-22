import { getSession } from "@/lib/auth";
import { notifyBus } from "@/lib/notify";

export const dynamic = "force-dynamic";

// Live feed for the Analytics page: every new page view, pushed the instant it happens (same
// mechanism as the admin notification bell - see app/api/admin/notifications/stream/route.js).
export async function GET() {
  if (!getSession()) return new Response("Unauthorized", { status: 401 });

  const enc = new TextEncoder();
  let onVisit;
  let heartbeat;
  const stream = new ReadableStream({
    start(controller) {
      const send = (text) => { try { controller.enqueue(enc.encode(text)); } catch {} };
      send("retry: 4000\n\n");
      onVisit = (row) => send(`event: visit\ndata: ${JSON.stringify(row)}\n\n`);
      notifyBus.on("visit", onVisit);
      heartbeat = setInterval(() => send(": ping\n\n"), 25000);
    },
    cancel() {
      notifyBus.off("visit", onVisit);
      clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" },
  });
}
