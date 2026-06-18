# Spec: Registry-Aware Current Docs

## Problem

Current docs show target public install commands and local-source APIs for
packages whose public npm/PyPI artifacts are missing or stale. That can mislead
users and future agents into believing registry publication has already caught
up with source.

## Goals

- Keep source README examples available for local development.
- Mark missing and drifted registry publication state in package READMEs.
- Add current publication notes to public docs that show target install
  commands.
- Keep Codex/Claude hook proof boundaries explicit.
- Add structure tests so the warning boundary does not regress.

## Non-Goals

- Publish packages.
- Bump package versions.
- Rewrite historical architecture docs line by line.
- Change runtime behavior.

## Requirements

1. CLI and dashboard docs must not imply `@onemem/cli`,
   `@onemem/dashboard`, or `onemem-cli` are already public at current local
   versions.
2. Provider docs must state that helper APIs in source require the local patch
   versions until public registries catch up.
3. Runtime plugin docs must state that GitHub marketplace install and local
   package proof are separate from npm publication, and that trusted hook
   execution remains a separate proof boundary where applicable.
4. Public docs must point users to `pnpm registry:status` for current truth.
5. Structure tests must guard the current publication warning boundary.

## Acceptance Criteria

- `pnpm test:structure` passes.
- Public quickstart and CLI reference include registry-status language.
- Provider public docs include registry-drift language.
- Package READMEs for missing/drifted packages include publication notes.
- No new docs claim npm/PyPI publication success for missing/drifted packages.
