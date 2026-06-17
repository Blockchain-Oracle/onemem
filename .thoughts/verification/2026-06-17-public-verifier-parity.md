# Verification Audit: Public Verifier Prototype Parity

## Verdict

Pass.

Hosted `/verify/[session_id]` now renders the prototype's explicit trust moment:
a public verifier result, expected/computed roots, call evidence rows, and
separate "Proven" / "Not proven" disclosure panels. The display call list now
uses paginated `ActionCallEmittedEvent` reads instead of the previous latest-50
global query.

## Artifacts Checked

- Spec:
  `.thoughts/specs/2026-06-17-public-verifier-parity.md`
- Stories:
  `.thoughts/stories/2026-06-17-public-verifier-parity.md`
- Plan:
  `.thoughts/plans/2026-06-17-public-verifier-parity.md`
- Implementation:
  `apps/hosted-dashboard/lib/public-verify.ts`
  `apps/hosted-dashboard/lib/public-verify.test.ts`
  `apps/hosted-dashboard/app/verify/[session_id]/page.tsx`
  `apps/hosted-dashboard/scripts/browser-smoke.mjs`

## Requirement Traceability

- R1: Public route remains login-free.
  - Evidence: `page.tsx` has no wallet/provider gate; browser smoke visits the
    route directly.
- R2: TraceSession integrity still uses the SDK verifier.
  - Evidence: `loadPublicVerifySession()` calls `verifyTraceChain`.
- R3: Display call evidence reads all event pages.
  - Evidence: `fetchPublicVerifyCalls()` loops until `hasNextPage` is false;
    `public-verify.test.ts` covers a two-page event sequence.
- R4: Proven/Not proven panels are visible.
  - Evidence: route renders both panels; browser smoke asserts both labels.
- R5: Expected/on-chain and computed/re-derived roots are visible.
  - Evidence: route renders both root rows.
- R6: Per-call rows are visible when matching events are available.
  - Evidence: route renders `Call Evidence`; browser smoke asserts the section.
- R7: Incomplete display evidence is honest.
  - Evidence: helper exposes `callEvidenceMatchesVerifier`; tests cover mismatch.
- R8: Browser smoke covers public verifier.
  - Evidence: `browser-smoke.mjs` visits the known testnet session
    `0x6ceaab0fe2961043d490326960dfd192e43c25ed655772d42c04c265ad3ec080`
    unless overridden by `ONEMEM_HOSTED_VERIFY_SMOKE_SESSION`.

## Acceptance Criteria Coverage

- AC1: Paginated event reads covered by unit test.
- AC2: Root/id formatting covered by unit test.
- AC3: Hosted browser smoke reached the public verifier route and found the
  public badge, proof-boundary copy, Proven panel, Not proven panel, Call
  Evidence, and Suiscan link.
- AC4: Hosted lint, typecheck, build, browser smoke, and structure gates passed.

## Quality Gates

- `pnpm --filter @onemem/hosted-dashboard test` passed:
  5 files, 19 tests.
- `pnpm --filter @onemem/hosted-dashboard lint` passed.
- `pnpm --filter @onemem/hosted-dashboard typecheck` passed.
- `pnpm --filter @onemem/hosted-dashboard build` passed.
- `pnpm --filter @onemem/hosted-dashboard browser:smoke` passed:
  33 checks, including the real testnet public verifier route.
- `pnpm test:structure` passed:
  191 checks.
- `git diff --check` passed.

## Deviations From Plan

- The Codex Chrome plugin was not exposed as a callable tool in this session.
  Verification used the repo-owned Chrome/Chromium browser smoke harness.
- The route does not implement the prototype's animated chain-walk timing. The
  accepted scope was trust disclosure and complete evidence loading, not
  animation parity.

## Gaps And Risks

- Hosted share capability creation is superseded by
  `.thoughts/verification/2026-06-17-hosted-share-capability-creation.md`.
  Live wallet/sponsorship execution remains the proof boundary for that slice.
- The public verifier evidence list depends on global Sui event pagination. It
  is correct and tested, but may become slow as event volume grows; a future
  indexed API could improve latency without changing the trust boundary.

## Evidence Log

- Browser smoke requested:
  `/verify/0x6ceaab0fe2961043d490326960dfd192e43c25ed655772d42c04c265ad3ec080`
  and received HTTP 200.
- Browser smoke asserted no failed browser resources and no browser console
  errors.
