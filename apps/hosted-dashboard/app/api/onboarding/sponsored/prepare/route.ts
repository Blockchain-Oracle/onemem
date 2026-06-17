import { type NextRequest, NextResponse } from "next/server";
import {
  type PrepareSponsoredProvisioningInput,
  ProvisioningConfigError,
  ProvisioningValidationError,
  prepareSponsoredProvisioning,
} from "@/lib/sponsored-provisioning";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function errorResponse(err: unknown) {
  if (err instanceof ProvisioningConfigError) {
    return NextResponse.json(
      { ok: false, code: err.code, configured: false, error: err.message },
      { status: 503 },
    );
  }
  if (err instanceof ProvisioningValidationError) {
    return NextResponse.json({ ok: false, code: err.code, error: err.message }, { status: 400 });
  }
  return NextResponse.json(
    {
      ok: false,
      code: "sponsor_prepare_failed",
      error: err instanceof Error ? err.message : String(err),
    },
    { status: 502 },
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PrepareSponsoredProvisioningInput;
    const prepared = await prepareSponsoredProvisioning(body);
    return NextResponse.json(prepared, { status: 200 });
  } catch (err) {
    return errorResponse(err);
  }
}
