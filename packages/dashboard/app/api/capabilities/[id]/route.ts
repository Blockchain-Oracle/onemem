// GET /api/capabilities/:id — active capabilities for a namespace (minted minus revoked).
import { type NextRequest, NextResponse } from "next/server";
import { fetchCapabilities } from "@/lib/namespaces";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    return NextResponse.json({ ok: true, capabilities: await fetchCapabilities(id) });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 200 },
    );
  }
}
