import { type NextRequest, NextResponse } from "next/server";
import { loadShareHistory, ShareHistoryValidationError } from "@/lib/share-history";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const namespaceId = req.nextUrl.searchParams.get("namespaceId") ?? "";
    const network = req.nextUrl.searchParams.get("network");
    const history = await loadShareHistory({ namespaceId, network });
    return NextResponse.json(history, { status: 200 });
  } catch (err) {
    if (err instanceof ShareHistoryValidationError) {
      return NextResponse.json({ ok: false, code: err.code, error: err.message }, { status: 400 });
    }
    return NextResponse.json(
      {
        ok: false,
        code: "share_history_failed",
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 502 },
    );
  }
}
