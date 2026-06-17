// POST /api/sessions/export — build a proof-scoped grouped session JSON export.
import { type NextRequest, NextResponse } from "next/server";
import { buildGroupedSessionExport, normalizeExportSessionIds } from "@/lib/session-export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { sessionIds?: unknown };
    const input = normalizeExportSessionIds(body.sessionIds);
    if (!input.ok) {
      return NextResponse.json({ ok: false, error: input.error }, { status: 400 });
    }
    const groupedExport = await buildGroupedSessionExport(input.ids);
    return NextResponse.json({ ok: true, export: groupedExport });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
