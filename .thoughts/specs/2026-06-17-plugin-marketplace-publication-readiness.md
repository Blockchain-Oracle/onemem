# Spec: Plugin Marketplace Publication Readiness

## Objective

Make the OneMem Codex and Claude Code plugins production-installable through
repository marketplace commands, and make npm publication package-ready even if
registry auth is unavailable in the current shell.

## Background And Current Reality

`packages/plugin-codex` and `packages/plugin-claude-code` already exist, but the
primary install guidance still included local checkout paths. Codex had only a
local-flavored marketplace name (`onemem-local`). Claude Code had no root
marketplace manifest. Npm registry auth is not currently available.

## Users

- Codex users who should install with `codex plugin marketplace add
  Blockchain-Oracle/onemem`.
- Claude Code users who should install with `claude plugin marketplace add
  Blockchain-Oracle/onemem`.
- OneMem maintainers publishing plugin packages or validating marketplace
  manifests.

## Goals

- Rename the Codex marketplace from `onemem-local` to `onemem`.
- Add `.claude-plugin/marketplace.json` for the repo.
- Move Claude plugin context from non-loaded `CLAUDE.md` into a shipped skill.
- Update user-facing docs and dashboard runtime metadata away from local-only
  plugin install commands.
- Add npm public package metadata and warning-free publish dry-runs.
- Keep the live hook-proof boundary honest.

## Non-goals

- Do not claim npm publication when npm auth is missing.
- Do not claim Codex automatic trace parity without live trusted hook proof.
- Do not publish or push unrelated dirty worktree changes.

## Requirements

- R1: Codex marketplace install works with selector `onemem-codex@onemem`.
- R2: Claude Code marketplace validation passes in strict mode.
- R3: Claude Code temporary install works from the repo marketplace.
- R4: Npm dry-pack and publish dry-run include plugin manifests, hooks, scripts,
  README, LICENSE, and shipped skills.
- R5: Active docs and dashboard metadata prefer public repository marketplace
  install commands.
- R6: Structure tests guard both marketplace manifests.

## Acceptance Criteria

- AC1: `claude plugin validate packages/plugin-claude-code --strict` passes.
- AC2: `claude plugin validate . --strict` passes.
- AC3: Temporary `CODEX_HOME` can add/list/install `onemem-codex@onemem`.
- AC4: Temporary `HOME` can add/list/install `onemem@onemem` for Claude Code.
- AC5: `npm publish --dry-run --access public` passes for both plugin packages.
- AC6: Focused plugin tests/lints and `pnpm test:structure` pass.
- AC7: Any remaining non-claim is explicit and evidence-backed.

## Constraints

- Do not print credentials.
- Keep local checkout install snippets only under explicit development fallback
  sections.
- Use repo-local `.thoughts/` for all Context Engineering artifacts.

## Stories Needed

- Codex user installs OneMem from the public repository marketplace.
- Claude Code user installs OneMem from the public repository marketplace.
- Maintainer validates npm readiness without uploading.
- Maintainer can explain why live Codex hook parity is not claimed yet.

## Open Questions

- Who will provide or restore npm auth for the actual registry upload.
- Whether a separate official directory submission exists beyond GitHub
  marketplace add for Codex.

## Source References

- `.thoughts/research/2026-06-17-plugin-marketplace-publication-readiness.md`
- `packages/plugin-codex/README.md`
- `packages/plugin-claude-code/README.md`
- `.agents/plugins/marketplace.json`
- `.claude-plugin/marketplace.json`
