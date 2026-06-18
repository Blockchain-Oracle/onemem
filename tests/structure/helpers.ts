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

import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export const ROOT = join(import.meta.dirname, "../..");
export const readJson = <T = unknown>(rel: string): T =>
  JSON.parse(readFileSync(join(ROOT, rel), "utf8")) as T;
export const exists = (rel: string) => existsSync(join(ROOT, rel));
export const isDir = (rel: string) => exists(rel) && statSync(join(ROOT, rel)).isDirectory();

export const TS_PACKAGES = [
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

export const PY_PACKAGES = [
  "sdk-python",
  "cli-python",
  "plugin-hermes",
  "provider-crewai",
  "provider-livekit",
  "provider-elevenlabs",
] as const;

export const APPS = ["landing", "docs", "hosted-dashboard"] as const;
export const DEMOS = [
  "agent-sends-money",
  "switch-laptops",
  "verifiable-research-agent",
  "multi-agent-coordination",
] as const;

export const HOSTED_DASHBOARD_ROUTES = [
  "login",
  "cli-login",
  "onboarding",
  "verify/[session_id]",
  "dashboard",
  "share",
  "share/[capability_id]",
] as const;

export const MOVE_MODULES = [
  "registry",
  "namespace",
  "trace",
  "events",
  "seal_policy",
  "version",
] as const;
export const MOVE_TESTS = [
  "namespace_tests",
  "trace_tests",
  "trace_compat_tests",
  "capability_transfer_tests",
  "admin_revoke_tests",
  "seal_approve_tests",
  "merkle_chain_tests",
  "version_tests",
  "registry_tests",
  "integration_tests",
] as const;

export const SCRIPTS = [
  "codegen-move-types.ts",
  "codegen-move-python.py",
  "deploy-contract.sh",
  "migrate-contract.sh",
  "deploy-walrus-sites.sh",
  "verify-mainnet.sh",
  "bootstrap-dev.sh",
  "publish-all.sh",
  "check-registry-status.py",
  "check-release-preflight.py",
] as const;

export const ROOT_CONFIGS = [
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

export const GH_WORKFLOWS = [
  "ci.yml",
  "release.yml",
  "deploy-contract.yml",
  "deploy-walrus-sites.yml",
] as const;

// Compatibility CLAUDE.md files are intentionally limited; AGENTS.md is the
// active Codex router. If we add more, update this list — drift is intentional,
// not silent.
export const EXPECTED_CLAUDE_MD = [
  "CLAUDE.md",
  "contracts/onemem/CLAUDE.md",
  "packages/dashboard/CLAUDE.md",
  "packages/sdk-ts/CLAUDE.md",
] as const;
