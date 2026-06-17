# Spec: CLI Credentials Fallback

## Objective

Make the login-created `~/.onemem/credentials.json` operational for local CLI,
runtime, MCP, and dashboard status paths without exposing secrets or pretending
remote key mint/revoke exists.

## Background And Current Reality

`onemem login` persists credentials, but CLI memory commands, SDK runtime memory
helpers, and the MCP server currently read only environment variables. Local
dashboard docs say local mode reads the credentials file, but `/settings` does
not show whether the file is present or usable.

## Users

- CLI users who run `onemem login` and then expect `onemem add/search` to work.
- Runtime/plugin users relying on shared runtime memory helpers.
- Local dashboard users checking whether delegate credentials are configured.

## Goals

- Read `~/.onemem/credentials.json` as a fallback when memory env vars are not
  set.
- Keep environment variables as highest priority overrides.
- Refuse unsafe credential-file permissions.
- Surface sanitized credential status in dashboard settings.
- Keep missing credential errors explicit and actionable.

## Non-goals

- Do not implement hosted key minting.
- Do not implement remote delegate-key revocation.
- Do not show delegate private keys or embedding API keys in UI.
- Do not make credentials file mandatory for read-only trace verification.

## Requirements

- R1: Shared runtime code must read a local credentials file from
  `ONEMEM_CREDENTIALS_PATH` or `~/.onemem/credentials.json`.
- R2: Memory config resolution must prefer env values and use credential-file
  values only as fallback.
- R3: Missing memory configuration must identify the missing logical variables.
- R4: Runtime memory helpers and MCP memory tools must become enabled when the
  credentials file supplies account/delegate/embedding config.
- R5: Dashboard settings must show sanitized local credential status.
- R6: Credential readers must reject group/world-readable credential files.
- R7: Existing env-only workflows must keep working.

## Acceptance Criteria

- AC1: CLI memory config tests cover env-only, credential-file fallback,
  env-over-file override, unsafe permissions, and missing-file behavior.
- AC2: SDK runtime memory config tests cover credential-file fallback.
- AC3: MCP memory config uses the shared runtime resolver.
- AC4: `/settings` renders credential status without secrets.
- AC5: Focused SDK, CLI, MCP, and dashboard gates pass.

## Constraints

- Credential helpers are Node-only and should be exported from the SDK runtime
  entry point, not the browser-safe SDK root.
- No code path should log private credential values.
- Keep source files under the structure-test file-size cap.

## Stories Needed

- Story 1: CLI user logs in once and memory commands use the saved file.
- Story 2: Env vars override a saved credential file for automation.
- Story 3: Local dashboard user sees safe credential status.

## Open Questions

- Whether a later hosted implementation should write `embeddingApiKey` into the
  local credential file or keep it as a separate local env secret.

## Source References

- `.thoughts/research/2026-06-17-cli-credentials-fallback.md`
- `.thoughts/quality/2026-06-17-project-quality-profile.md`
- `docs/05-our-architecture/05-cli/login-flow.md`
- `docs/05-our-architecture/06-dashboard/purpose-local-vs-hosted.md`
