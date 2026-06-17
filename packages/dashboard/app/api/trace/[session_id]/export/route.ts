// GET /api/trace/:session_id/export — build a proof-scoped single TraceSession JSON export.
import { NextResponse } from "next/server";
import { buildTraceSessionExport } from "@/lib/session-export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = Promise<{ session_id: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  try {
    const { session_id } = await params;
    const traceExport = await buildTraceSessionExport(session_id);
    return NextResponse.json({ ok: true, export: traceExport });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
