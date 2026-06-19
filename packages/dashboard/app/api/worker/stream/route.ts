// GET /api/worker/stream — SSE proxy from the local worker to the dashboard.

import type { NextRequest } from "next/server";
import { fetchLocalWorker } from "@/lib/local-worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET(req: NextRequest) {
  try {
    const upstream = await fetchLocalWorker("/stream", { signal: req.signal });
    if (!upstream.ok || !upstream.body) throw new Error(`worker returned ${upstream.status}`);
    return new Response(upstream.body, {
      headers: {
        "content-type": "text/event-stream",
        "cache-control": "no-cache, no-transform",
        connection: "keep-alive",
      },
    });
  } catch (err) {
    return new Response(
      sse("worker_unavailable", { error: err instanceof Error ? err.message : String(err) }),
      {
        headers: {
          "content-type": "text/event-stream",
          "cache-control": "no-cache, no-transform",
          connection: "keep-alive",
        },
      },
    );
  }
}
