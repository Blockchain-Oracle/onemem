# Plan: Recipient Share Landing

## Inputs

- Research:
  `.thoughts/research/2026-06-17-recipient-share-landing.md`
- Spec:
  `.thoughts/specs/2026-06-17-recipient-share-landing.md`
- Stories:
  `.thoughts/stories/2026-06-17-recipient-share-landing.md`
- Prior hosted share slice:
  `.thoughts/verification/2026-06-17-hosted-share-capability-creation.md`
- Sui SDK docs refreshed with Context7 `/mystenlabs/ts-sdks`.

## Assumptions

- Testnet remains the default hosted network.
- Automated browser smoke should not depend on a live capability object.
- A read-only recipient landing route is valuable before implementing any
  future claim/transfer semantics.

## Phase 1: SDK Capability Reader

### Goal

Make capability metadata a reusable SDK read surface.

### Work

- Add parser helper for `NamespaceCapability<KIND>` object type, content fields,
  and Sui owner variants.
- Add `NamespacesAPI.getCapability(capId)`.
- Export helper/types through SDK barrel.
- Add unit tests for success, owner variants, nested ID fields, and missing
  field failures.

### Checks

- `pnpm --filter @onemem/sdk-ts test`
- `pnpm --filter @onemem/sdk-ts typecheck`

## Phase 2: Hosted Landing Route

### Goal

Create public `/share/[capability_id]` route with honest found and not-found
states.

### Work

- Add hosted loader for capability plus namespace summary.
- Add dynamic route page.
- Add small client account-comparison component.
- Keep the route read-only and explicit about no claim transaction.

### Checks

- `pnpm --filter @onemem/hosted-dashboard test`
- `pnpm --filter @onemem/hosted-dashboard typecheck`
- `pnpm --filter @onemem/hosted-dashboard build`

## Phase 3: Regression Coverage And Docs

### Goal

Make the new route durable for future agents.

### Work

- Extend hosted browser smoke with deterministic missing capability route.
- Extend structure tests for route and artifacts.
- Update current dashboard docs/status/wiki.
- Write verification audit.

### Checks

- `pnpm --filter @onemem/hosted-dashboard browser:smoke`
- `pnpm test:structure`
- `git diff --check`

## Verification Checkpoint

Write
`.thoughts/verification/2026-06-17-recipient-share-landing.md` before claiming
completion.

## Handoff Notes

This slice does not complete owner-driven revoke, event-backed share history,
or a future claim/transfer protocol. Codex-memory plugin work remains tracked in
its separate `.thoughts/*/2026-06-17-codex-memory-plugin.md` artifacts.
