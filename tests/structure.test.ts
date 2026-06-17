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
  "plugin-codex",
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
const DEMOS = ["agent-sends-money"] as const;

const HOSTED_DASHBOARD_ROUTES = [
  "login",
  "cli-login",
  "onboarding",
  "verify/[session_id]",
  "dashboard",
  "share",
  "share/[capability_id]",
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
  "AGENTS.md",
  "CLAUDE.md",
  ".agents/plugins/marketplace.json",
  ".claude-plugin/marketplace.json",
  ".changeset/config.json",
  "config/networks.json",
  "config/networks.schema.json",
] as const;

const GH_WORKFLOWS = [
  "ci.yml",
  "release.yml",
  "deploy-contract.yml",
  "deploy-walrus-sites.yml",
] as const;

// Compatibility CLAUDE.md files are intentionally limited; AGENTS.md is the
// active Codex router. If we add more, update this list — drift is intentional,
// not silent.
const EXPECTED_CLAUDE_MD = [
  "CLAUDE.md",
  "contracts/onemem/CLAUDE.md",
  "packages/dashboard/CLAUDE.md",
  "packages/sdk-ts/CLAUDE.md",
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
      ".thoughts",
      ".agents/plugins",
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

  describe("Codex plugin package", () => {
    test("packages/plugin-codex has Codex plugin entrypoints", () => {
      assert.ok(exists("packages/plugin-codex/.codex-plugin/plugin.json"));
      assert.ok(exists("packages/plugin-codex/.mcp.json"));
      assert.ok(exists("packages/plugin-codex/hooks/hooks.json"));
      assert.ok(exists("packages/plugin-codex/skills/onemem-codex/SKILL.md"));
      assert.ok(exists(".agents/plugins/marketplace.json"));
      assert.ok(exists(".agents/plugins/README.md"));
    });

    test("packages/plugin-codex manifest exposes bundled MCP and skill paths", () => {
      const manifest = readJson<{
        name?: string;
        skills?: string;
        mcpServers?: string;
      }>("packages/plugin-codex/.codex-plugin/plugin.json");
      assert.equal(manifest.name, "onemem-codex");
      assert.equal(manifest.skills, "./skills/");
      assert.equal(manifest.mcpServers, "./.mcp.json");
    });

    test("Codex plugin marketplace exposes onemem-codex", () => {
      const marketplace = readJson<{
        name?: string;
        plugins?: Array<{ name?: string; source?: { source?: string; path?: string } }>;
      }>(".agents/plugins/marketplace.json");
      assert.equal(marketplace.name, "onemem");
      const plugin = marketplace.plugins?.find((entry) => entry.name === "onemem-codex");
      assert.equal(plugin?.source?.source, "local");
      assert.equal(plugin?.source?.path, "./packages/plugin-codex");

      const readme = readFileSync(join(ROOT, ".agents/plugins/README.md"), "utf8");
      assert.match(readme, /marketplace snapshot/i);
      assert.match(readme, /not a user's local\s+checkout/i);
    });
  });

  describe("Claude Code plugin package", () => {
    test("packages/plugin-claude-code has Claude plugin entrypoints", () => {
      assert.ok(exists("packages/plugin-claude-code/.claude-plugin/plugin.json"));
      assert.ok(exists("packages/plugin-claude-code/hooks/hooks.json"));
      assert.ok(exists("packages/plugin-claude-code/scripts/inject.js"));
      assert.ok(exists("packages/plugin-claude-code/scripts/observe.js"));
      assert.ok(exists("packages/plugin-claude-code/scripts/summarize.js"));
      assert.ok(exists("packages/plugin-claude-code/skills/onemem-claude-code/SKILL.md"));
    });

    test("packages/plugin-claude-code manifest matches package identity", () => {
      const manifest = readJson<{ name?: string; version?: string; license?: string }>(
        "packages/plugin-claude-code/.claude-plugin/plugin.json",
      );
      assert.equal(manifest.name, "onemem");
      assert.equal(manifest.version, "0.1.0");
      assert.equal(manifest.license, "Apache-2.0");
    });

    test("Claude Code plugin marketplace exposes onemem", () => {
      const marketplace = readJson<{
        name?: string;
        plugins?: Array<{ name?: string; version?: string; source?: string }>;
      }>(".claude-plugin/marketplace.json");
      assert.equal(marketplace.name, "onemem");
      const plugin = marketplace.plugins?.find((entry) => entry.name === "onemem");
      assert.equal(plugin?.version, "0.1.0");
      assert.equal(plugin?.source, "./packages/plugin-claude-code");
    });
  });

  describe("plugin npm package metadata", () => {
    test("published plugin packages do not ship workspace protocol dependencies", () => {
      for (const rel of [
        "packages/plugin-codex/package.json",
        "packages/plugin-claude-code/package.json",
      ]) {
        const manifest = JSON.stringify(readJson(rel));
        assert.doesNotMatch(manifest, /workspace:/, `${rel} must be installable outside pnpm`);
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

  describe("apps", () => {
    for (const app of APPS) {
      test(`apps/${app} exists`, () => {
        assert.ok(isDir(`apps/${app}`), `apps/${app}`);
      });
    }

    test("hosted-dashboard has all hosted-only routes", () => {
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

    test("hosted-dashboard has hosted CLI pairing support", () => {
      assert.ok(exists("apps/hosted-dashboard/lib/hosted-state.ts"));
      assert.ok(exists("apps/hosted-dashboard/lib/cli-login.ts"));
      assert.ok(exists("apps/hosted-dashboard/app/api/cli-login/memwal-account/route.ts"));
    });
  });

  describe("dashboard browser smoke", () => {
    test("dashboard exposes reusable browser smoke coverage", () => {
      const pkg = readJson<{
        scripts?: Record<string, string>;
        devDependencies?: Record<string, string>;
      }>("packages/dashboard/package.json");
      assert.equal(pkg.scripts?.["browser:smoke"], "node scripts/browser-smoke.mjs");
      assert.ok(pkg.devDependencies?.["playwright-core"], "dashboard must declare playwright-core");
      assert.ok(exists("packages/dashboard/scripts/browser-smoke.mjs"));
      assert.ok(exists("packages/dashboard/public/favicon.svg"));
    });

    test("hosted-dashboard exposes reusable browser smoke coverage", () => {
      const pkg = readJson<{
        scripts?: Record<string, string>;
        devDependencies?: Record<string, string>;
      }>("apps/hosted-dashboard/package.json");
      assert.equal(pkg.scripts?.["browser:smoke"], "node scripts/browser-smoke.mjs");
      assert.ok(
        pkg.devDependencies?.["playwright-core"],
        "hosted-dashboard must declare playwright-core",
      );
      assert.ok(exists("apps/hosted-dashboard/scripts/browser-smoke.mjs"));
      assert.ok(exists("apps/hosted-dashboard/app/icon.svg"));
      assert.ok(exists("apps/hosted-dashboard/lib/sponsored-provisioning.ts"));
      assert.ok(exists("apps/hosted-dashboard/app/onboarding/SponsoredProvisioning.tsx"));
      assert.ok(exists("apps/hosted-dashboard/app/api/onboarding/sponsored/prepare/route.ts"));
      assert.ok(exists("apps/hosted-dashboard/app/api/onboarding/sponsored/execute/route.ts"));
      assert.ok(exists("apps/hosted-dashboard/app/share/HostedShareView.tsx"));
      assert.ok(exists("apps/hosted-dashboard/app/share/ShareHistoryPanel.tsx"));
      assert.ok(exists("apps/hosted-dashboard/app/share/[capability_id]/page.tsx"));
      assert.ok(
        exists("apps/hosted-dashboard/app/share/[capability_id]/ShareCapabilityAccountHint.tsx"),
      );
      assert.ok(exists("apps/hosted-dashboard/lib/share-capability.ts"));
      assert.ok(exists("apps/hosted-dashboard/lib/share-history.ts"));
      assert.ok(exists("apps/hosted-dashboard/app/api/share/history/route.ts"));
      assert.ok(exists("apps/hosted-dashboard/app/api/share/sponsored/prepare/route.ts"));
      assert.ok(exists("apps/hosted-dashboard/app/api/share/sponsored/execute/route.ts"));
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

    test("publish-all fails honestly on Python publish errors", () => {
      const script = readFileSync(join(ROOT, "scripts/publish-all.sh"), "utf8");
      assert.match(script, /PUBLISH_ALL_DRY_RUN/, "publish-all needs a dry-run gate");
      assert.match(script, /--trusted-publishing never/, "dry runs must not probe OIDC");
      assert.match(
        script,
        /uv build "\$pkg" --out-dir "\$pkg\/dist" --clear/,
        "uv build must use explicit package dist",
      );
      assert.match(
        script,
        /uv publish "\$\{publish_args\[@\]\}"/,
        "uv publish must use args array",
      );
      assert.doesNotMatch(script, /uv publish\s*\|\|/, "uv publish errors must not be swallowed");
      assert.doesNotMatch(script, /skeleton/, "publish script must not claim PyPI is skeleton");
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

  describe("overview docs", () => {
    const OVERVIEW = "docs/05-our-architecture/00-overview";
    test("TESTING_STRATEGY.md exists in 00-overview", () => {
      assert.ok(
        exists(`${OVERVIEW}/TESTING_STRATEGY.md`),
        "TESTING_STRATEGY.md missing — it's the canonical two-tier testing policy",
      );
    });
    test("root CLAUDE.md references TESTING_STRATEGY.md", () => {
      const claude = readFileSync(join(ROOT, "CLAUDE.md"), "utf8");
      assert.ok(
        claude.includes("TESTING_STRATEGY.md"),
        "CLAUDE.md must point at TESTING_STRATEGY.md so the testing policy is discoverable",
      );
    });

    test("AGENTS.md routes to Context Engineering artifacts", () => {
      const agents = readFileSync(join(ROOT, "AGENTS.md"), "utf8");
      assert.ok(
        agents.includes(".thoughts/"),
        "AGENTS.md must point at the active Context Engineering artifact root",
      );
      assert.ok(
        agents.includes("wiki/index.md"),
        "AGENTS.md must point at the active Context Engineering wiki",
      );
    });

    test("root README package count matches packages directory", () => {
      const packageCount = readdirSync(join(ROOT, "packages")).filter((entry) =>
        statSync(join(ROOT, "packages", entry)).isDirectory(),
      ).length;
      const readme = readFileSync(join(ROOT, "README.md"), "utf8");
      assert.ok(
        readme.includes(`packages/\` — ${packageCount} libraries`),
        `README.md package count must match packages/ (${packageCount})`,
      );
    });

    test("current docs entrypoints do not route to missing parent research files", () => {
      const currentEntrypoints = [
        "README.md",
        "docs/README.md",
        "docs/INDEX.md",
        "docs/03-target-runtimes/README.md",
        "docs/04-framework-providers/README.md",
        "docs/05-our-architecture/README.md",
      ];
      const missingParentRefs =
        /\.\.\/(?:WEDGE|DEEP_DIVE|MEM0_DEEP_DIVE|TRACE_AND_PROVIDERS|BRAND_AND_SURFACES_LEGACY)|\.\.\/\.\.\/(?:WEDGE|DEEP_DIVE|MEM0_DEEP_DIVE|TRACE_AND_PROVIDERS|BRAND_AND_SURFACES_LEGACY)/;

      for (const entrypoint of currentEntrypoints) {
        const body = readFileSync(join(ROOT, entrypoint), "utf8");
        assert.doesNotMatch(
          body,
          missingParentRefs,
          `${entrypoint} must route to files that exist in this checkout`,
        );
      }
    });

    test("framework provider overview does not mark TS memory helpers as deferred", () => {
      const overview = readFileSync(join(ROOT, "docs/04-framework-providers/README.md"), "utf8");
      for (const pkg of ["@onemem/vercel-ai-provider", "@onemem/openai-agents"]) {
        const escaped = pkg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        assert.doesNotMatch(
          overview,
          new RegExp(
            `\\|[^\\n]*\`${escaped}\`[^\\n]*(memory[^\\n]*deferred|deferred[^\\n]*memory)`,
            "i",
          ),
          `framework overview must not mark ${pkg} memory helper support as deferred`,
        );
        assert.match(
          overview,
          new RegExp(`\\|[^\\n]*\`${escaped}\`[^\\n]*createOneMemMemory`, "i"),
          `framework overview must mention createOneMemMemory for ${pkg}`,
        );
      }
    });

    test("public provider docs do not overclaim publication proof", () => {
      const providers = readFileSync(join(ROOT, "apps/docs/integrations/providers.mdx"), "utf8");
      assert.doesNotMatch(providers, /All published and live-tested on testnet/);
    });

    test("dashboard README does not mark built routes as pending", () => {
      const readme = readFileSync(
        join(ROOT, "docs/05-our-architecture/06-dashboard/README.md"),
        "utf8",
      );
      const builtRows = [
        "/",
        "/memories",
        "/apps",
        "/trace/[session_id]",
        "/sessions",
        "/share",
        "/settings",
        "/login",
        "/cli-login",
        "/onboarding",
        "/verify/[session_id]",
      ];
      for (const route of builtRows) {
        const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        assert.doesNotMatch(
          readme,
          new RegExp(`\\|\\s*\`${escaped}\`[^\\n]*\\|\\s*⏳ pending`, "i"),
          `dashboard README must not mark built route ${route} as pending`,
        );
      }
    });

    test("CLI command surface does not advertise deferred commands as current", () => {
      const surface = readFileSync(
        join(ROOT, "docs/05-our-architecture/05-cli/command-surface.md"),
        "utf8",
      );
      const deferredCurrentHeadings = [
        "onemem dashboard",
        "onemem logout",
        "onemem get",
        "onemem update",
        "onemem delete",
        "onemem list",
        "onemem history",
        "onemem export",
        "onemem namespace create",
        "onemem namespace list",
        "onemem namespace get",
        "onemem namespace deactivate",
        "onemem namespace reactivate",
        "onemem trace tree",
        "onemem trace end",
        "onemem replay",
        "onemem stats",
        "onemem set-namespace",
        "onemem set-agent",
        "onemem install --runtime",
        "onemem uninstall --runtime",
      ];
      for (const command of deferredCurrentHeadings) {
        const escaped = command.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        assert.doesNotMatch(
          surface,
          new RegExp(`^###\\s+\`${escaped}`, "m"),
          `CLI command surface must not advertise deferred command as current: ${command}`,
        );
      }
    });

    test("CLI docs expose current namespace commands and local network", () => {
      const docs = [
        "docs/05-our-architecture/05-cli/command-surface.md",
        "packages/cli-ts/README.md",
        "apps/docs/reference/cli.mdx",
      ];
      for (const doc of docs) {
        const content = readFileSync(join(ROOT, doc), "utf8");
        for (const command of [
          "onemem namespace share",
          "onemem namespace revoke",
          "onemem namespace capabilities",
        ]) {
          assert.match(content, new RegExp(command), `${doc} must document ${command}`);
        }
        assert.match(content, /local/, `${doc} must include the local network option`);
      }
    });

    test("CLI historical design docs are clearly marked", () => {
      const historicalDocs = [
        "docs/05-our-architecture/05-cli/cli-typescript-impl.md",
        "docs/05-our-architecture/05-cli/cli-python-impl.md",
        "docs/05-our-architecture/05-cli/output-design.md",
      ];
      for (const doc of historicalDocs) {
        const content = readFileSync(join(ROOT, doc), "utf8");
        assert.match(content, /Historical note, 2026-06-17/, `${doc} needs a historical note`);
        assert.match(
          content,
          /command-surface\.md/,
          `${doc} must route current truth to command-surface.md`,
        );
      }

      const loginFlow = readFileSync(
        join(ROOT, "docs/05-our-architecture/05-cli/login-flow.md"),
        "utf8",
      );
      assert.match(
        loginFlow,
        /Current implementation note, 2026-06-17/,
        "login-flow.md must state current implementation assumptions",
      );
      assert.doesNotMatch(
        loginFlow,
        /12340|onemem logout/,
        "login-flow.md must not advertise fixed callback ports or current logout",
      );
    });

    test("release docs route Python publishing to the real script", () => {
      const docs = [
        ".changeset/README.md",
        "docs/05-our-architecture/00-overview/TOOLING_DECISIONS.md",
      ];
      for (const doc of docs) {
        const content = readFileSync(join(ROOT, doc), "utf8");
        assert.match(
          content,
          /scripts\/publish-all\.sh/,
          `${doc} must point at scripts/publish-all.sh`,
        );
        assert.doesNotMatch(
          content,
          /publish-python\.py/,
          `${doc} must not reference missing publish-python.py`,
        );
        assert.doesNotMatch(
          content,
          /reads? (?:the )?(?:same )?changeset metadata|reads? (?:the )?note metadata/i,
          `${doc} must not claim unimplemented changeset metadata parsing`,
        );
      }
    });
  });

  describe("Context Engineering artifacts", () => {
    for (const f of [
      ".thoughts/wiki/index.md",
      ".thoughts/wiki/context-engineering-status.md",
      ".thoughts/wiki/project-map.md",
      ".thoughts/quality/2026-06-17-project-quality-profile.md",
      ".thoughts/prototype-discovery/2026-06-17-one-mem-2.md",
      ".thoughts/plans/2026-06-17-context-engineering-setup.md",
      ".thoughts/plans/2026-06-17-docs-alignment-cleanup.md",
      ".thoughts/research/2026-06-17-docs-instruction-audit.md",
      ".thoughts/verification/2026-06-17-context-engineering-setup.md",
      ".thoughts/verification/2026-06-17-docs-alignment-cleanup.md",
      ".thoughts/verification/2026-06-17-plugin-storage-version-audit.md",
      ".thoughts/research/2026-06-17-unified-sessions-gap.md",
      ".thoughts/specs/2026-06-17-unified-sessions.md",
      ".thoughts/stories/2026-06-17-unified-sessions.md",
      ".thoughts/plans/2026-06-17-unified-sessions.md",
      ".thoughts/verification/2026-06-17-unified-sessions.md",
      ".thoughts/research/2026-06-17-memory-provenance.md",
      ".thoughts/specs/2026-06-17-memory-provenance.md",
      ".thoughts/stories/2026-06-17-memory-provenance.md",
      ".thoughts/plans/2026-06-17-memory-provenance.md",
      ".thoughts/verification/2026-06-17-memory-provenance.md",
      ".thoughts/research/2026-06-17-share-capability-readiness.md",
      ".thoughts/specs/2026-06-17-share-capability-readiness.md",
      ".thoughts/stories/2026-06-17-share-capability-readiness.md",
      ".thoughts/plans/2026-06-17-share-capability-readiness.md",
      ".thoughts/verification/2026-06-17-share-capability-readiness.md",
      ".thoughts/research/2026-06-17-holder-self-revoke.md",
      ".thoughts/specs/2026-06-17-holder-self-revoke.md",
      ".thoughts/stories/2026-06-17-holder-self-revoke.md",
      ".thoughts/plans/2026-06-17-holder-self-revoke.md",
      ".thoughts/verification/2026-06-17-holder-self-revoke.md",
      ".thoughts/research/2026-06-17-memory-origin-verification.md",
      ".thoughts/specs/2026-06-17-memory-origin-verification.md",
      ".thoughts/stories/2026-06-17-memory-origin-verification.md",
      ".thoughts/plans/2026-06-17-memory-origin-verification.md",
      ".thoughts/verification/2026-06-17-memory-origin-verification.md",
      ".thoughts/research/2026-06-17-cli-credentials-fallback.md",
      ".thoughts/specs/2026-06-17-cli-credentials-fallback.md",
      ".thoughts/stories/2026-06-17-cli-credentials-fallback.md",
      ".thoughts/plans/2026-06-17-cli-credentials-fallback.md",
      ".thoughts/verification/2026-06-17-cli-credentials-fallback.md",
      ".thoughts/research/2026-06-17-codex-memory-plugin.md",
      ".thoughts/specs/2026-06-17-codex-memory-plugin.md",
      ".thoughts/stories/2026-06-17-codex-memory-plugin.md",
      ".thoughts/plans/2026-06-17-codex-memory-plugin.md",
      ".thoughts/verification/2026-06-17-codex-memory-plugin.md",
      ".thoughts/research/2026-06-17-runtime-controls.md",
      ".thoughts/specs/2026-06-17-runtime-controls.md",
      ".thoughts/stories/2026-06-17-runtime-controls.md",
      ".thoughts/plans/2026-06-17-runtime-controls.md",
      ".thoughts/verification/2026-06-17-runtime-controls.md",
      ".thoughts/research/2026-06-17-runtime-control-plugin-adoption.md",
      ".thoughts/specs/2026-06-17-runtime-control-plugin-adoption.md",
      ".thoughts/stories/2026-06-17-runtime-control-plugin-adoption.md",
      ".thoughts/plans/2026-06-17-runtime-control-plugin-adoption.md",
      ".thoughts/verification/2026-06-17-runtime-control-plugin-adoption.md",
      ".thoughts/research/2026-06-17-grouped-session-replay-export.md",
      ".thoughts/specs/2026-06-17-grouped-session-replay-export.md",
      ".thoughts/stories/2026-06-17-grouped-session-replay-export.md",
      ".thoughts/plans/2026-06-17-grouped-session-replay-export.md",
      ".thoughts/verification/2026-06-17-grouped-session-replay-export.md",
      ".thoughts/research/2026-06-17-dashboard-browser-regression.md",
      ".thoughts/specs/2026-06-17-dashboard-browser-regression.md",
      ".thoughts/stories/2026-06-17-dashboard-browser-regression.md",
      ".thoughts/plans/2026-06-17-dashboard-browser-regression.md",
      ".thoughts/verification/2026-06-17-dashboard-browser-regression.md",
      ".thoughts/research/2026-06-17-docs-status-inventory.md",
      ".thoughts/plans/2026-06-17-docs-status-inventory.md",
      ".thoughts/verification/2026-06-17-docs-status-inventory.md",
      ".thoughts/research/2026-06-17-delegate-key-lifecycle.md",
      ".thoughts/specs/2026-06-17-delegate-key-lifecycle.md",
      ".thoughts/stories/2026-06-17-delegate-key-lifecycle.md",
      ".thoughts/plans/2026-06-17-delegate-key-lifecycle.md",
      ".thoughts/verification/2026-06-17-delegate-key-lifecycle.md",
      ".thoughts/research/2026-06-17-hosted-auth-readiness.md",
      ".thoughts/specs/2026-06-17-hosted-auth-readiness.md",
      ".thoughts/stories/2026-06-17-hosted-auth-readiness.md",
      ".thoughts/plans/2026-06-17-hosted-auth-readiness.md",
      ".thoughts/verification/2026-06-17-hosted-auth-readiness.md",
      ".thoughts/research/2026-06-17-hosted-sponsored-provisioning.md",
      ".thoughts/specs/2026-06-17-hosted-sponsored-provisioning.md",
      ".thoughts/stories/2026-06-17-hosted-sponsored-provisioning.md",
      ".thoughts/plans/2026-06-17-hosted-sponsored-provisioning.md",
      ".thoughts/verification/2026-06-17-hosted-sponsored-provisioning.md",
      ".thoughts/research/2026-06-17-hosted-cli-delegate-minting.md",
      ".thoughts/specs/2026-06-17-hosted-cli-delegate-minting.md",
      ".thoughts/stories/2026-06-17-hosted-cli-delegate-minting.md",
      ".thoughts/plans/2026-06-17-hosted-cli-delegate-minting.md",
      ".thoughts/verification/2026-06-17-hosted-cli-delegate-minting.md",
      ".thoughts/research/2026-06-17-codex-built-in-memory-positioning.md",
      ".thoughts/plans/2026-06-17-codex-built-in-memory-positioning.md",
      ".thoughts/verification/2026-06-17-codex-built-in-memory-positioning.md",
      ".thoughts/specs/2026-06-17-hosted-share-capability-creation.md",
      ".thoughts/stories/2026-06-17-hosted-share-capability-creation.md",
      ".thoughts/plans/2026-06-17-hosted-share-capability-creation.md",
      ".thoughts/verification/2026-06-17-hosted-share-capability-creation.md",
      ".thoughts/research/2026-06-17-recipient-share-landing.md",
      ".thoughts/specs/2026-06-17-recipient-share-landing.md",
      ".thoughts/stories/2026-06-17-recipient-share-landing.md",
      ".thoughts/plans/2026-06-17-recipient-share-landing.md",
      ".thoughts/verification/2026-06-17-recipient-share-landing.md",
      ".thoughts/research/2026-06-17-event-backed-share-history.md",
      ".thoughts/specs/2026-06-17-event-backed-share-history.md",
      ".thoughts/stories/2026-06-17-event-backed-share-history.md",
      ".thoughts/plans/2026-06-17-event-backed-share-history.md",
      ".thoughts/verification/2026-06-17-event-backed-share-history.md",
      ".thoughts/research/2026-06-17-dashboard-status-refresh.md",
      ".thoughts/specs/2026-06-17-dashboard-status-refresh.md",
      ".thoughts/stories/2026-06-17-dashboard-status-refresh.md",
      ".thoughts/plans/2026-06-17-dashboard-status-refresh.md",
      ".thoughts/verification/2026-06-17-dashboard-status-refresh.md",
      ".thoughts/research/2026-06-17-cli-command-surface-refresh.md",
      ".thoughts/specs/2026-06-17-cli-command-surface-refresh.md",
      ".thoughts/stories/2026-06-17-cli-command-surface-refresh.md",
      ".thoughts/plans/2026-06-17-cli-command-surface-refresh.md",
      ".thoughts/verification/2026-06-17-cli-command-surface-refresh.md",
      ".thoughts/research/2026-06-17-cli-historical-docs-boundary.md",
      ".thoughts/specs/2026-06-17-cli-historical-docs-boundary.md",
      ".thoughts/stories/2026-06-17-cli-historical-docs-boundary.md",
      ".thoughts/plans/2026-06-17-cli-historical-docs-boundary.md",
      ".thoughts/verification/2026-06-17-cli-historical-docs-boundary.md",
      ".thoughts/research/2026-06-17-recipient-capability-self-revoke.md",
      ".thoughts/specs/2026-06-17-recipient-capability-self-revoke.md",
      ".thoughts/stories/2026-06-17-recipient-capability-self-revoke.md",
      ".thoughts/plans/2026-06-17-recipient-capability-self-revoke.md",
      ".thoughts/verification/2026-06-17-recipient-capability-self-revoke.md",
      ".thoughts/research/2026-06-17-single-trace-replay-export.md",
      ".thoughts/specs/2026-06-17-single-trace-replay-export.md",
      ".thoughts/stories/2026-06-17-single-trace-replay-export.md",
      ".thoughts/plans/2026-06-17-single-trace-replay-export.md",
      ".thoughts/verification/2026-06-17-single-trace-replay-export.md",
      ".thoughts/research/2026-06-17-ts-provider-memory-alignment.md",
      ".thoughts/specs/2026-06-17-ts-provider-memory-alignment.md",
      ".thoughts/stories/2026-06-17-ts-provider-memory-alignment.md",
      ".thoughts/plans/2026-06-17-ts-provider-memory-alignment.md",
      ".thoughts/verification/2026-06-17-ts-provider-memory-alignment.md",
      ".thoughts/research/2026-06-17-ts-package-export-condition-order.md",
      ".thoughts/specs/2026-06-17-ts-package-export-condition-order.md",
      ".thoughts/stories/2026-06-17-ts-package-export-condition-order.md",
      ".thoughts/plans/2026-06-17-ts-package-export-condition-order.md",
      ".thoughts/verification/2026-06-17-ts-package-export-condition-order.md",
      ".thoughts/research/2026-06-17-package-license-inclusion.md",
      ".thoughts/specs/2026-06-17-package-license-inclusion.md",
      ".thoughts/stories/2026-06-17-package-license-inclusion.md",
      ".thoughts/plans/2026-06-17-package-license-inclusion.md",
      ".thoughts/verification/2026-06-17-package-license-inclusion.md",
      ".thoughts/research/2026-06-17-python-package-license-inclusion.md",
      ".thoughts/specs/2026-06-17-python-package-license-inclusion.md",
      ".thoughts/stories/2026-06-17-python-package-license-inclusion.md",
      ".thoughts/plans/2026-06-17-python-package-license-inclusion.md",
      ".thoughts/verification/2026-06-17-python-package-license-inclusion.md",
      ".thoughts/research/2026-06-17-python-publish-failure-handling.md",
      ".thoughts/specs/2026-06-17-python-publish-failure-handling.md",
      ".thoughts/stories/2026-06-17-python-publish-failure-handling.md",
      ".thoughts/plans/2026-06-17-python-publish-failure-handling.md",
      ".thoughts/verification/2026-06-17-python-publish-failure-handling.md",
      ".thoughts/research/2026-06-17-npm-bin-executable-integrity.md",
      ".thoughts/specs/2026-06-17-npm-bin-executable-integrity.md",
      ".thoughts/stories/2026-06-17-npm-bin-executable-integrity.md",
      ".thoughts/plans/2026-06-17-npm-bin-executable-integrity.md",
      ".thoughts/verification/2026-06-17-npm-bin-executable-integrity.md",
      ".thoughts/research/2026-06-17-plugin-marketplace-publication-readiness.md",
      ".thoughts/specs/2026-06-17-plugin-marketplace-publication-readiness.md",
      ".thoughts/stories/2026-06-17-plugin-marketplace-publication-readiness.md",
      ".thoughts/plans/2026-06-17-plugin-marketplace-publication-readiness.md",
      ".thoughts/verification/2026-06-17-plugin-marketplace-publication-readiness.md",
      ".thoughts/research/2026-06-17-public-plugin-release-state.md",
      ".thoughts/plans/2026-06-17-public-plugin-release-state.md",
      ".thoughts/verification/2026-06-17-public-plugin-release-state.md",
      ".thoughts/research/2026-06-17-demo-executable-trace.md",
      ".thoughts/specs/2026-06-17-demo-executable-trace.md",
      ".thoughts/stories/2026-06-17-demo-executable-trace.md",
      ".thoughts/plans/2026-06-17-demo-executable-trace.md",
      ".thoughts/verification/2026-06-17-demo-executable-trace.md",
    ]) {
      test(`Context Engineering artifact exists: ${f}`, () => {
        assert.ok(exists(f), `${f} missing`);
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
});
