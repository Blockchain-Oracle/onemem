# Verification Audit: Codex Hook Matcher And Proof Boundary

## Verdict

Conditional pass.

The package matcher, docs, and guards now match the observed proof boundary.
Full automatic Codex hook tracing remains unclaimed until a trusted interactive
`/hooks` session emits a verifiable on-chain OneMem `TraceSession`.

## Artifacts Checked

- Research:
  `.thoughts/research/2026-06-18-codex-hook-proof-boundary.md`
- Spec:
  `.thoughts/specs/2026-06-18-codex-hook-proof-boundary.md`
- Stories:
  `.thoughts/stories/2026-06-18-codex-hook-proof-boundary.md`
- Plan:
  `.thoughts/plans/2026-06-18-codex-hook-proof-boundary.md`
- Package:
  `packages/plugin-codex/hooks/hooks.json`
  `packages/plugin-codex/tests/plugin.test.ts`
  `packages/plugin-codex/README.md`
- Docs:
  `docs/03-target-runtimes/README.md`
  `docs/03-target-runtimes/codex-cli-deep.md`
  `docs/05-our-architecture/03-runtimes/codex-cli-integration.md`
  `apps/docs/integrations/runtimes.mdx`
- Guards:
  `tests/structure/plugins-apps.test.ts`
  `tests/structure/context-artifacts.test.ts`

## Requirement Traceability

| Requirement | Evidence |
|---|---|
| R1: Empty `SessionStart` matcher | `hooks/hooks.json` and plugin unit test guard matcher `""`. |
| R2: SessionStart arms local state | README and runtime docs no longer say `SessionStart` opens the final trace. |
| R3: `codex exec` v0.140 boundary | Runtime docs and docs app record that local exec-mode tests did not run hooks. |
| R4: Structure tests guard boundary | `plugins-apps.test.ts` checks matcher, manifest field, and README wording. |
| R5: Manifest remains validator-compatible | `plugin.json` still omits unsupported `hooks` field. |

## Acceptance Criteria Coverage

| Acceptance Criterion | Evidence |
|---|---|
| AC1: Plugin tests pass | `mise exec -- pnpm --filter @onemem/codex-plugin test` passed, 9/9. |
| AC2: Structure tests pass | `mise exec -- pnpm test:structure` passed, 373/373. |
| AC3: Plugin validation passes | `mise exec -- uv run --with pyyaml python .../validate_plugin.py packages/plugin-codex` passed. |
| AC4: Codex text not under Claude section | `docs/03-target-runtimes/README.md` patched. |
| AC5: Proof and gap recorded | This audit and research brief record install, bootstrap trace, and `/hooks` gap. |

## Quality Gates

Executed:

```bash
mise exec -- pnpm --filter @onemem/codex-plugin test
mise exec -- pnpm --filter @onemem/codex-plugin lint
mise exec -- uv run --with pyyaml python /Users/abu/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py packages/plugin-codex
mise exec -- pnpm exec biome check packages/plugin-codex docs/03-target-runtimes docs/05-our-architecture/03-runtimes apps/docs/integrations tests/structure .thoughts
mise exec -- pnpm test:structure
git diff --check
```

Results:

- Codex plugin tests: passed, 9/9.
- Codex plugin lint: passed.
- Plugin validation: passed.
- Targeted Biome check: passed, 16 files checked.
- Structure tests: passed, 373/373.
- Structure shard cap: passed, all shards below 300 lines.
- Source cap: passed, no source file above 400 lines.
- Whitespace check: passed.

## Deviations From Plan

- None recorded yet.

## Gaps And Risks

- `codex exec` on Codex CLI 0.140 did not execute hooks in local proof attempts.
- Interactive trusted `/hooks` proof remains the required runtime proof.
- Codex CLI 0.141 behavior is not yet checked.

## Follow-ups

- Run an interactive `/hooks` session and verify the emitted session with the
  OneMem verifier.
- Retest `codex exec` hook behavior after a controlled Codex CLI upgrade.

## Evidence Log

- Public Codex plugin install succeeded earlier in this slice.
- Sui bootstrap trace verified earlier:
  `0xcf956e819ba0fcfd772c0be1519adefe4e05bd10bb598d6586f01a702fe1c9b1`.
