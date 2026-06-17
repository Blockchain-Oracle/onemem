# Reality Research: CLI Credentials Fallback

## Scope

Current reality for `onemem login`, `~/.onemem/credentials.json`, and memory
configuration across the TS CLI, SDK runtime helpers, MCP server, and local
dashboard settings.

## Sources Checked

- `packages/cli-ts/src/commands/login.ts`
- `packages/cli-ts/src/util/memory-config.ts`
- `packages/mcp-server/src/index.ts`
- `packages/sdk-ts/src/runtime-memory.ts`
- `packages/dashboard/app/settings/page.tsx`
- `packages/dashboard/app/settings/SettingsView.tsx`
- `docs/05-our-architecture/05-cli/login-flow.md`
- `docs/05-our-architecture/06-dashboard/purpose-local-vs-hosted.md`
- `docs/05-our-architecture/06-dashboard/local-deploy.md`
- `packages/cli-ts/README.md`

## Verified Facts

- `onemem login` starts a loopback callback server, validates the callback
  nonce, drops the nonce, and writes the returned payload to
  `~/.onemem/credentials.json` with owner-only file permissions.
- The CLI `add` and `search` commands call `memoryConfigFromEnv()` from
  `packages/cli-ts/src/util/memory-config.ts`.
- That CLI helper currently reads only environment variables:
  `ONEMEM_DELEGATE_KEY`, `ONEMEM_ACCOUNT_ID`, `ONEMEM_EMBEDDING_API_KEY`,
  `MEMWAL_PACKAGE_ID`, and `MEMWAL_RELAYER_URL`.
- The SDK runtime memory helper also reads only environment variables and
  returns memory disabled when account/delegate/embedding values are missing.
- The MCP server independently reads only environment variables for memory
  enablement.
- Dashboard `/settings` receives signer/network/namespace values, but its
  Delegate keys tab only says delegate keys are CLI-managed and not yet shown.
- The architecture docs repeatedly state that local mode reads
  `~/.onemem/credentials.json`, and the CLI login-flow doc defines a credential
  object with `delegateKey`, `delegatePublicKey`, `accountId`, `suiAddress`,
  `activeNamespaceId`, `agentId`, timestamps, and version.
- The credential format in docs does not consistently include
  `embeddingApiKey`, `memwalPackageId`, or `relayerUrl`, but SDK memory
  configuration needs those values for MemWal `/manual`.

## Inferences

- A successful `onemem login` does not currently make `onemem add` or
  `onemem search` work unless the user also exports the memory env vars.
- Runtime memory helpers and MCP memory tools have the same gap when the only
  source of memory credentials is the login-created file.
- It is safe to display credential metadata in the dashboard only if delegate
  private key and embedding key values are never rendered.

## Unknowns And Questions

- The hosted mint endpoint's final payload shape is not fully implemented in
  this repo, so credential-file fallback should support both documented fields
  and likely MemWal config fields without requiring hosted changes.
- Remote delegate-key revocation remains undefined without a hosted signer or
  MemWal account management endpoint.

## Not Included

- No hosted Enoki/zkLogin mint implementation.
- No on-chain delegate-key add/remove implementation.
- No dashboard mutation UI for generating or revoking delegate keys.
