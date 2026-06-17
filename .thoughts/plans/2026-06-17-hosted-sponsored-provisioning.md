# Plan: Hosted Sponsored Provisioning

## Inputs

- Research:
  `.thoughts/research/2026-06-17-hosted-sponsored-provisioning.md`
- Spec:
  `.thoughts/specs/2026-06-17-hosted-sponsored-provisioning.md`
- Stories:
  `.thoughts/stories/2026-06-17-hosted-sponsored-provisioning.md`
- Quality profile:
  `.thoughts/quality/2026-06-17-project-quality-profile.md`
- Current hosted app and SDK code.

## Assumptions

- The first implementation target is testnet because the current OneMem
  deployment manifest only contains testnet addresses.
- `ENOKI_PRIVATE_KEY` remains the existing server env name; support
  `ENOKI_SECRET_KEY` as an alias without displaying either value.
- Automated browser smoke verifies UI and missing-config behavior. Live
  sponsorship can be tested only when a private Enoki key and a signer are
  present.

## Open Questions

- Persistent hosted storage/session for provisioned IDs remains a follow-up.
- Delegate credential minting remains a follow-up after namespace/RW cap
  provisioning.

## Phase 1: Server-Side Sponsorship Helpers

### Goal

Create a narrow server module that builds, sponsors, executes, and parses only
the two onboarding transaction actions.

### Work

- Add `apps/hosted-dashboard/lib/sponsored-provisioning.ts`.
- Validate network, sender, labels, namespace IDs, Admin cap IDs, digests, and
  signatures.
- Build `namespace::create` transaction kind bytes.
- Build `namespace::mint_capability_readwrite` transaction kind bytes.
- Use `EnokiClient.createSponsoredTransaction` and
  `executeSponsoredTransaction`.
- Query/wait transaction effects and parse created object IDs.

### Checks

- `pnpm --filter @onemem/hosted-dashboard typecheck`
- Focused route/helper smoke through the hosted browser-smoke script.

### Acceptance Criteria Covered

R1, R3, R4, R5, R6, AC1, AC2, AC4, AC5.

### Stop Condition

Helpers return structured success/error data and never accept arbitrary client
transaction bytes.

## Phase 2: API Routes

### Goal

Expose the helper through hosted onboarding endpoints.

### Work

- Add `POST /api/onboarding/sponsored/prepare`.
- Add `POST /api/onboarding/sponsored/execute`.
- Return structured JSON for success, validation errors, missing config, and
  transaction execution failures.
- Keep route runtime on Node.js and dynamic.

### Checks

- API smoke for no-private-key behavior.
- Hosted typecheck/build.

### Acceptance Criteria Covered

R2, R3, R4, R5, R6, R9, AC1, AC2, AC4, AC5.

### Stop Condition

No-config route calls return explicit JSON and live-config route code compiles.

## Phase 3: Onboarding UI

### Goal

Let a connected hosted user run the real two-step sponsored provisioning flow.

### Work

- Add a client provisioning component.
- Use `useSignTransaction` for sponsored bytes.
- Run namespace create first, then RW-cap mint.
- Display real resulting object IDs and digests only after execution.
- Preserve account-gated and missing-config states.

### Checks

- Hosted browser smoke verifies account gate, provisioning controls, and
  missing-config copy without requiring a wallet popup.

### Acceptance Criteria Covered

R7, R8, R9, AC3, AC4, AC5.

### Stop Condition

Onboarding no longer merely says "pending"; it offers a real provisioning path
when connected, while still being honest when deployment config is missing.

## Phase 4: Context And Verification

### Goal

Register the slice and prove it.

### Work

- Update `tests/structure.test.ts` for new files/artifacts.
- Update wiki/status/project map.
- Write verification audit.

### Checks

- `pnpm --filter @onemem/hosted-dashboard lint`
- `pnpm --filter @onemem/hosted-dashboard typecheck`
- `pnpm --filter @onemem/hosted-dashboard build`
- `pnpm --filter @onemem/hosted-dashboard browser:smoke`
- `pnpm test:structure`
- `pnpm lint`
- `git diff --check`

### Acceptance Criteria Covered

R10, AC6.

### Stop Condition

Verification audit maps requirements and stories to code and commands.

## Verification Checkpoint

Write `.thoughts/verification/2026-06-17-hosted-sponsored-provisioning.md`
before claiming completion.

## Handoff Notes

After this slice, the next hosted work should persist provisioned IDs into the
CLI-login/delegate credential path or implement hosted share-readonly flows.
Owner-driven revoke remains blocked by contract semantics.
