# Plan: Trace Close Upgrade Compatibility

## Inputs

- Research: `.thoughts/research/2026-06-18-trace-close-upgrade-compatibility.md`
- Spec: `.thoughts/specs/2026-06-18-trace-close-upgrade-compatibility.md`
- Stories: `.thoughts/stories/2026-06-18-trace-close-upgrade-compatibility.md`

## Assumptions

- Sui upgrade compatibility treats public function parameter shape as part of the
  existing package ABI.
- Adding public functions is allowed and is safer than mutating existing close
  signatures.
- SDK method names can stay stable while Move target names change.

## Phase 1: Protocol Compatibility

### Goal

Preserve old close signatures and add enforceable namespace-aware close paths.

### Work

- Restore old public `close_call` and `close_session` signatures.
- Make old close functions abort with a dedicated compatibility error.
- Add `close_call_with_namespace` and `close_session_with_namespace` containing
  the current namespace-aware close logic.
- Update Move tests to call the new functions where normal close behavior is
  expected.
- Add focused tests proving deprecated close functions abort.

### Checks

- `sui move test`

## Phase 2: SDK And Smoke Path

### Goal

Point clients at the additive namespace-aware ABI.

### Work

- Update TS SDK transaction targets.
- Add fast unit tests around close/end Move targets.
- Update `scripts/sdk-smoke-testnet.ts` to include `namespaceId`.

### Checks

- `mise exec -- pnpm --filter @onemem/sdk-ts test`
- `mise exec -- pnpm --filter @onemem/sdk-ts typecheck`

## Phase 3: Docs And Upgrade Probe

### Goal

Keep current docs honest and prove the source shape non-mutatively.

### Work

- Update current architecture/docs references from old close names to
  namespace-aware close names where they describe the active protocol API.
- Run full repo gates and `git diff --check`.
- Run `sui client upgrade --dry-run` against testnet upgrade cap and record the
  outcome.
- Write verification audit.

### Checks

- `mise exec -- pnpm lint`
- `mise exec -- pnpm typecheck`
- `mise exec -- pnpm build`
- `mise exec -- pnpm test`
- `mise exec -- pnpm test:structure`
- `sui client upgrade --dry-run --upgrade-capability <testnet cap>`

## Stop Condition

All local gates pass, dry-run result is recorded, and the patch is committed and
pushed for CI.
