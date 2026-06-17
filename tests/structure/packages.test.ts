import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";

import { exists, PY_PACKAGES, ROOT, readJson, TS_PACKAGES } from "./helpers";

describe("OneMem monorepo structure", () => {
  describe("TS packages", () => {
    for (const pkg of TS_PACKAGES) {
      test(`packages/${pkg}: manifest + README + Apache-2.0`, () => {
        assert.ok(exists(`packages/${pkg}/package.json`), `package.json`);
        assert.ok(exists(`packages/${pkg}/README.md`), `README.md`);
        const json = readJson<{ name?: string; license?: string }>(`packages/${pkg}/package.json`);
        assert.ok(
          json.name?.startsWith("@onemem/"),
          `name should start with @onemem/, got ${json.name}`,
        );
        assert.equal(json.license, "Apache-2.0", `license must be Apache-2.0`);
      });

      test(`packages/${pkg}: package-local LICENSE is shipped`, () => {
        const json = readJson<{ files?: string[] }>(`packages/${pkg}/package.json`);
        assert.ok(
          json.files?.includes("LICENSE"),
          `packages/${pkg}/package.json must list LICENSE in files`,
        );
        assert.ok(exists(`packages/${pkg}/LICENSE`), `packages/${pkg}/LICENSE`);
        const license = readFileSync(join(ROOT, `packages/${pkg}/LICENSE`), "utf8");
        assert.match(license, /Apache License/, `packages/${pkg}/LICENSE must be Apache text`);
        assert.match(license, /Version 2\.0/, `packages/${pkg}/LICENSE must be Apache-2.0`);
      });
    }

    test("package bin entries are executable Node scripts", () => {
      for (const pkg of TS_PACKAGES) {
        const manifest = readJson<{ name?: string; bin?: string | Record<string, string> }>(
          `packages/${pkg}/package.json`,
        );
        if (!manifest.bin) continue;
        const entries =
          typeof manifest.bin === "string"
            ? [[manifest.name ?? pkg, manifest.bin] as const]
            : Object.entries(manifest.bin);
        for (const [command, target] of entries) {
          const rel = `packages/${pkg}/${target.replace(/^\.\//, "")}`;
          assert.ok(exists(rel), `${manifest.name ?? pkg} bin ${command} missing: ${rel}`);
          const content = readFileSync(join(ROOT, rel), "utf8");
          assert.ok(
            content.startsWith("#!/usr/bin/env node"),
            `${manifest.name ?? pkg} bin ${command} must start with Node shebang`,
          );
          const mode = statSync(join(ROOT, rel)).mode;
          assert.ok(
            (mode & 0o100) !== 0,
            `${manifest.name ?? pkg} bin ${command} must be executable: ${rel}`,
          );
        }
      }
    });

    test("conditional package exports put types before runtime conditions", () => {
      const isRecord = (value: unknown): value is Record<string, unknown> =>
        typeof value === "object" && value !== null && !Array.isArray(value);

      function checkExportOrder(value: unknown, label: string): void {
        if (!isRecord(value)) return;
        const keys = Object.keys(value);
        const typesIndex = keys.indexOf("types");
        if (typesIndex >= 0) {
          for (const runtimeKey of ["import", "require"]) {
            const runtimeIndex = keys.indexOf(runtimeKey);
            assert.ok(
              runtimeIndex < 0 || typesIndex < runtimeIndex,
              `${label}: "types" export condition must appear before "${runtimeKey}"`,
            );
          }
        }
        for (const [key, child] of Object.entries(value)) {
          checkExportOrder(child, `${label}.${key}`);
        }
      }

      for (const pkg of TS_PACKAGES) {
        const manifest = readJson<{ name?: string; exports?: unknown }>(
          `packages/${pkg}/package.json`,
        );
        checkExportOrder(manifest.exports, manifest.name ?? pkg);
      }
    });
  });

  describe("Python packages", () => {
    for (const pkg of PY_PACKAGES) {
      test(`packages/${pkg}: pyproject.toml + README`, () => {
        assert.ok(exists(`packages/${pkg}/pyproject.toml`), `pyproject.toml`);
        assert.ok(exists(`packages/${pkg}/README.md`), `README.md`);
        const toml = readFileSync(join(ROOT, `packages/${pkg}/pyproject.toml`), "utf8");
        assert.ok(
          /license\s*=\s*\{\s*text\s*=\s*"Apache-2\.0"\s*\}/.test(toml),
          `Apache-2.0 license`,
        );
      });

      test(`packages/${pkg}: package-local LICENSE is shipped`, () => {
        assert.ok(exists(`packages/${pkg}/LICENSE`), `packages/${pkg}/LICENSE`);
        const license = readFileSync(join(ROOT, `packages/${pkg}/LICENSE`), "utf8");
        assert.match(license, /Apache License/, `packages/${pkg}/LICENSE must be Apache text`);
        assert.match(license, /Version 2\.0/, `packages/${pkg}/LICENSE must be Apache-2.0`);
      });
    }
  });
});
