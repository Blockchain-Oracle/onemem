// GET /api/stream — Server-Sent Events feed of recent sessions. Polls the chain
// (the SDK has no push subscription that's browser-safe here) and emits an event
// whenever the newest session id changes, so dashboards live-update without a
// full refresh. Closes cleanly when the client disconnects.

import type { NextRequest } from "next/server";
import { fetchRecentSessions } from "@/lib/trace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const POLL_MS = 5_000;

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  let timer: ReturnType<typeof setInterval> | undefined;
  let lastTop = "";

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };
      send("ready", { ok: true });

      const tick = async () => {
        try {
          const sessions = await fetchRecentSessions(10);
          const top = sessions[0]?.sessionId ?? "";
          if (top && top !== lastTop) {
            lastTop = top;
            send("sessions", { latest: top, count: sessions.length });
          } else {
            send("ping", { t: Date.now() });
          }
        } catch (err) {
          send("error", { error: err instanceof Error ? err.message : String(err) });
        }
      };
      void tick();
      timer = setInterval(() => void tick(), POLL_MS);

      req.signal.addEventListener("abort", () => {
        if (timer) clearInterval(timer);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
    cancel() {
      if (timer) clearInterval(timer);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
