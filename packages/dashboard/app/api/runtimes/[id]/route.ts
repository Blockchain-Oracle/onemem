// PATCH /api/runtimes/:id — update local runtime pause/capture policy.

import { RuntimeControlsValidationError } from "@onemem/sdk-ts/runtime";
import { type NextRequest, NextResponse } from "next/server";
import { isRuntimeControllable, updateRuntimeControl } from "@/lib/runtimes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RuntimePatchBody {
  readonly paused?: unknown;
  readonly permissions?: {
    readonly captureEnabled?: unknown;
  };
}

export async function PATCH(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = (await _req.json()) as RuntimePatchBody;
    const paused = typeof body.paused === "boolean" ? body.paused : undefined;
    const captureEnabled =
      typeof body.permissions?.captureEnabled === "boolean"
        ? body.permissions.captureEnabled
        : undefined;

    if (paused === undefined && captureEnabled === undefined) {
      return NextResponse.json(
        { ok: false, error: "paused or permissions.captureEnabled is required" },
        { status: 400 },
      );
    }

    // Honesty guard: only location-A laptop runtimes read the local controls file.
    // Refuse to write a pause/capture policy for an MCP client or deployed adapter —
    // that file would never be read by their code (the old "enforcement theater").
    if (!isRuntimeControllable(id)) {
      return NextResponse.json(
        {
          ok: false,
          error: `runtime "${id}" is not locally controllable — it does not run on this machine. Manage deployed adapters from the hosted dashboard.`,
        },
        { status: 400 },
      );
    }

    const control = updateRuntimeControl(id, {
      paused,
      permissions: captureEnabled === undefined ? undefined : { captureEnabled },
    });
    return NextResponse.json({ ok: true, control });
  } catch (err) {
    const status = err instanceof RuntimeControlsValidationError ? 400 : 200;
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status },
    );
  }
}
