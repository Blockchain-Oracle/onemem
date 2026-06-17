# Verification: CLI Credentials Fallback

Date: 2026-06-17

## Scope

Make `onemem login` credentials operational for local memory commands, runtime
helpers, MCP memory tools, and dashboard Settings status without exposing secret
credential fields.

## External Docs Checked

- Context7 resolved `Next.js` to `/vercel/next.js` and fetched App Router
  data-security guidance. The relevant current guidance is to sanitize data on
  the server and pass only the public fields needed by Client Components.
- Context7 resolved `Node.js` to `/nodejs/node` and fetched current `fs` docs.
  The relevant current API fact is that `fs.Stats.mode` is the file type/mode
  bit-field.
- Official web docs were also opened for the same facts:
  `https://nextjs.org/docs/app/guides/data-security` and
  `https://nodejs.org/api/fs.html#class-fsstats`.

## Implementation Summary

- Added `packages/sdk-ts/src/credentials.ts` as a Node-only runtime helper.
- Exported credential helpers from `@onemem/sdk-ts/runtime`.
- Updated SDK runtime memory config to read env plus
  `ONEMEM_CREDENTIALS_PATH` or `~/.onemem/credentials.json`.
- Updated TS CLI memory config to use the shared resolver while still requiring
  `MEMWAL_PACKAGE_ID` for CLI add/search.
- Updated MCP memory config to use the shared resolver.
- Added dashboard local credential summary rendering under `/settings` →
  `Delegate keys`.
- Added focused SDK, CLI, and dashboard tests for credential-file fallback,
  env-over-file override, unsafe file permissions, and sanitized UI metadata.

## Security Checks

- Credential reader rejects group/world-readable files with a `chmod 600`
  error.
- Dashboard summary never includes `delegateKey` or `embeddingApiKey`.
- Chrome proof used a disposable credential file containing fake private values;
  DOM verification confirmed both fake secret strings were absent.

## Chrome Plugin Proof

Started dashboard with:

```bash
PORT=4044 ONEMEM_CREDENTIALS_PATH=/tmp/onemem-dashboard-proof-creds.json pnpm --filter @onemem/dashboard start
```

Then used the Codex `@chrome` plugin to:

1. Open `http://localhost:4044/settings`.
2. Click the `Delegate keys` tab.
3. Confirm the panel displayed `configured` and
   `/tmp/onemem-dashboard-proof-creds.json`.
4. Confirm the page DOM did not contain either disposable secret field value.

Temporary Chrome tabs were finalized and the dashboard server was stopped.
Port `4044` had no remaining listener.

## Live CLI Smoke

The default `~/.onemem/credentials.json` was absent, but the repo `.env`
contained the required memory variable names. Loaded `.env` for the smoke
process only, without printing values, and confirmed the resolver was fully
configured.

Then ran the built CLI against testnet:

```bash
set -a; source .env; set +a
node packages/cli-ts/dist/index.js --network testnet --json add "credential fallback smoke 1781689037"
node packages/cli-ts/dist/index.js --network testnet --json search "credential fallback smoke"
```

Result:

- `add` succeeded with memory id
  `d4119bfa-15fe-4d5c-be2a-dbc082f675eb`.
- `add` returned Walrus blob
  `QHqrA9zvn6Y8nWSKQXy-SWAKlV8mXRjOzszJPXYvvzw`.
- `search` returned `credential fallback smoke 1781689037` as the top result
  with relevance `0.9318955361313241`.

## Gates

Passed:

```bash
pnpm exec biome check --write packages/sdk-ts/src/credentials.ts packages/sdk-ts/src/runtime.ts packages/sdk-ts/src/runtime-memory.ts packages/sdk-ts/tests/credentials.test.ts packages/sdk-ts/tests/runtime-memory.test.ts packages/cli-ts/src/util/memory-config.ts packages/cli-ts/tests/memory-config.test.ts packages/mcp-server/src/index.ts packages/dashboard/lib/local-credentials.ts packages/dashboard/lib/local-credentials.test.ts packages/dashboard/app/settings/page.tsx packages/dashboard/app/settings/SettingsView.tsx
pnpm --filter @onemem/sdk-ts typecheck
pnpm --filter @onemem/sdk-ts test
pnpm --filter @onemem/sdk-ts build
pnpm --filter @onemem/cli typecheck
pnpm --filter @onemem/cli test
pnpm --filter @onemem/cli build
pnpm --filter @onemem/mcp typecheck
pnpm --filter @onemem/mcp test
pnpm --filter @onemem/mcp build
pnpm --filter @onemem/dashboard typecheck
pnpm --filter @onemem/dashboard test
pnpm --filter @onemem/dashboard lint
pnpm --filter @onemem/dashboard build
set -a; source .env; set +a; node packages/cli-ts/dist/index.js --network testnet --json add "credential fallback smoke 1781689037"; node packages/cli-ts/dist/index.js --network testnet --json search "credential fallback smoke"
pnpm exec biome check --write tests/structure.test.ts packages/dashboard/lib/local-credentials.test.ts
pnpm test:structure
old-reference consistency search across `.thoughts`, AGENTS/CLAUDE docs, and
the Abu Context Engineering source/cache
```

Known warning:

- `pnpm --filter @onemem/sdk-ts build` reports the existing package-export
  warning that `"types"` comes after `"import"`/`"require"`.
- `pnpm --filter @onemem/dashboard build` reports the existing Next warning
  that `experimental.typedRoutes` moved to `typedRoutes`.
- The old-reference `rg` returned no matches.

## Result

Accepted for this slice. Local login credentials now have a real operational
path into CLI memory commands, runtime memory helpers, MCP memory tools, and
the dashboard credential-status view, with secret values kept off the rendered
page.
