import { describe, expect, it } from "vitest";
import { statusLabel } from "../src/util/trace.js";

describe("statusLabel", () => {
  it("maps the known session statuses", () => {
    expect(statusLabel(0)).toBe("Active");
    expect(statusLabel(1)).toBe("Completed");
    expect(statusLabel(2)).toBe("Failed");
    expect(statusLabel(3)).toBe("Aborted");
  });
  it("degrades gracefully on an unknown status (never prints undefined)", () => {
    expect(statusLabel(7)).toBe("Unknown(7)");
  });
});
