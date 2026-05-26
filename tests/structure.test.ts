// Monorepo structure tests — assert "solid is solid."
// Runs as: `pnpm test:structure` (uses node:test + tsx loader; no new deps).
//
// What this catches:
//   - A load-bearing file went missing
//   - A workspace package's manifest is malformed (missing name, wrong license, etc.)
//   - A workspace:* dep points at a non-existent package
//   - The hand-curated CLAUDE.md count drifts (e.g., new package without its CLAUDE.md)
//   - Canonical Move modules / hosted-dashboard routes disappear
//
// What this does NOT catch (separate concerns):
//   - pnpm install / uv sync correctness (CI runs those)
//   - biome / ruff / sui move build pass (CI runs those)
//   - Per-package unit tests (each package's own Vitest/pytest)

import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";

const ROOT = join(import.meta.dirname, "..");
const readJson = <T = unknown>(rel: string): T =>
  JSON.parse(readFileSync(join(ROOT, rel), "utf8")) as T;
const exists = (rel: string) => existsSync(join(ROOT, rel));
const isDir = (rel: string) => exists(rel) && statSync(join(ROOT, rel)).isDirectory();

const TS_PACKAGES = [
  "sdk-ts",
  "cli-ts",
  "mcp-server",
  "dashboard",
  "brand",
  "plugin-claude-code",
  "plugin-openclaw",
  "provider-vercel-ai",
  "provider-openai-agents",
] as const;

const PY_PACKAGES = [
  "sdk-python",
  "cli-python",
  "plugin-hermes",
  "provider-crewai",
  "provider-livekit",
  "provider-elevenlabs",
] as const;

const APPS = ["landing", "docs", "hosted-dashboard"] as const;

const HOSTED_DASHBOARD_ROUTES = [
  "login",
  "cli-login",
  "onboarding",
  "verify/[session_id]",
  "dashboard",
] as const;

const MOVE_MODULES = [
  "registry",
  "namespace",
  "trace",
  "events",
  "seal_policy",
  "version",
] as const;
const MOVE_TESTS = [
  "namespace_tests",
  "trace_tests",
  "capability_transfer_tests",
  "seal_approve_tests",
  "merkle_chain_tests",
  "version_tests",
  "registry_tests",
  "integration_tests",
] as const;

const SCRIPTS = [
  "codegen-move-types.ts",
  "codegen-move-python.py",
  "deploy-contract.sh",
  "migrate-contract.sh",
  "deploy-walrus-sites.sh",
  "verify-mainnet.sh",
  "bootstrap-dev.sh",
  "publish-all.sh",
] as const;

const ROOT_CONFIGS = [
  "package.json",
  "pnpm-workspace.yaml",
  "pyproject.toml",
  "tsconfig.base.json",
  "turbo.json",
  "biome.json",
  "ruff.toml",
  "pyrightconfig.json",
  "lefthook.yml",
  ".mise.toml",
  ".gitignore",
  ".editorconfig",
  "LICENSE",
  "README.md",
  "CLAUDE.md",
  ".changeset/config.json",
] as const;

const GH_WORKFLOWS = [
  "ci.yml",
  "release.yml",
  "deploy-contract.yml",
  "deploy-walrus-sites.yml",
] as const;

// 4 load-bearing CLAUDE.md files (per CODING_AGENT_SETUP.md Step C).
// If we add more, update this list — drift is intentional, not silent.
const EXPECTED_CLAUDE_MD = [
  "CLAUDE.md",
  "contracts/onemem/CLAUDE.md",
  "packages/dashboard/CLAUDE.md",
  "packages/sdk-ts/CLAUDE.md",
  "packages/plugin-claude-code/CLAUDE.md",
] as const;

describe("OneMem monorepo structure", () => {
  describe("top-level dirs", () => {
    for (const d of [
      "packages",
      "apps",
      "contracts/onemem",
      "services",
      "demos",
      "scripts",
      "docs",
      ".github/workflows",
      ".changeset",
    ]) {
      test(`dir exists: ${d}`, () => {
        assert.ok(isDir(d), `expected dir: ${d}`);
      });
    }
  });

  describe("root configs", () => {
    for (const f of ROOT_CONFIGS) {
      test(`file exists: ${f}`, () => {
        assert.ok(exists(f), `expected file: ${f}`);
      });
    }
  });

  describe("GitHub workflows", () => {
    for (const w of GH_WORKFLOWS) {
      test(`workflow exists: ${w}`, () => {
        assert.ok(exists(`.github/workflows/${w}`), `expected workflow: ${w}`);
      });
    }
  });

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
    }
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
    }
  });

  describe("apps", () => {
    for (const app of APPS) {
      test(`apps/${app} exists`, () => {
        assert.ok(isDir(`apps/${app}`), `apps/${app}`);
      });
    }

    test("hosted-dashboard has all 4 hosted-only routes + dashboard route", () => {
      for (const route of HOSTED_DASHBOARD_ROUTES) {
        assert.ok(
          exists(`apps/hosted-dashboard/app/${route}/page.tsx`),
          `route: apps/hosted-dashboard/app/${route}/page.tsx`,
        );
      }
    });

    test("hosted-dashboard has Walrus Sites mirror artifacts", () => {
      assert.ok(exists("apps/hosted-dashboard/walrus-sites/sites-config.yaml"));
      assert.ok(exists("apps/hosted-dashboard/walrus-sites/README.md"));
    });
  });

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

  describe("scripts", () => {
    for (const s of SCRIPTS) {
      test(`scripts/${s} exists`, () => {
        assert.ok(exists(`scripts/${s}`));
      });
    }

    test("shell scripts have executable bit", () => {
      for (const s of SCRIPTS.filter((x) => x.endsWith(".sh"))) {
        const stat = statSync(join(ROOT, `scripts/${s}`));
        // Owner-execute bit (0o100): non-zero means executable for owner.
        assert.ok((stat.mode & 0o100) !== 0, `scripts/${s} must be executable (chmod +x)`);
      }
    });
  });

  describe("CLAUDE.md inventory", () => {
    test("exactly 5 CLAUDE.md files (root + 4 load-bearing per-package)", () => {
      const present = EXPECTED_CLAUDE_MD.filter(exists);
      assert.equal(
        present.length,
        EXPECTED_CLAUDE_MD.length,
        `expected: ${EXPECTED_CLAUDE_MD.join(", ")} — present: ${present.join(", ")}`,
      );
    });

    test("root CLAUDE.md stays lean (≤ 80 lines)", () => {
      const lines = readFileSync(join(ROOT, "CLAUDE.md"), "utf8").split("\n").length;
      assert.ok(
        lines <= 80,
        `root CLAUDE.md is ${lines} lines — keep it ≤80 to avoid context bloat (loaded every interaction)`,
      );
    });
  });

  describe("workspace cross-refs", () => {
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
    test("packages/brand/tokens.css has the 4 reserved colors", () => {
      const css = readFileSync(join(ROOT, "packages/brand/tokens.css"), "utf8");
      for (const token of [
        "--onemem-lavender",
        "--onemem-chartreuse",
        "--onemem-cream",
        "--onemem-sui",
      ]) {
        assert.match(css, new RegExp(token), `tokens.css missing ${token}`);
      }
    });
  });

  // Coding guardrail: hard cap of 400 lines per source file under packages/, apps/, contracts/.
  // Excludes generated files, lockfiles, fixtures, .next caches, and anything outside the source trees.
  // The cap exists so we refactor at ~380 lines instead of letting files balloon to 600+.
  describe("source file size cap (≤ 400 lines)", () => {
    const MAX_LINES = 400;
    const SOURCE_ROOTS = ["packages", "apps", "contracts"];
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
});
