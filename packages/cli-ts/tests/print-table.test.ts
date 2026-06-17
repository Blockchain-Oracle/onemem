import { afterEach, describe, expect, it, vi } from "vitest";
import { printTable } from "../src/util/output.js";

function capture(fn: () => void): string {
  const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  fn();
  const out = spy.mock.calls.map((c) => c[0]).join("");
  spy.mockRestore();
  return out;
}

afterEach(() => vi.restoreAllMocks());

describe("printTable", () => {
  it("prints (none) for empty rows", () => {
    expect(capture(() => printTable([], ["a", "b"]))).toBe("(none)\n");
  });

  it("aligns columns to the widest cell and underlines the header", () => {
    const out = capture(() =>
      printTable(
        [
          { tool: "search", n: "1" },
          { tool: "x", n: "22" },
        ],
        ["tool", "n"],
      ),
    );
    const lines = out.trimEnd().split("\n");
    expect(lines[0]).toBe("tool    n");
    expect(lines[1]).toBe("------  --");
    expect(lines[2]).toBe("search  1");
    expect(lines[3]).toBe("x       22");
  });

  it("renders a missing key as empty without throwing or misaligning", () => {
    const out = capture(() => printTable([{ a: "hi" }], ["a", "b"]));
    const lines = out.trimEnd().split("\n");
    expect(lines[2]).toBe("hi"); // trailing empty 'b' cell is trimmed
  });
});
