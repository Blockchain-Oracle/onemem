import { addressesFor } from "@onemem/sdk-ts";
import { describe, expect, it } from "vitest";
import packageJson from "../package.json";
import { readContext } from "../src/util/sui.js";
import { statusLabel } from "../src/util/trace.js";
import { VERSION } from "../src/version.js";

describe("VERSION", () => {
  it("matches the package manifest version", () => {
    expect(VERSION).toBe(packageJson.version);
  });
});

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

describe("readContext", () => {
  it("keeps current package and original event package separate after upgrades", () => {
    const addresses = addressesFor("testnet");
    const context = readContext("testnet");

    expect(context.packageId).toBe(addresses.packageId);
    expect(context.eventPackageId).toBe(addresses.originalPackageId || addresses.packageId);
  });
});
