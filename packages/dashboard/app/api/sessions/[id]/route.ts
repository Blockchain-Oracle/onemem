// GET /api/sessions/:id — a TraceSession's meta + decoded calls + verify result.
import { type NextRequest, NextResponse } from "next/server";
import { fetchSession } from "@/lib/trace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const result = await fetchSession(id);
    if ("error" in result) return NextResponse.json({ ok: false, error: result.error });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 200 },
    );
  }
}
