# Spec: Trace Close Upgrade Compatibility

## Objective

Make the admin-revoke trace close changes compatible with Sui package upgrade
rules while preserving revoked-cap enforcement for trace close operations.

## Background And Current Reality

Admin revoke stores revoked cap IDs under the namespace object. Trace close
operations therefore need the namespace object to enforce revocation. The first
implementation added that namespace argument to existing public Move functions,
which is source-correct but upgrade-risky for an already published package.

## Users

- OneMem operators upgrading the published testnet package.
- SDK and plugin users closing trace calls and sessions.
- Namespace admins relying on revoked caps being rejected on every trace write
  path.

## Goals

- Preserve old public `trace::close_call` and `trace::close_session` signatures.
- Prevent old close functions from authorizing trace mutations without a
  namespace check.
- Add new namespace-aware close functions for active clients.
- Update TS SDK, manual smoke test, Move tests, and current docs to use the new
  close functions.
- Prove the source with local tests and a non-mutating upgrade dry run.

## Non-goals

- Do not submit a live package upgrade in this slice.
- Do not change `TraceSession` or `ActionCall` struct layouts.
- Do not remove SDK method names `closeCall` and `endSession`; only their Move
  targets change.

## Requirements

- R1: Existing public Move signatures for `trace::close_call` and
  `trace::close_session` must remain present.
- R2: Deprecated old close functions must abort rather than bypass revoked-cap
  enforcement.
- R3: New namespace-aware functions must enforce namespace identity and revoked
  cap checks.
- R4: TS SDK `closeCall` and `endSession` must target the new Move functions.
- R5: Manual testnet smoke script must pass `namespaceId` for close operations.
- R6: Move tests must cover both active namespace-aware close behavior and
  deprecated old-function abort behavior.
- R7: Current architecture docs must identify the namespace-aware close function
  names.

## Acceptance Criteria

- AC1: `sui move test` passes.
- AC2: Focused SDK tests prove close/end transaction targets use the new
  namespace-aware functions.
- AC3: Full repo quality gates pass.
- AC4: `sui client upgrade --dry-run` is attempted and recorded honestly.
- AC5: Verification audit records any remaining live-migration gap.

## Constraints

- `contracts/onemem/sources/trace.move` must remain under the product source cap.
- Avoid growing already-large Move test files; add a small focused test file if
  needed.

## Source References

- `.thoughts/research/2026-06-18-trace-close-upgrade-compatibility.md`
- Context7 `/mystenlabs/sui` package upgrade compatibility docs
