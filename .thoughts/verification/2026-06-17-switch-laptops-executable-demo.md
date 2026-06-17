# Verification Audit: Switch Laptops Executable Demo

## Verdict

Pass.

The Switch Laptops demo is now an executable safe testnet harness. It writes two
real OneMem `TraceSession`s in one namespace, verifies both sessions from Sui
data, writes a machine-readable artifact, and documents the mocked-runtime proof
boundary. It does not claim real Claude Code hooks, Hermes hooks, MemWal recall,
cross-device login, Walrus plaintext, or Seal decryptability.

## Artifacts Checked

- `.thoughts/research/2026-06-17-switch-laptops-executable-demo.md`
- `.thoughts/specs/2026-06-17-switch-laptops-executable-demo.md`
- `.thoughts/stories/2026-06-17-switch-laptops-executable-demo.md`
- `.thoughts/plans/2026-06-17-switch-laptops-executable-demo.md`
- `demos/switch-laptops/package.json`
- `demos/switch-laptops/tsconfig.json`
- `demos/switch-laptops/src/trace-model.ts`
- `demos/switch-laptops/src/trace-model.test.ts`
- `demos/switch-laptops/src/mock-switch-trace.ts`
- `demos/switch-laptops/README.md`
- `docs/05-our-architecture/08-demos-and-tests/README.md`
- `tests/structure.test.ts`

## Requirement Traceability

- R1: Passed. The command resolves/defaults to testnet and rejects any network
  other than `testnet`.
- R2: Passed. Live run used one namespace:
  `0xf6e5d42df661c748df8211e77a7356ef8ea290e601141569d863a38b9eda12af`.
- R3: Passed. Laptop A session contains `inspect_project_context`,
  `write_project_memory`, and `prepare_runtime_handoff`.
- R4: Passed. Laptop B session contains `recall_project_memory` and
  `answer_from_memory`, with the recalled memory reference from Laptop A.
- R5: Passed. Demo verification and independent CLI verification returned
  `ok: true` for both sessions.
- R6: Passed. `demos/switch-laptops/out/latest-trace.json` contains both
  session IDs, namespace ID, call IDs, verifier roots, dashboard/public verifier
  paths, Suiscan URLs, continuity facts, and proof boundaries.
- R7: Passed. Unit tests cover call ordering and deterministic hashing.
- R8: Passed. Structure tests guard the executable demo package files.
- R9: Passed. Demo README and demos overview mark the demo executable and call
  out the mocked runtime boundary.

## Acceptance Criteria Coverage

- AC1: `pnpm --filter @onemem/demo-switch-laptops test` passed.
- AC2: `pnpm --filter @onemem/demo-switch-laptops typecheck` passed.
- AC3: `pnpm --filter @onemem/demo-switch-laptops lint` passed.
- AC4: `pnpm --filter @onemem/demo-switch-laptops demo:trace --json` passed
  and created two live verified testnet sessions in one namespace.
- AC5: CLI `verify` passed for both sessions:
  - Laptop A:
    `0x8b94875ac47a0a465825efffcd4f18aeae076f54869c07c8254158827df55c80`
  - Laptop B:
    `0x4fa78b3df807b0f55ea21712f65c80ae01830113898ba0855c54043c5bdcffb1`
- AC6: `node --import tsx --test tests/structure.test.ts` passed locally.
- AC7: `git diff --check` passed.

## Quality Gates

```bash
pnpm --filter @onemem/demo-switch-laptops test
pnpm --filter @onemem/demo-switch-laptops typecheck
pnpm --filter @onemem/demo-switch-laptops lint
pnpm --filter @onemem/demo-switch-laptops build
```

Result: all passed.

```bash
pnpm --filter @onemem/demo-switch-laptops demo:trace --json
```

Result: passed. Live testnet evidence:

- Namespace:
  `0xf6e5d42df661c748df8211e77a7356ef8ea290e601141569d863a38b9eda12af`
- Laptop A session:
  `0x8b94875ac47a0a465825efffcd4f18aeae076f54869c07c8254158827df55c80`
- Laptop B session:
  `0x4fa78b3df807b0f55ea21712f65c80ae01830113898ba0855c54043c5bdcffb1`
- Continuity: same namespace, distinct sessions, distinct runtimes.

```bash
pnpm --filter @onemem/cli exec tsx src/index.ts --network testnet --json verify 0x8b94875ac47a0a465825efffcd4f18aeae076f54869c07c8254158827df55c80
pnpm --filter @onemem/cli exec tsx src/index.ts --network testnet --json verify 0x4fa78b3df807b0f55ea21712f65c80ae01830113898ba0855c54043c5bdcffb1
```

Result: both passed with `ok: true`.

```bash
pnpm --filter @onemem/cli exec tsx src/index.ts --network testnet trace events 0x8b94875ac47a0a465825efffcd4f18aeae076f54869c07c8254158827df55c80
pnpm --filter @onemem/cli exec tsx src/index.ts --network testnet trace events 0x4fa78b3df807b0f55ea21712f65c80ae01830113898ba0855c54043c5bdcffb1
```

Result: event chains showed the expected tool names and linked-call order.

```bash
node --import tsx --test tests/structure.test.ts
git diff --check
```

Result: both passed.

## Deviations From Plan

- The unit test command uses Node's built-in test runner through `tsx` instead
  of Vitest. This avoids the Vitest worker timeout seen earlier in this
  workspace while preserving deterministic package-level coverage.

## Gaps And Risks

- The demo uses mocked runtime labels and placeholder memory blob IDs. It proves
  same-namespace trace continuity, not real runtime hooks or semantic memory.
- The live artifact under `demos/switch-laptops/out/latest-trace.json` is
  intentionally ignored by git.

## Follow-ups

- Drive real trusted Claude Code and Hermes hooks in a later slice if the demo
  needs runtime-authentic proof rather than deterministic testnet trace proof.
- Consider dashboard paired-session visualization after more cross-runtime demos
  exist.

## Evidence Log

- Live run ID: `2026-06-17T19:38:26.256Z`
- Laptop A call count: 3.
- Laptop B call count: 2.
- CLI verifier roots matched for both sessions.
