# Verification Audit: Trusted Runtime Hook Proof

Date: 2026-06-19

## Verdict

Passed for trusted Codex and Claude Code lifecycle hook trace capture.

Both runtimes emitted fresh Sui testnet `TraceSession` objects from real
runtime hook sessions. This closes the previous honest blocker for automatic
hook coverage, with one important distribution boundary: the Codex proof used
the patched local repository marketplace snapshot because the public Git
marketplace copy still needs the v0.1.2 manifest/hook fixes committed and
pushed.

## Trust Model

- Codex: non-managed plugin hooks are reviewed interactively. Trust is stored in
  the user Codex config against hook command hashes, not as blanket repo-wide
  trust. Hook edits require review again. `codex exec` on CLI 0.140.0 did not
  run hooks in local proof attempts and is not the proof path.
- Claude Code: the local plugin install showed `SessionStart`, `PostToolUse`,
  and `Stop` hooks in `claude plugin details`. A live noninteractive Claude Code
  run with `--include-hook-events` showed those events executing. No separate
  `/hooks`-style trust prompt was observed for the local plugin install path.

## Codex Evidence

- Installed plugin: `onemem-codex@onemem` v0.1.2 from the local marketplace
  snapshot at this checkout.
- Trace env: `ONEMEM_NAMESPACE_ID`, `ONEMEM_RW_CAP_ID`, and `SUI_NETWORK=testnet`
  loaded from the local testnet config/shell.
- Runtime session triggered: `SessionStart`, one `PostToolUse` for `Bash`, and
  `Stop`.
- OneMem session:
  `0x0c88317632dcd386b6f81b94ee510003ba107d3c4bfa035ba8072fca8304e330`.
- Agent/environment: `codex` / `codex`.
- CLI verification returned:

```json
{
  "ok": true,
  "callCount": 1,
  "sessionCallCount": 1,
  "sessionStatus": 1,
  "brokenAt": null,
  "rootMatches": true,
  "countMatches": true,
  "expectedMerkleRoot": "0x3612794d813f3d9bfe920b3056a5827e95f755d6aa1b64c36268e2ca41af6336",
  "computedMerkleRoot": "0x3612794d813f3d9bfe920b3056a5827e95f755d6aa1b64c36268e2ca41af6336",
  "agentId": "codex"
}
```

Event transaction digests:

- `TraceSessionOpenedEvent`: `AeukMZDKTMYUQ9dQR4L1pC2iXr8dyAwfxLpC1nuf3ZK3`
- `ActionCallEmittedEvent`: `CCtFMCifev9Qa6c8qDr1zfTBVCVi9kqwXEBqBo4oEHMm`
- `ActionCallClosedEvent`: `8wvhn7GV3FQGdTS7W9z2ZfaUYFiGAePyNU1PAK3dgmuV`
- `TraceSessionClosedEvent`: `Fe3K4wNfzdxmvfCsuXHWWgVcbbspi6krw9e8c3zFNgBs`

Published MCP verification through `@onemem/mcp@0.6.3` returned `ok: true`,
`callCount: 1`, and matching computed root.

## Claude Code Evidence

- Installed plugin: `onemem@onemem` v0.1.1 from the local repository
  marketplace.
- `claude plugin details onemem@onemem` showed hooks:
  `SessionStart`, `PostToolUse`, and `Stop`.
- Runtime session used `--include-hook-events` and showed those events
  executing. The `Stop` hook flushed one call.
- OneMem session:
  `0x9c88993b6197a8460f4fbd4a886c6353505d36383bf35035e5305088b64825e7`.
- Agent/environment: `claude-code` / `claude-code`.
- CLI verification returned:

```json
{
  "ok": true,
  "callCount": 1,
  "sessionCallCount": 1,
  "sessionStatus": 1,
  "brokenAt": null,
  "rootMatches": true,
  "countMatches": true,
  "expectedMerkleRoot": "0x76d2395342c26caa69e24e31bcc0a5587159a343fcf772800c890da73c0b15ac",
  "computedMerkleRoot": "0x76d2395342c26caa69e24e31bcc0a5587159a343fcf772800c890da73c0b15ac",
  "agentId": "claude-code"
}
```

Event transaction digests:

- `TraceSessionOpenedEvent`: `57tyQayHd9gUxAqB5gZYr6TjtTZdSLwUAZj8nFaFXnNq`
- `ActionCallEmittedEvent`: `F6PyihtyRLLC5bNpUpqGyWpyhQKEk3PPUWMMiPirgpbx`
- `ActionCallClosedEvent`: `8ofSMJt1QighUTj9CrcQR5nSHS77RTv3TcVZQW2LrbEG`
- `TraceSessionClosedEvent`: `4a3Ufy1oLuK499FRGS1XbLasrekt6asE8Fjtok4TaHYn`

Published MCP verification through `@onemem/mcp@0.6.3` returned `ok: true`,
`callCount: 1`, and matching computed root.

## Package/Docs Fixes From The Proof

- Codex plugin manifest now explicitly declares `"hooks": "./hooks/hooks.json"`.
- Codex hook config removed the top-level `description` field rejected by Codex
  CLI 0.140.0.
- Claude Code plugin now flushes on `Stop`, not `SessionEnd`.
- Claude Code plugin v0.1.1 now bundles `.mcp.json`, matching the ClaudeMem
  one-install hooks-plus-MCP pattern.
- Published runtime line used for verification: `@onemem/sdk-ts@0.6.3`,
  `@onemem/mcp@0.6.3`, `@onemem/cli@0.6.3`,
  `@onemem/codex-plugin@0.1.2`, and
  `@onemem/claude-code-plugin@0.1.1`.
- `@onemem/claude-code-plugin@0.1.1` was published after adding bundled
  `.mcp.json`; npm shasum:
  `83d655d99412f6992fc2fdb1a4b981faf0be9af9`.

## Verification Commands

Passed:

```bash
pnpm --filter @onemem/claude-code-plugin test
pnpm --filter @onemem/codex-plugin test
pnpm --filter @onemem/claude-code-plugin lint
pnpm --filter @onemem/codex-plugin lint
pnpm test:structure
claude plugin validate packages/plugin-claude-code
npm exec --yes --package @onemem/cli@0.6.3 -- onemem --version
npm view @onemem/claude-code-plugin@0.1.1 version dependencies dist.shasum --json
pnpm registry:status --strict
pnpm release:preflight --strict --timeout 30
git diff --check
```

Notable results:

- Structure suite: 456/456 passed.
- `npm exec --yes --package @onemem/cli@0.6.3 -- onemem --version` printed
  `0.6.3`.
- `pnpm registry:status --strict` reports all npm and PyPI packages current.
- `pnpm release:preflight --strict --timeout 30` reports all packages current
  and all checked published artifacts contain required markers.

## Remaining Boundaries

- Public Git marketplace needs the patched Codex and Claude plugin files pushed
  so fresh installs get the same behavior without using the local checkout.
- Fresh hosted wallet-popup mutation proof still needs signed wallet approval
  and digest capture.
- Docs deployment automation/native Mintlify Git integration remains separate.
- CI-side trusted publishing/secret configuration remains separate.
