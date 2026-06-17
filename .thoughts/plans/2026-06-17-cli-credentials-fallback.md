# Plan: CLI Credentials Fallback

## Inputs

- Research: `.thoughts/research/2026-06-17-cli-credentials-fallback.md`
- Spec: `.thoughts/specs/2026-06-17-cli-credentials-fallback.md`
- Stories: `.thoughts/stories/2026-06-17-cli-credentials-fallback.md`
- Quality profile: `.thoughts/quality/2026-06-17-project-quality-profile.md`

## Assumptions

- `ONEMEM_CREDENTIALS_PATH` is acceptable as a test/operator override for the
  credentials file path.
- Env values should override credential-file values field by field.

## Open Questions

- The hosted mint payload is incomplete, so the helper should support likely
  field aliases instead of requiring one exact future shape.

## Phase 1: Shared Credential Resolver

### Goal

Add a Node-only SDK runtime helper for reading the local credential file and
deriving memory config from env plus file sources.

### Work

- Add `packages/sdk-ts/src/credentials.ts`.
- Export helper functions from `packages/sdk-ts/src/runtime.ts`.
- Update `packages/sdk-ts/src/runtime-memory.ts`.

### Checks

- `pnpm --filter @onemem/sdk-ts typecheck`
- `pnpm --filter @onemem/sdk-ts test`

### Acceptance Criteria Covered

- AC2.

### Stop Condition

- Runtime memory config resolves from a credential file in tests.

## Phase 2: CLI And MCP Use The Resolver

### Goal

Make CLI memory commands and MCP memory tools use the same credentials fallback.

### Work

- Update `packages/cli-ts/src/util/memory-config.ts`.
- Update `packages/mcp-server/src/index.ts`.
- Add CLI tests for fallback and permission failure.

### Checks

- `pnpm --filter @onemem/cli typecheck`
- `pnpm --filter @onemem/cli test`
- `pnpm --filter @onemem/mcp typecheck`
- `pnpm --filter @onemem/mcp test`

### Acceptance Criteria Covered

- AC1, AC3.

### Stop Condition

- Env-only and credential-file memory config both pass focused tests.

## Phase 3: Dashboard Settings Status

### Goal

Show sanitized credential-file status in local dashboard settings.

### Work

- Add a dashboard server helper for credential summary.
- Pass summary into `SettingsView`.
- Render status in the Delegate keys tab.

### Checks

- `pnpm --filter @onemem/dashboard typecheck`
- `pnpm --filter @onemem/dashboard lint`
- `pnpm --filter @onemem/dashboard build`
- Chrome plugin check of `/settings`.

### Acceptance Criteria Covered

- AC4.

### Stop Condition

- `/settings` renders credential status without secret fields.

## Verification Checkpoint

- Run focused package gates.
- Run `pnpm test:structure`.
- Write `.thoughts/verification/2026-06-17-cli-credentials-fallback.md`.

## Handoff Notes

Do not implement hosted key minting or remote revoke in this slice.
