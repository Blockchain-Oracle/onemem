import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";

import {
  APPS,
  DEMOS,
  exists,
  MOVE_MODULES,
  MOVE_TESTS,
  PY_PACKAGES,
  ROOT,
  readJson,
  TS_PACKAGES,
} from "./helpers";

describe("OneMem monorepo structure", () => {
  describe("Move package", () => {
    test("Move.toml exists", () => {
      assert.ok(exists("contracts/onemem/Move.toml"));
    });

    for (const mod of MOVE_MODULES) {
      test(`Move module: ${mod}.move`, () => {
        assert.ok(exists(`contracts/onemem/sources/${mod}.move`));
      });
    }

    for (const t of MOVE_TESTS) {
      test(`Move test: ${t}.move`, () => {
        assert.ok(exists(`contracts/onemem/tests/${t}.move`));
      });
    }
  });

  describe("workspace cross-refs", () => {
    test("executable demo packages keep their load-bearing files", () => {
      for (const demo of DEMOS) {
        assert.ok(exists(`demos/${demo}/package.json`), `demos/${demo}/package.json`);
        assert.ok(exists(`demos/${demo}/tsconfig.json`), `demos/${demo}/tsconfig.json`);
        assert.ok(exists(`demos/${demo}/README.md`), `demos/${demo}/README.md`);
      }
      assert.ok(
        exists("demos/agent-sends-money/src/mock-payment-trace.ts"),
        "agent-sends-money executable trace script missing",
      );
      assert.ok(
        exists("demos/agent-sends-money/src/trace-model.test.ts"),
        "agent-sends-money trace model tests missing",
      );
      assert.ok(
        exists("demos/switch-laptops/src/mock-switch-trace.ts"),
        "switch-laptops executable trace script missing",
      );
      assert.ok(
        exists("demos/switch-laptops/src/trace-model.test.ts"),
        "switch-laptops trace model tests missing",
      );
      assert.ok(
        exists("demos/verifiable-research-agent/src/mock-research-trace.ts"),
        "verifiable-research-agent executable trace script missing",
      );
      assert.ok(
        exists("demos/verifiable-research-agent/src/trace-model.test.ts"),
        "verifiable-research-agent trace model tests missing",
      );
      assert.ok(
        exists("demos/multi-agent-coordination/src/mock-multi-agent-trace.ts"),
        "multi-agent-coordination executable trace script missing",
      );
      assert.ok(
        exists("demos/multi-agent-coordination/src/trace-model.test.ts"),
        "multi-agent-coordination trace model tests missing",
      );
    });

    test("workspace:* deps resolve to real workspace packages", () => {
      // Build the set of @onemem/* package names declared by TS packages
      const wsPackages = new Set<string>();
      for (const pkg of TS_PACKAGES) {
        const json = readJson<{ name?: string }>(`packages/${pkg}/package.json`);
        if (json.name) wsPackages.add(json.name);
      }

      const allTsManifests = [
        ...TS_PACKAGES.map((p) => `packages/${p}/package.json`),
        ...APPS.filter((a) => exists(`apps/${a}/package.json`)).map(
          (a) => `apps/${a}/package.json`,
        ),
        ...DEMOS.filter((d) => exists(`demos/${d}/package.json`)).map(
          (d) => `demos/${d}/package.json`,
        ),
      ];

      for (const manifestPath of allTsManifests) {
        const json = readJson<{
          dependencies?: Record<string, string>;
          peerDependencies?: Record<string, string>;
          devDependencies?: Record<string, string>;
        }>(manifestPath);
        const allDeps = {
          ...json.dependencies,
          ...json.peerDependencies,
          ...json.devDependencies,
        };
        for (const [dep, ver] of Object.entries(allDeps)) {
          if (typeof ver === "string" && ver.startsWith("workspace:")) {
            assert.ok(
              wsPackages.has(dep),
              `${manifestPath}: workspace:* dep ${dep} does not resolve to a workspace package (known: ${[...wsPackages].join(", ")})`,
            );
          }
        }
      }
    });

    test("pnpm-workspace.yaml globs are sane (mentions packages/* apps/* demos/*)", () => {
      const yml = readFileSync(join(ROOT, "pnpm-workspace.yaml"), "utf8");
      assert.match(yml, /packages\/\*/, "pnpm-workspace.yaml should glob packages/*");
      assert.match(yml, /apps\/\*/, "pnpm-workspace.yaml should glob apps/*");
      assert.match(yml, /demos\/\*/, "pnpm-workspace.yaml should glob demos/*");
    });

    test("root pyproject.toml uv workspace members include all Python packages", () => {
      const toml = readFileSync(join(ROOT, "pyproject.toml"), "utf8");
      for (const pkg of PY_PACKAGES) {
        assert.match(
          toml,
          new RegExp(`packages/${pkg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`),
          `root pyproject.toml [tool.uv.workspace] must include packages/${pkg}`,
        );
      }
    });
  });

  describe("brand tokens", () => {
    test("packages/brand/tokens.css has the 4 reserved colors (cdr-kit palette)", () => {
      const css = readFileSync(join(ROOT, "packages/brand/tokens.css"), "utf8");
      for (const token of [
        "--onemem-primary", // indigo brand
        "--onemem-verify", // green — verify affordances only
        "--onemem-chain", // sea-blue — explorer links only
        "--onemem-paper", // surface
      ]) {
        assert.match(css, new RegExp(token), `tokens.css missing ${token}`);
      }
    });
  });

  // Coding guardrail: hard cap of 400 lines per source file under packages/, apps/, contracts/, demos/.
  // Excludes generated files, lockfiles, fixtures, .next caches, and anything outside the source trees.
  // The cap exists so we refactor at ~380 lines instead of letting files balloon to 600+.

  describe("source file size cap (≤ 400 lines)", () => {
    const MAX_LINES = 400;
    const SOURCE_ROOTS = ["packages", "apps", "contracts", "demos"];
    const SOURCE_EXTS = new Set([
      ".ts",
      ".tsx",
      ".js",
      ".jsx",
      ".mjs",
      ".cjs",
      ".py",
      ".move",
      ".rs",
    ]);
    const IGNORE_DIR_NAMES = new Set([
      "node_modules",
      ".next",
      ".turbo",
      "dist",
      "build",
      "out",
      "coverage",
      "__pycache__",
      ".venv",
      ".pytest_cache",
      ".ruff_cache",
      "target",
    ]);
    // Generated codegen files and lockfiles are exempt — their size is not our craft signal.
    const IGNORE_PATH_SUFFIXES = ["/move-types.ts", "/move_types.py"];

    function walk(dir: string, acc: string[] = []): string[] {
      let entries: import("node:fs").Dirent[];
      try {
        entries = readdirSync(dir, { withFileTypes: true });
      } catch {
        return acc;
      }
      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (IGNORE_DIR_NAMES.has(entry.name)) continue;
          walk(join(dir, entry.name), acc);
        } else if (entry.isFile()) {
          const full = join(dir, entry.name);
          const dot = entry.name.lastIndexOf(".");
          if (dot === -1) continue;
          const ext = entry.name.slice(dot);
          if (!SOURCE_EXTS.has(ext)) continue;
          if (IGNORE_PATH_SUFFIXES.some((suf) => full.endsWith(suf))) continue;
          acc.push(full);
        }
      }
      return acc;
    }

    test(`no source file exceeds ${MAX_LINES} lines`, () => {
      const offenders: { path: string; lines: number }[] = [];
      for (const root of SOURCE_ROOTS) {
        const rootAbs = join(ROOT, root);
        if (!existsSync(rootAbs)) continue;
        for (const file of walk(rootAbs)) {
          const lines = readFileSync(file, "utf8").split("\n").length;
          if (lines > MAX_LINES) {
            offenders.push({ path: file.replace(`${ROOT}/`, ""), lines });
          }
        }
      }
      assert.equal(
        offenders.length,
        0,
        `${offenders.length} source file(s) exceed ${MAX_LINES} lines — refactor (extract helpers, split modules):\n${offenders
          .map((o) => `  ${o.path} — ${o.lines} lines`)
          .join("\n")}`,
      );
    });
  });

  describe("structure test shard size cap (≤ 300 lines)", () => {
    const MAX_LINES = 300;

    test(`no structure test shard exceeds ${MAX_LINES} lines`, () => {
      const offenders: { path: string; lines: number }[] = [];
      for (const entry of readdirSync(join(ROOT, "tests/structure"), { withFileTypes: true })) {
        if (!entry.isFile() || !entry.name.endsWith(".ts")) continue;
        const rel = `tests/structure/${entry.name}`;
        const lines = readFileSync(join(ROOT, rel), "utf8").split("\n").length;
        if (lines > MAX_LINES) offenders.push({ path: rel, lines });
      }
      assert.equal(
        offenders.length,
        0,
        `${offenders.length} structure test shard(s) exceed ${MAX_LINES} lines:\n${offenders
          .map((o) => `  ${o.path} — ${o.lines} lines`)
          .join("\n")}`,
      );
    });
  });
});
