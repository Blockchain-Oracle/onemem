// Output helpers. Every command supports `--json` for scripting; the default is
// a compact, human-readable text rendering. No color deps — plain text keeps the
// CLI dependency-light and pipe-friendly.

export interface GlobalOpts {
  json?: boolean;
  network?: string;
}

export function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

export function printLine(line = ""): void {
  process.stdout.write(`${line}\n`);
}

/** Render an array of records as an aligned text table. */
export function printTable(rows: Array<Record<string, string>>, columns: string[]): void {
  if (rows.length === 0) {
    printLine("(none)");
    return;
  }
  const widths = columns.map((c) => Math.max(c.length, ...rows.map((r) => (r[c] ?? "").length)));
  const fmt = (cells: string[]) =>
    cells
      .map((cell, i) => cell.padEnd(widths[i] ?? 0))
      .join("  ")
      .trimEnd();
  printLine(fmt(columns));
  printLine(fmt(widths.map((w) => "-".repeat(w))));
  for (const row of rows) printLine(fmt(columns.map((c) => row[c] ?? "")));
}

/** Short hex preview for byte arrays / long ids. */
export function shortHex(bytes: number[] | Uint8Array | undefined, len = 8): string {
  if (!bytes) return "";
  return `0x${Buffer.from(bytes).toString("hex").slice(0, len)}`;
}

export function shortId(id: string, head = 10): string {
  return id.length > head + 2 ? `${id.slice(0, head)}…` : id;
}

/**
 * Run a command body, printing errors in the requested format and exiting with a
 * non-zero code. Keeps each command file free of boilerplate try/catch.
 */
export async function runCommand(opts: GlobalOpts, body: () => Promise<void>): Promise<void> {
  try {
    await body();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (opts.json) {
      printJson({ ok: false, error: message });
    } else {
      process.stderr.write(`error: ${message}\n`);
    }
    process.exitCode = 1;
  }
}
