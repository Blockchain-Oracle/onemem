# Verification Audit: Admin Capability Revoke

## Verdict

Pass.

Admin capability revoke is implemented as an Admin-gated namespace marker, and
the marker is enforced by the protocol paths that authorize trace writes and
Seal decrypt approval. The public TS SDK, CLI, and MCP surfaces expose the same
protocol path without claiming the holder-owned cap object is deleted.

Live disposable testnet mutation remains intentionally omitted. The feature is
covered by Move unit tests, package tests, structure tests, full monorepo
typecheck/build/test, and lint.

## Artifacts Checked

- `.thoughts/research/2026-06-18-admin-capability-revoke.md`
- `.thoughts/specs/2026-06-18-admin-capability-revoke.md`
- `.thoughts/stories/2026-06-18-admin-capability-revoke.md`
- `.thoughts/plans/2026-06-18-admin-capability-revoke.md`
- `contracts/onemem/sources/namespace.move`
- `contracts/onemem/sources/trace.move`
- `contracts/onemem/sources/seal_policy.move`
- `contracts/onemem/tests/admin_revoke_tests.move`
- `packages/sdk-ts/src/namespaces.ts`
- `packages/sdk-ts/src/traces.ts`
- `packages/cli-ts/src/commands/namespace.ts`
- `packages/mcp-server/src/index.ts`
- CLI, SDK, MCP, dashboard/share, and architecture docs changed in this slice.

## Requirement Traceability

- R1: `namespace::admin_revoke_capability` is Admin-gated through
  `assert_cap_for_namespace(admin, ns)`.
- R2: Revoked cap IDs are stored as dynamic fields under `MemoryNamespace.id`.
- R3: The revoke function checks `df::exists_` before `df::add`, so repeated
  revoke is idempotent.
- R4: `namespace::assert_cap_for_namespace` now rejects revoked cap IDs with
  `ECapabilityRevoked`.
- R5: `trace::open_session` and `trace::emit_call` already used the namespace
  gate; `trace::close_call` and `trace::close_session` now take the namespace
  and call the same gate.
- R6: `seal_policy::seal_approve` preserves wrong-namespace/inactive checks and
  then calls `namespace::assert_cap_for_namespace`.
- R7: TS SDK exposes `namespaces.adminRevokeCapability`.
- R8: CLI exposes `onemem namespace admin-revoke <namespace-id> <cap-id>`,
  requires an Admin cap, and keeps the existing `--allow-admin` safety guard for
  targeting Admin caps.
- R9: MCP registers `onemem_revoke_namespace_capability` with the same
  `allowAdmin` safety behavior.
- R10: Docs and share UI copy now distinguish holder self-revoke from Admin
  marker revoke.

## Acceptance Criteria Coverage

- AC1: Covered by `contracts/onemem/tests/admin_revoke_tests.move`, including
  marker behavior, revoked RW trace denial, revoked close denial, and revoked RO
  Seal denial.
- AC2: SDK transaction target coverage exists in
  `packages/sdk-ts/tests/namespaces.unit.test.ts`; CLI parsing/safety is covered
  by the CLI command implementation and package test/typecheck gates.
- AC3: MCP integration test expected tools include
  `onemem_revoke_namespace_capability`.
- AC4: Contract, SDK, CLI, and MCP tests passed locally.
- AC5: Structure tests passed with 401/401 checks.
- AC6: Live mutation was not run because it would mint/consume real Sui
  capability objects unless a disposable target is prepared first.

## Quality Gates

- `sui move test`: pass, 38/38 Move tests.
- `mise exec -- pnpm --filter @onemem/sdk-ts test`: pass, 74 passed, 5 skipped.
- `mise exec -- pnpm --filter @onemem/sdk-ts typecheck`: pass.
- `mise exec -- pnpm --filter @onemem/cli typecheck && mise exec -- pnpm --filter @onemem/cli test && mise exec -- pnpm --filter @onemem/cli build`: pass, 54 CLI tests.
- `mise exec -- pnpm --filter @onemem/mcp typecheck && mise exec -- pnpm --filter @onemem/mcp test && mise exec -- pnpm --filter @onemem/mcp build`: pass, MCP live tests skipped by design.
- `mise exec -- pnpm typecheck`: pass, 15/15 Turbo tasks.
- `mise exec -- pnpm test:demo-matrix`: pass, 17/17 Turbo tasks.
- `mise exec -- pnpm build`: pass, 13/13 Turbo tasks.
- `mise exec -- pnpm test`: pass, 16/16 Turbo tasks.
- `mise exec -- pnpm lint`: pass; Biome reports only a schema-version info
  message for `biome.json`.
- `mise exec -- pnpm test:structure`: pass, 401/401 checks.
- `git diff --check`: pass.
- `mise exec -- pnpm exec tsx scripts/codegen-move-types.ts`: pass and leaves
  generated addresses unchanged.

## Deviations From Plan

- The plan listed `mise exec -- pnpm --filter @onemem/contracts test`, but this
  repo's Move contract gate is `sui move test` from `contracts/onemem`.
- Full repo lint initially exposed pre-existing lint debt in scripts and stale
  suppressions. Those were cleaned instead of recording a red lint gate.
- A concurrent `pnpm typecheck` and `pnpm build` run raced on Next `.next`
  output. Running `pnpm build` alone passed; the race is not a source failure.

## Gaps And Risks

- No live disposable testnet admin revoke mutation has been performed yet.
- Existing deployed package migration and client release sequencing remain
  separate from this source-tree implementation.
- Hosted dashboard admin/owner revoke UI is still a follow-up; hosted copy now
  points to CLI/MCP support rather than pretending the UI handles it.
- Biome schema URL is still `2.0.0` while the installed CLI is `2.4.15`; this is
  informational and does not fail lint.

## Follow-ups

- Prepare a disposable testnet namespace/cap and run a live admin revoke smoke
  that proves the revoked cap cannot open, close, or approve Seal decrypt.
- Add hosted-dashboard admin revoke UX after deciding how the owner/Admin cap is
  selected in hosted state.
- Include this protocol change in the next package release and migration note.

## Evidence Log

- Context7 `/mystenlabs/sui` docs confirmed dynamic field `add` aborts on an
  existing field and `exists` can guard idempotent marker creation.
- Move tests now include `admin_revoke_tests.move`.
- Structure guard now tracks `admin_revoke_tests.move` and the CLI
  `admin-revoke` command docs.
- Full local gates passed after implementation and lint cleanup on
  2026-06-18.
