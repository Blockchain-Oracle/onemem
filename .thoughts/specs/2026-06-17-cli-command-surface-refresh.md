# Spec: CLI Command Surface Refresh

## Objective

Make the CLI architecture README and load-bearing command-surface doc match the
current TS and Python CLI implementations, while preserving deferred command
ideas as explicit non-current work.

## Background And Current Reality

The actual TS CLI has a compact v0.1 surface for verification, trace inspection,
health, hosted login pairing, namespace capability sharing/revocation/history,
init, and MemWal-backed add/search. The Python CLI is a read-only mirror for
verify/trace/health. `command-surface.md` still documents a much larger planned
surface as if it were implemented.

## Users

- Future agents implementing or reviewing CLI work.
- Developers choosing TS vs Python CLI.
- Users reading architecture docs to understand what commands exist now.

## Goals

- Update CLI status in `docs/05-our-architecture/05-cli/README.md`.
- Rewrite `command-surface.md` as the current v0.1 command surface.
- Refresh `packages/cli-ts/README.md`, `apps/docs/reference/cli.mdx`, and TS
  CLI help text where they omit implemented namespace commands or `local`.
- Clearly mark deferred commands outside the current command list.
- Add a structure guard so unimplemented commands do not return as current
  command sections.

## Non-goals

- Do not implement new CLI commands.
- Do not claim Python provisioning/memory parity.
- Do not claim live hosted login popup proof.
- Do not rewrite older implementation-design docs in this slice.

## Requirements

- R1: CLI README status must state TS and Python package skeletons/surfaces are
  built and describe TS/Python parity honestly.
- R2: `command-surface.md` must list only commands currently registered in code
  as current v0.1 commands.
- R3: Deferred commands must be visible as deferred, not current.
- R4: Structure tests must guard against current command sections for known
  unimplemented commands.
- R5: Package/public CLI references must include implemented namespace
  capability commands, correct `add`/`search` prerequisites, and the `local`
  network option.
- R6: Context Engineering artifacts and wiki/log must record the cleanup.

## Acceptance Criteria

- AC1: `pnpm test:structure` passes.
- AC2: `git diff --check` passes.
- AC3: A targeted search confirms `command-surface.md` does not contain current
  headings for known deferred commands.
- AC4: The verification artifact records scope, evidence, and residual risk.

## Constraints

- Existing dirty worktree must be preserved.
- This is docs/test/context cleanup; run `pnpm test:structure` at minimum.
- If code help text changes, run focused `@onemem/cli` package gates.
- Keep artifacts in repo-local `.thoughts/`.

## Stories Needed

- Developer reads the command-surface doc and sees only commands that exist now.
- Future agent running structure tests catches deferred commands advertised as
  current.

## Open Questions

- Whether a later slice should update historical implementation design docs or
  mark them with stronger historical banners.

## Source References

- `.thoughts/research/2026-06-17-cli-command-surface-refresh.md`
- `packages/cli-ts/src/index.ts`
- `packages/cli-python/onemem_cli/main.py`
- `packages/cli-ts/README.md`
- `packages/cli-python/README.md`
