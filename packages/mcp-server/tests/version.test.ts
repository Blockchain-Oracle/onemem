import { describe, expect, it } from "vitest";
import packageJson from "../package.json";
import { VERSION } from "../src/version.js";

describe("VERSION", () => {
  it("matches the package manifest version", () => {
    expect(VERSION).toBe(packageJson.version);
  });
});
