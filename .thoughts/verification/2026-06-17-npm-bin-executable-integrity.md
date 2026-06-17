# Verification Audit: Npm Bin Executable Integrity

## Verdict

Pass.

All npm package `bin` entries now point to existing executable Node scripts, and
dry-pack output reports executable mode for every bin artifact. The previously
non-executable `packages/plugin-openclaw/bin/init.mjs` now has owner execute
permission.

## Artifacts Checked

- `.thoughts/research/2026-06-17-npm-bin-executable-integrity.md`
- `.thoughts/specs/2026-06-17-npm-bin-executable-integrity.md`
- `.thoughts/stories/2026-06-17-npm-bin-executable-integrity.md`
- `.thoughts/plans/2026-06-17-npm-bin-executable-integrity.md`
- `packages/*/package.json`
- Bin files under `packages/*/bin`
- `tests/structure.test.ts`

## Requirement Traceability

| Requirement | Evidence |
|---|---|
| R1: Every package `bin` target must exist | New structure test scans all TS package manifests and asserts every bin target exists. |
| R2: Every package `bin` target must start with `#!/usr/bin/env node` | New structure test asserts each bin file starts with the Node shebang. |
| R3: Every package `bin` target must be executable for the owner | New structure test asserts owner execute bit for each bin target. |
| R4: OpenClaw bin becomes executable | `ls -l packages/plugin-openclaw/bin/init.mjs` reports `-rwxr-xr-x`. |
| R5: Dry-pack output reports executable mode | Dry-pack loop reported `mode=493 executable=true` for all bin entries. |
| R6: CE artifacts are registered | `tests/structure.test.ts` registers this research/spec/stories/plan/verification artifact set. |

## Acceptance Criteria Coverage

| Acceptance Criterion | Evidence |
|---|---|
| AC1: stat/structure checks prove executable bits | `ls -l` reports executable modes for all six bin files; structure test covers owner execute bit. |
| AC2: dry-pack reports mode 493 for all bins | Dry-pack loop reported `mode=493 executable=true` for `@onemem/cli`, `@onemem/dashboard`, `@onemem/mcp`, `@onemem/oc-onemem`, and both `@onemem/sdk-ts` bins. |
| AC3: structure guard passes | `pnpm test:structure` passed, 285 tests. |
| AC4: whitespace guard passes | `git diff --check` passed after final audit/wiki updates. |

## Quality Gates

- `ls -l` over all package bin files - passed; each file has owner execute bit.
- `npm pack --dry-run --json` loop over all bin packages - passed; each bin
  entry reports executable mode.
- `pnpm exec biome check tests/structure.test.ts` - passed; checked one file
  with no fixes applied.
- `pnpm test:structure` - passed, 285 tests.
- `git diff --check` - passed after final audit/wiki updates.

## Deviations From Plan

None.

## Gaps And Risks

- This slice did not publish to npm or bump versions.
- The proof uses local dry-pack output, not registry-side installation.

## Follow-ups

- Continue npm artifact audits for package payload completeness and install
  smoke behavior.

## Evidence Log

- Mode change:
  - `packages/plugin-openclaw/bin/init.mjs`
- Changed guard:
  - `tests/structure.test.ts`
- Added artifacts:
  - `.thoughts/research/2026-06-17-npm-bin-executable-integrity.md`
  - `.thoughts/specs/2026-06-17-npm-bin-executable-integrity.md`
  - `.thoughts/stories/2026-06-17-npm-bin-executable-integrity.md`
  - `.thoughts/plans/2026-06-17-npm-bin-executable-integrity.md`
- Updated wiki:
  - `.thoughts/wiki/context-engineering-status.md`
  - `.thoughts/wiki/index.md`
  - `.thoughts/wiki/log.md`
