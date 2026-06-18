# Spec: Architecture Status Refresh

## Objective

Refresh current-facing architecture status tables so they describe the actual
OneMem protocol and SDK state instead of preserving stale design-phase
`pending` rows for built work.

## Background And Current Reality

The architecture folder already warns readers that many docs are historical.
However, the protocol and SDK README status tables are still close enough to
active navigation that stale `pending` rows create confusion for future agents
and release work.

Research shows the Move protocol is implemented, tested, and deployed on
testnet package version 2. Research also shows the TypeScript SDK is built and
published at `@onemem/sdk-ts@0.6.0`, while the Python SDK has repo-local source
at `0.2.0` but is still missing from PyPI.

## Users

- Future Codex/Claude agents selecting the next project slice.
- Release operators checking what is actually published.
- Developers navigating architecture docs before changing protocol or SDK code.

## Goals

- Replace stale protocol `pending` rows with scoped built/testnet status.
- Replace stale SDK `pending` rows with scoped TS/Python status.
- Preserve honest pending items for mainnet deployment, Python publication, and
  incomplete Python write parity.
- Add structure guards so core protocol/SDK README rows cannot silently return
  to all-pending status.

## Non-goals

- Do not publish packages.
- Do not deploy mainnet.
- Do not rewrite all historical architecture docs.
- Do not claim Python SDK parity beyond current source evidence.

## Requirements

1. `docs/05-our-architecture/01-protocol/README.md` must no longer mark built
   protocol components as `⏳ pending`.
2. `docs/05-our-architecture/01-protocol/README.md` must keep mainnet
   deployment explicitly not done.
3. `docs/05-our-architecture/02-sdks/README.md` must no longer mark built TS
   SDK source/published rows as `⏳ pending`.
4. `docs/05-our-architecture/02-sdks/README.md` must distinguish Python
   repo-local source from missing PyPI publication and incomplete write parity.
5. Structure tests must reject stale pending rows for the built protocol and TS
   SDK status rows.
6. The docs must cite live status commands or current source locations so future
   agents know how to re-check claims.

## Acceptance Criteria

- AC1: A reader sees the Move package skeleton, namespace, trace, action-call,
  capability, Seal policy, authenticated events, and upgrade field as built or
  testnet-proven, not pending.
- AC2: A reader sees mainnet deployment as pending until actual mainnet evidence
  exists.
- AC3: A reader sees `@onemem/sdk-ts` as built and npm-current at `0.6.0`.
- AC4: A reader sees `onemem-sdk-python` as repo-local `0.2.0` but missing
  PyPI publication and not full TS write parity.
- AC5: `pnpm test:structure` fails if the old all-pending protocol/SDK status
  rows are reintroduced.
- AC6: Verification records the registry status and structure-test evidence.

## Constraints

- Keep docs concise; do not turn historical README files into large new specs.
- Use ASCII-safe prose except for status glyphs already used by these docs.
- Do not hide publication gaps behind "built" language.

## Stories Needed

- Developer reads protocol status before changing Move code.
- Release operator reads SDK status before making public install claims.
- Future agent runs structure tests and catches stale status regression.

## Open Questions

- None blocking.

## Source References

- `.thoughts/research/2026-06-18-architecture-status-refresh.md`
- `.thoughts/quality/2026-06-17-project-quality-profile.md`
- `config/networks.json`
- `contracts/onemem/Published.toml`
- `packages/sdk-ts/src/index.ts`
- `packages/sdk-python/onemem/__init__.py`
