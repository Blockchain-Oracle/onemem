# Spec: Delegate Key Lifecycle

## Objective

Make delegate-key lifecycle handling real and consistent across the SDK resolver,
CLI/MCP memory tools, dashboard Settings, and hosted CLI pairing page without
faking hosted key minting or unsupported revoke behavior.

## Background And Current Reality

The prototype shows delegate keys as first-class account objects with labels,
TTL, expiry, and status. Current production code stores a single login-created
credential bundle and renders sanitized metadata in Settings, but it does not
enforce expiry or expose a lifecycle status. Hosted CLI pairing posts to a
configurable mint endpoint but does not send label/TTL intent.

## Users

- CLI user pairing a terminal with a scoped delegate key.
- Local dashboard user checking whether memory credentials are usable.
- Runtime/plugin user relying on shared SDK memory configuration.
- Operator wiring the future hosted key-mint endpoint.

## Goals

- Treat expired file-backed delegate credentials as unusable by default.
- Let env overrides deliberately replace expired file-backed secrets.
- Show lifecycle state in Settings: active, expiring soon, expired, unknown,
  missing, or error.
- Allow hosted CLI pairing to request a delegate label and TTL from the mint
  endpoint.
- Keep all secret values out of rendered dashboard UI and test output.

## Non-goals

- Do not build the hosted delegate-key mint endpoint.
- Do not create a fake hosted key list.
- Do not implement owner-driven revoke unsupported by the contract.
- Do not change Sui/Move capability semantics.

## Requirements

- R1: SDK credential resolution must detect expired `expiresAt` on file-backed
  credentials and avoid using those file credentials for memory config.
- R2: SDK credential resolution must still allow env-provided memory credentials
  to build a config even when the credentials file is expired.
- R3: CLI memory configuration errors must mention expired credentials when the
  credentials file is present but expired.
- R4: Dashboard credential summary must expose a lifecycle status and safe
  metadata such as label, TTL, created date, expiry date, and days remaining.
- R5: Dashboard Settings must render lifecycle state without exposing
  `delegateKey` or embedding secrets.
- R6: Hosted CLI pairing must collect or send delegate-key label/TTL request
  metadata to the configured mint endpoint and keep the missing-endpoint error
  honest.
- R7: Tests must cover expiry behavior and secret non-leakage.

## Acceptance Criteria

- A credentials file with past `expiresAt` does not produce memory config unless
  required env vars supply the secret/config values.
- `onemem add/search` memory config helper reports expired credentials in its
  error path.
- Settings displays an expired/expiring/active/unknown lifecycle state from the
  same summary helper used by tests.
- Hosted `/cli-login` sends JSON containing requested label and TTL seconds to
  `NEXT_PUBLIC_ONEMEM_MINT_URL`.
- Existing namespace share/revoke honesty remains unchanged.

## Constraints

- Preserve owner-only credential-file permission checks.
- Preserve env-over-file override behavior.
- Do not print or render `delegateKey` or `embeddingApiKey`.
- Browser verification should use the Chrome plugin when available; repo-owned
  browser smoke is acceptable as committed regression coverage.

## Stories Needed

- CLI user with expired credentials sees memory tools refuse stale file-backed
  credentials.
- Dashboard user sees whether a delegate key is active, expiring, expired, or
  unknown.
- Hosted pairing user can choose label and TTL before approving.

## Open Questions

- What exact hosted mint API schema should production commit to once Enoki
  backend exists?
- Should future hosted Settings show all keys from a server API instead of only
  the local credential bundle?

## Source References

- `.thoughts/research/2026-06-17-delegate-key-lifecycle.md`
- `.thoughts/prototype-discovery/2026-06-17-one-mem-2.md`
- `packages/sdk-ts/src/credentials.ts`
- `packages/dashboard/lib/local-credentials.ts`
- `apps/hosted-dashboard/app/cli-login/page.tsx`
