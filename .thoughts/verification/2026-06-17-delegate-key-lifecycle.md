# Delegate Key Lifecycle Verification

Date: 2026-06-17

## Scope

Implemented the accepted delegate-key lifecycle slice:

- Expired file-backed credentials no longer configure MemWal memory.
- Env-provided memory credentials still work when the local credentials file is
  expired.
- CLI memory errors now explain expired credentials and point back to
  `onemem login`.
- Dashboard `/settings` exposes sanitized lifecycle metadata: label, requested
  TTL, lifecycle state, expiry date, and days remaining.
- Hosted `/cli-login` now collects delegate label and TTL, sends them to the
  configured mint endpoint, and returns that metadata through the local CLI
  callback without faking minting.
- Dashboard `/settings` no longer resolves a signer merely to render the page,
  avoiding accidental local wallet creation during status inspection.

## Evidence

Commands run from `/Users/abu/dev/hackathon/sui-overflow/onemem`:

```bash
pnpm --filter @onemem/sdk-ts test
pnpm --filter @onemem/sdk-ts build
pnpm --filter @onemem/cli test
pnpm --filter @onemem/dashboard test
pnpm --filter @onemem/sdk-ts typecheck
pnpm --filter @onemem/cli typecheck
pnpm --filter @onemem/dashboard typecheck
pnpm --filter @onemem/hosted-dashboard typecheck
pnpm --filter @onemem/dashboard build
pnpm --filter @onemem/hosted-dashboard build
pnpm --filter @onemem/dashboard browser:smoke
pnpm exec biome check packages/sdk-ts/src/credentials.ts packages/sdk-ts/src/runtime.ts packages/sdk-ts/tests/credentials.test.ts packages/cli-ts/src/util/memory-config.ts packages/cli-ts/tests/memory-config.test.ts packages/dashboard/lib/local-credentials.ts packages/dashboard/lib/local-credentials.test.ts packages/dashboard/app/settings/SettingsView.tsx packages/dashboard/app/settings/page.tsx packages/dashboard/scripts/browser-smoke.mjs apps/hosted-dashboard/app/cli-login/page.tsx
pnpm lint
pnpm test:structure
```

Result:

- `@onemem/sdk-ts` tests: 65 passed, 5 skipped.
- `@onemem/cli` tests: 36 passed.
- `@onemem/dashboard` tests: 19 passed.
- SDK, CLI, dashboard, and hosted-dashboard typechecks passed.
- Dashboard and hosted-dashboard production builds passed.
- Dashboard browser smoke passed 17 checks using local Chrome/Chromium,
  including `/sessions` replay/export and `/settings` delegate lifecycle,
  active lifecycle display, TTL display, and secret non-leakage.
- Targeted Biome check passed for all touched files.
- Full `pnpm lint` exited 0 with existing repo warnings.
- `pnpm test:structure` passed 169 checks.

## Notes

The first CLI/dashboard test run failed against stale SDK `dist` output because
those packages import `@onemem/sdk-ts/runtime` through package exports. Rebuilding
`@onemem/sdk-ts` produced fresh runtime output and the downstream tests then
passed.

One intermediate dashboard build failed because it ran concurrently with the
browser smoke dev server against the same `.next` directory. Running the smoke
and production build serially resolved the conflict.

No live Sui mutation was required for this slice. Hosted delegate minting is
still delegated to `NEXT_PUBLIC_ONEMEM_MINT_URL`; the UI now sends better request
metadata, but it does not fabricate credentials when that endpoint is absent.

## Remaining Risk

- Hosted login/onboarding still need a real Enoki/dApp Kit session flow before
  hosted share/revoke mutations can be implemented honestly.
- The Codex Chrome connector was not exposed through `tool_search` in this
  session, so the visual regression evidence used the repo-owned local
  Chrome/Chromium smoke harness rather than the Chrome plugin.
