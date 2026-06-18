# Verification Audit: Architecture Status Refresh

## Verdict

Pass.

The protocol and SDK architecture status tables now match current repo and
registry evidence. Built protocol and TypeScript SDK rows no longer show stale
`pending` status, while actual gaps such as mainnet deployment and Python SDK
PyPI publication remain explicit.

## Artifacts Checked

- Research:
  `.thoughts/research/2026-06-18-architecture-status-refresh.md`
- Spec:
  `.thoughts/specs/2026-06-18-architecture-status-refresh.md`
- Stories:
  `.thoughts/stories/2026-06-18-architecture-status-refresh.md`
- Plan:
  `.thoughts/plans/2026-06-18-architecture-status-refresh.md`
- Docs:
  `docs/05-our-architecture/README.md`
  `docs/05-our-architecture/01-protocol/README.md`
  `docs/05-our-architecture/02-sdks/README.md`
- Guard:
  `tests/structure/architecture-status.test.ts`

## Requirement Traceability

| Requirement | Evidence |
|---|---|
| R1: Protocol README built components not pending | Protocol rows now describe Move package, namespace, trace, action call, capability, Seal, authenticated events, upgrade fields, and testnet deployment as built/testnet-proven. |
| R2: Mainnet deployment still not done | Protocol README keeps `Mainnet deployment` as `⏳ pending` and says no mainnet package ID is recorded. |
| R3: TS SDK built/published rows not pending | SDK README marks TS skeleton, namespace ops, trace emit, and npm publication as built/current. |
| R4: Python source vs PyPI/parity boundary | SDK README says Python SDK is repo-local `0.2.0`, partial read/verify + memory bridge, and missing from PyPI. |
| R5: Structure tests reject stale rows | `tests/structure/architecture-status.test.ts` asserts built protocol and TS SDK rows are not `⏳ pending`, while allowing mainnet/PyPI pending rows. |
| R6: Docs cite re-check sources | Protocol README points to manifests, generated addresses, `sui move test`, and `verify-mainnet`; SDK README points to source directories and `pnpm registry:status`. |

## Acceptance Criteria Coverage

| Acceptance Criterion | Evidence |
|---|---|
| AC1: Built Move components not pending | `pnpm test:structure` passes the new protocol status guard. |
| AC2: Mainnet stays pending | Targeted search finds only the intentional `Mainnet deployment` pending row in protocol docs. |
| AC3: `@onemem/sdk-ts` built/current at `0.6.0` | SDK README states npm current at `0.6.0`; `pnpm registry:status` reports `@onemem/sdk-ts` current at `0.6.0`. |
| AC4: Python SDK source/PyPI boundary explicit | SDK README states repo-local `0.2.0`, partial parity, and PyPI missing; registry status reports `onemem-sdk-python` missing. |
| AC5: Guard catches stale status regression | New structure shard passed and checks built protocol/SDK rows directly. |
| AC6: Verification records registry and structure evidence | This audit records both command outputs and intentional remaining pending rows. |

## Quality Gates

Passed:

```bash
mise exec -- pnpm exec tsx --test tests/structure/architecture-status.test.ts
```

Result: 3 tests passed.

```bash
mise exec -- pnpm test:structure
```

Result: 412 tests passed, 0 failed.

```bash
mise exec -- pnpm exec biome check docs/05-our-architecture/README.md docs/05-our-architecture/01-protocol/README.md docs/05-our-architecture/02-sdks/README.md tests/structure/architecture-status.test.ts
```

Result: passed for the checkable file set.

```bash
git diff --check
```

Result: passed.

```bash
mise exec -- pnpm registry:status
```

Result: passed. Relevant evidence:

- `@onemem/sdk-ts` local `0.6.0`, registry `0.6.0`, status `current`.
- `onemem-sdk-python` local `0.2.0`, registry `-`, status `missing`.
- Other npm/PyPI missing or drifted packages remain separate release follow-up.

Targeted stale-row search:

- No hits for old built protocol rows as `⏳ pending`.
- No hits for old TS SDK rows as `⏳ pending`.
- Intentional hits remain for:
  - `Mainnet deployment | ⏳ pending`
  - `onemem-sdk-python published to PyPI | ⏳ pending`

## Deviations From Plan

- The parent architecture overview table was also refreshed because it is a
  current navigation entry point and still contained stale all-pending rows.
  This is aligned with the spec objective and did not expand into a full rewrite
  of every historical architecture document.

## Gaps And Risks

- Registry publication remains incomplete; this slice does not publish npm or
  PyPI packages.
- Mainnet deployment remains incomplete; this slice does not mutate mainnet.
- Python SDK full write parity remains future work.

## Follow-ups

- Publish missing/drifted npm/PyPI packages after valid registry credentials or
  trusted-publisher settings exist.
- Deploy mainnet only after explicit release readiness and mainnet verification
  gates are satisfied.
- Continue converting stale historical status tables only when they are active
  navigation surfaces or confuse current work.

## Evidence Log

- Testnet package v2:
  `0xc2e839c719e1c61222440f5661199e68de5413d8cfb49dd8bae3223e92fcf138`
- `@onemem/sdk-ts` npm status: current at `0.6.0`.
- `onemem-sdk-python` PyPI status: missing.
- Structure shard line count: `69`, under the 300-line shard cap.
