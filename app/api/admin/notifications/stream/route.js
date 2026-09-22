import { getSession } from "@/lib/auth";
import { notifyBus } from "@/lib/notify";

export const dynamic = "force-dynamic";

// Server-Sent Events: an open admin tab keeps this connection alive and gets pushed every new
// notification the instant it happens, with no polling delay. The browser's EventSource reconnects
// on its own if the connection drops; the admin bell also polls as a fallback (see NotificationBell.jsx).
export async function GET() {
  if (!getSession()) return new Response("Unauthorized", { status: 401 });

  const enc = new TextEncoder();
  let onNew;
  let heartbeat;
  const stream = new ReadableStream({
    start(controller) {
      const send = (text) => { try { controller.enqueue(enc.encode(text)); } catch {} };
      send("retry: 4000\n\n");
      onNew = (row) => send(`event: notification\ndata: ${JSON.stringify(row)}\n\n`);
      notifyBus.on("new", onNew);
      // a comment line every 25s keeps proxies/load balancers from timing out the idle connection
      heartbeat = setInterval(() => send(": ping\n\n"), 25000);
    },
    cancel() {
      notifyBus.off("new", onNew);
      clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
