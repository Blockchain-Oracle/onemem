import { NextResponse } from "next/server";
import {
  CliLoginConfigError,
  CliLoginValidationError,
  lookupCliLoginMemWalAccount,
} from "@/lib/cli-login";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const owner = url.searchParams.get("owner") ?? "";

  try {
    return NextResponse.json(await lookupCliLoginMemWalAccount(owner));
  } catch (error) {
    const status =
      error instanceof CliLoginValidationError
        ? 400
        : error instanceof CliLoginConfigError
          ? 503
          : 500;
    const code =
      error instanceof CliLoginValidationError || error instanceof CliLoginConfigError
        ? error.code
        : "lookup_failed";
    return NextResponse.json(
      {
        ok: false,
        code,
        error: error instanceof Error ? error.message : "MemWal account lookup failed.",
      },
      { status },
    );
  }
}
