import { describe, expect, it } from "vitest";
import {
  assertRevokeAllowed,
  parseShareCapKind,
  resolveAdminCapId,
} from "../src/commands/namespace.js";

describe("parseShareCapKind", () => {
  it("defaults to ReadOnly", () => {
    expect(parseShareCapKind(undefined)).toBe("ReadOnly");
  });

  it("accepts readonly aliases", () => {
    expect(parseShareCapKind("ReadOnly")).toBe("ReadOnly");
    expect(parseShareCapKind("read-only")).toBe("ReadOnly");
    expect(parseShareCapKind("ro")).toBe("ReadOnly");
  });

  it("accepts readwrite aliases", () => {
    expect(parseShareCapKind("ReadWrite")).toBe("ReadWrite");
    expect(parseShareCapKind("read-write")).toBe("ReadWrite");
    expect(parseShareCapKind("rw")).toBe("ReadWrite");
  });

  it("rejects unsupported capability kinds", () => {
    expect(() => parseShareCapKind("Admin")).toThrow(/ReadOnly, ReadWrite/);
  });
});

describe("resolveAdminCapId", () => {
  it("prefers --admin-cap over the environment", () => {
    expect(resolveAdminCapId({ adminCap: "0xcli" }, { ONEMEM_ADMIN_CAP_ID: "0xenv" })).toBe(
      "0xcli",
    );
  });

  it("falls back to ONEMEM_ADMIN_CAP_ID", () => {
    expect(resolveAdminCapId({}, { ONEMEM_ADMIN_CAP_ID: "0xenv" })).toBe("0xenv");
  });

  it("throws when neither source is available", () => {
    expect(() => resolveAdminCapId({}, {})).toThrow(/missing admin cap/);
  });
});

describe("assertRevokeAllowed", () => {
  it("allows ReadOnly and ReadWrite capabilities", () => {
    expect(() => assertRevokeAllowed("ReadOnly")).not.toThrow();
    expect(() => assertRevokeAllowed("ReadWrite")).not.toThrow();
  });

  it("refuses Admin capability revoke by default", () => {
    expect(() => assertRevokeAllowed("Admin")).toThrow(/--allow-admin/);
  });

  it("allows Admin capability revoke with explicit override", () => {
    expect(() => assertRevokeAllowed("Admin", true)).not.toThrow();
  });
});
