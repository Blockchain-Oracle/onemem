import { access, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { type NextRequest, NextResponse } from "next/server";
import { VENDOR_LOGO_FILES } from "@/lib/vendor-logos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowed: ReadonlySet<string> = new Set<string>(VENDOR_LOGO_FILES);

// Resolve the packaged brand logo dir lazily (inside the handler): doing the
// `require.resolve` at module top-level makes the Next bundler rewrite it to a
// numeric module id that breaks build-time page-data collection.
function packageLogoDir(): string | null {
  try {
    const require = createRequire(import.meta.url);
    return join(dirname(require.resolve("@onemem/brand/vendor-logos/manifest.json")), "svg");
  } catch {
    return null;
  }
}

async function readLogo(file: string): Promise<string | null> {
  const packaged = packageLogoDir();
  const candidates = [
    resolve(process.cwd(), "../brand/vendor-logos/svg", file),
    resolve(process.cwd(), "packages/brand/vendor-logos/svg", file),
    ...(packaged ? [join(packaged, file)] : []),
  ];

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return await readFile(candidate, "utf8");
    } catch {
      // Try the next layout. Dev, monorepo root, and packaged installs differ.
    }
  }

  return null;
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;
  if (!allowed.has(file) || file.includes("/") || !file.endsWith(".svg")) {
    return NextResponse.json({ ok: false, error: "unknown logo" }, { status: 404 });
  }

  const svg = await readLogo(file);
  if (!svg) {
    return NextResponse.json({ ok: false, error: "logo file missing" }, { status: 404 });
  }

  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=86400",
    },
  });
}
