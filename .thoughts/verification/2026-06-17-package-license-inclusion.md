# Verification Audit: Package License Inclusion

## Verdict

Pass.

All ten publishable JavaScript `@onemem/*` packages that list `LICENSE` in
their npm `files` allowlist now contain a package-local Apache-2.0 `LICENSE`
file. A dry-pack verification loop confirmed every targeted npm tarball includes
`LICENSE`, and structure tests now guard the package-local license requirement.

## Artifacts Checked

- `.thoughts/research/2026-06-17-package-license-inclusion.md`
- `.thoughts/specs/2026-06-17-package-license-inclusion.md`
- `.thoughts/stories/2026-06-17-package-license-inclusion.md`
- `.thoughts/plans/2026-06-17-package-license-inclusion.md`
- Root `LICENSE`
- `packages/*/package.json`
- Package-local `LICENSE` files under the ten JS packages
- `tests/structure.test.ts`

## Requirement Traceability

| Requirement | Evidence |
|---|---|
| R1: `packages/brand/LICENSE` exists and contains Apache-2.0 text | Manifest scan reported `@onemem/brand files_has_LICENSE=true local_LICENSE=true apache_text=true`. |
| R2: `packages/cli-ts/LICENSE` exists and contains Apache-2.0 text | Manifest scan reported `@onemem/cli files_has_LICENSE=true local_LICENSE=true apache_text=true`. |
| R3: `packages/dashboard/LICENSE` exists and contains Apache-2.0 text | Manifest scan reported `@onemem/dashboard files_has_LICENSE=true local_LICENSE=true apache_text=true`. |
| R4: `packages/mcp-server/LICENSE` exists and contains Apache-2.0 text | Manifest scan reported `@onemem/mcp files_has_LICENSE=true local_LICENSE=true apache_text=true`. |
| R5: `packages/plugin-claude-code/LICENSE` exists and contains Apache-2.0 text | Manifest scan reported `@onemem/claude-code-plugin files_has_LICENSE=true local_LICENSE=true apache_text=true`. |
| R6: `packages/plugin-codex/LICENSE` exists and contains Apache-2.0 text | Manifest scan reported `@onemem/codex-plugin files_has_LICENSE=true local_LICENSE=true apache_text=true`. |
| R7: `packages/plugin-openclaw/LICENSE` exists and contains Apache-2.0 text | Manifest scan reported `@onemem/oc-onemem files_has_LICENSE=true local_LICENSE=true apache_text=true`. |
| R8: `packages/provider-openai-agents/LICENSE` exists and contains Apache-2.0 text | Manifest scan reported `@onemem/openai-agents files_has_LICENSE=true local_LICENSE=true apache_text=true`. |
| R9: `packages/provider-vercel-ai/LICENSE` exists and contains Apache-2.0 text | Manifest scan reported `@onemem/vercel-ai-provider files_has_LICENSE=true local_LICENSE=true apache_text=true`. |
| R10: `packages/sdk-ts/LICENSE` exists and contains Apache-2.0 text | Manifest scan reported `@onemem/sdk-ts files_has_LICENSE=true local_LICENSE=true apache_text=true`. |
| R11: Structure tests guard package-local license presence | `tests/structure.test.ts` now checks each JS package manifest lists `LICENSE`, the file exists, and it contains Apache-2.0 text. |
| R12: Dry-pack verification proves `LICENSE` is included | Dry-pack loop returned `LICENSE=true` for all ten targeted npm packages. |
| R13: CE artifacts are registered | `tests/structure.test.ts` registers this research/spec/stories/plan/verification artifact set. |

## Acceptance Criteria Coverage

| Acceptance Criterion | Evidence |
|---|---|
| AC1: Manifest scan reports local license files present | Node scan reported `files_has_LICENSE=true local_LICENSE=true apache_text=true` for all ten packages. |
| AC2: Dry-pack reports `LICENSE` in each tarball | Dry-pack loop reported `LICENSE=true` for `@onemem/brand`, `@onemem/cli`, `@onemem/dashboard`, `@onemem/mcp`, `@onemem/claude-code-plugin`, `@onemem/codex-plugin`, `@onemem/oc-onemem`, `@onemem/openai-agents`, `@onemem/vercel-ai-provider`, and `@onemem/sdk-ts`. |
| AC3: Structure guard passes | `pnpm test:structure` passed, 261 tests. |
| AC4: Whitespace guard passes | `git diff --check` passed after the final audit/wiki updates. |

## Quality Gates

- `find packages -maxdepth 2 -name LICENSE -print | sort` - passed; ten
  package-local license files present.
- Node manifest scan - passed; all ten packages report
  `files_has_LICENSE=true`, `local_LICENSE=true`, and `apache_text=true`.
- `npm pack --dry-run --json` loop over all ten targeted package directories -
  passed; each result includes `LICENSE=true`.
- `pnpm exec biome check tests/structure.test.ts` - passed; checked one file
  with no fixes applied.
- `pnpm test:structure` - passed, 261 tests.
- `git diff --check` - passed after the final audit/wiki updates.

## Deviations From Plan

None.

## Gaps And Risks

- This slice did not audit Python package source distributions or wheels.
- This slice did not publish packages or bump versions.
- The dashboard dry-pack contains many existing build artifacts; this audit only
  asserts license inclusion, not the full dashboard publish payload.

## Follow-ups

- Run a separate Python package artifact/license audit if PyPI packaging becomes
  the next release-readiness focus.
- Keep npm version bump and publish operations separate from this hygiene slice.

## Evidence Log

- Added package-local license files:
  - `packages/brand/LICENSE`
  - `packages/cli-ts/LICENSE`
  - `packages/dashboard/LICENSE`
  - `packages/mcp-server/LICENSE`
  - `packages/plugin-claude-code/LICENSE`
  - `packages/plugin-codex/LICENSE`
  - `packages/plugin-openclaw/LICENSE`
  - `packages/provider-openai-agents/LICENSE`
  - `packages/provider-vercel-ai/LICENSE`
  - `packages/sdk-ts/LICENSE`
- Changed guard:
  - `tests/structure.test.ts`
- Added artifacts:
  - `.thoughts/research/2026-06-17-package-license-inclusion.md`
  - `.thoughts/specs/2026-06-17-package-license-inclusion.md`
  - `.thoughts/stories/2026-06-17-package-license-inclusion.md`
  - `.thoughts/plans/2026-06-17-package-license-inclusion.md`
- Updated wiki:
  - `.thoughts/wiki/context-engineering-status.md`
  - `.thoughts/wiki/index.md`
  - `.thoughts/wiki/log.md`
