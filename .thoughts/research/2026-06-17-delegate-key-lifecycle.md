# Reality Research: Delegate Key Lifecycle

## Scope

Current state of delegate-key lifecycle, CLI pairing, and share/revoke UX across
the hosted dashboard, local dashboard, CLI, SDK credential resolver, and
prototype notes. This brief records facts only; implementation choices are in
the matching spec and plan.

## Sources Checked

- Prototype discovery:
  `.thoughts/prototype-discovery/2026-06-17-one-mem-2.md`
- Prototype files:
  `/Users/abu/Downloads/One Mem 2/Settings.html`,
  `/Users/abu/Downloads/One Mem 2/CliLogin.html`,
  `/Users/abu/Downloads/One Mem 2/Share.html`
- Hosted routes:
  `apps/hosted-dashboard/app/cli-login/page.tsx`,
  `apps/hosted-dashboard/app/login/page.tsx`,
  `apps/hosted-dashboard/app/onboarding/page.tsx`,
  `apps/hosted-dashboard/app/dashboard/page.tsx`
- Dashboard routes/libs:
  `packages/dashboard/app/settings/SettingsView.tsx`,
  `packages/dashboard/lib/local-credentials.ts`,
  `packages/dashboard/lib/local-credentials.test.ts`,
  `packages/dashboard/app/share/ShareView.tsx`,
  `packages/dashboard/lib/namespaces.ts`
- SDK/CLI:
  `packages/sdk-ts/src/credentials.ts`,
  `packages/sdk-ts/tests/credentials.test.ts`,
  `packages/cli-ts/src/commands/login.ts`,
  `packages/cli-ts/src/commands/init.ts`,
  `packages/cli-ts/src/commands/namespace.ts`,
  `packages/cli-ts/src/util/memory-config.ts`,
  `packages/cli-ts/tests/memory-config.test.ts`
- MCP:
  `packages/mcp-server/src/index.ts`

## Verified Facts

- The prototype requires delegate-key lifecycle UX: Settings shows multiple
  delegate keys with labels, public keys, created/expires dates, and active or
  revoked state; CLI Login has five steps including namespace selection,
  delegate-key label, and TTL.
- The implemented hosted `/cli-login` page is honest about missing hosted minting:
  it posts to `NEXT_PUBLIC_ONEMEM_MINT_URL` when configured and otherwise throws
  a clear error instead of minting fake credentials.
- The implemented hosted `/cli-login` page currently does not collect a delegate
  label or TTL before calling the mint endpoint.
- `onemem login` already implements the localhost callback contract, nonce
  validation, CORS scoping to dashboard origin, owner-only credential-file
  permissions, and one-time nonce removal before persistence.
- `packages/sdk-ts/src/credentials.ts` reads `expiresAt` as an unknown field but
  does not enforce expiration when resolving memory credentials.
- `packages/dashboard/lib/local-credentials.ts` surfaces `createdAt` and
  `expiresAt`, but it classifies credentials only as configured/partial/missing/error.
  It does not distinguish active, expiring soon, expired, or unknown lifecycle.
- `packages/dashboard/app/settings/SettingsView.tsx` has a Delegate keys tab,
  but it renders a single credential summary rather than lifecycle status.
- The local dashboard `/share` page correctly avoids fake hosted owner-driven
  revoke and points to CLI holder self-revoke.
- SDK and TS CLI already implement namespace share, capabilities list, and holder
  self-revoke. Owner-driven revocation of someone else's cap is not supported by
  the current Move contract.

## Inferences

- The highest-leverage v0.1 lifecycle improvement is to make file-backed
  delegate credentials expire in the shared SDK resolver and show the same
  lifecycle state in the dashboard. That helps every memory tool, not only the UI.
- Hosted CLI pairing can safely add label/TTL request fields because the actual
  mint still remains delegated to the configured signed-in mint endpoint.

## Unknowns And Questions

- The production hosted mint endpoint shape is not present in this repo. The UI
  can send requested label/TTL metadata, but the endpoint must decide what it
  honors and return the actual credential bundle.
- There is not yet a persistent hosted delegate-key list/API in the repo.

## Not Included

- Building the hosted mint endpoint.
- Owner-driven admin revoke of another user's cap.
- A fake delegate-key list backed by static data.
- Real Enoki/zkLogin integration testing.
