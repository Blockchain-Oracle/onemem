# Reality Research: Codex Hook Proof Boundary

## Scope

Current reality for OneMem's Codex plugin hook path after public marketplace
installation, local hook simulations, and live Sui testnet bootstrap proof. This
brief distinguishes what is proven from what remains unclaimed.

## Sources Checked

- `packages/plugin-codex/hooks/hooks.json`
- `packages/plugin-codex/scripts/inject.js`
- `packages/plugin-codex/scripts/observe.js`
- `packages/plugin-codex/scripts/summarize.js`
- `packages/plugin-codex/tests/plugin.test.ts`
- `packages/plugin-codex/README.md`
- `docs/03-target-runtimes/codex-cli-deep.md`
- `docs/05-our-architecture/03-runtimes/codex-cli-integration.md`
- Context7 docs for `/websites/developers_openai_codex`
- `codex features list` on Codex CLI 0.140
- `codex doctor` on Codex CLI 0.140
- Isolated `codex exec --dangerously-bypass-hook-trust` runs with plugin-local
  and user-level hooks.
- `node packages/cli-ts/dist/index.js verify
  0xcf956e819ba0fcfd772c0be1519adefe4e05bd10bb598d6586f01a702fe1c9b1`

## Verified Facts

- The public repository marketplace install path works:
  `codex plugin marketplace add Blockchain-Oracle/onemem --json` and
  `codex plugin add onemem-codex@onemem --json` installed
  `onemem-codex@onemem` version `0.1.0`.
- Context7/OpenAI Codex docs say plugin-bundled hooks default to
  `hooks/hooks.json`; matcher omitted, `*`, or empty string matches all.
- The local plugin creator validator still rejects a `hooks` field in
  `.codex-plugin/plugin.json`, so the package should keep relying on the
  default hook path for now.
- `packages/plugin-codex/hooks/hooks.json` now uses an empty `SessionStart`
  matcher.
- Local plugin tests simulate `SessionStart`, `PostToolUse`, and `Stop` payloads.
  `Stop` can flush buffered calls through an injected fake trace CLI and clear
  local state.
- A real Sui testnet bootstrap trace was minted and verified:
  session
  `0xcf956e819ba0fcfd772c0be1519adefe4e05bd10bb598d6586f01a702fe1c9b1`,
  namespace
  `0x81f95fccb193f9f60a57f3d3dfe54bc24ab72ba05fedf20b59c85ac13ec4311e`,
  and verification returned `VERIFIED`.
- `codex features list` on Codex CLI 0.140 reports `hooks` stable/enabled,
  `plugins` stable/enabled, and `plugin_hooks` removed.
- `codex doctor` on Codex CLI 0.140 reports the legacy alias
  `codex_hooks -> hooks`.
- Isolated `codex exec` tests on Codex CLI 0.140 ran shell tool calls but did
  not create hook side effects for either plugin-local hooks or user-level
  `hooks.json`, even with trusted projects and
  `--dangerously-bypass-hook-trust`.

## Inferences

- The empty `SessionStart` matcher is the correct package-side matcher because
  it does not exclude future Codex session sources.
- `codex exec` is not a valid live hook proof path for the observed Codex CLI
  0.140 environment.
- The honest claim is: MCP tools are installable and stable; hook scripts are
  packaged and locally simulated; real trace writes work through the trace CLI;
  full automatic Codex hook trace coverage still needs an interactive trusted
  `/hooks` proof or a newer Codex build where exec-mode hooks are proven.

## Unknowns And Questions

- Whether Codex CLI 0.141 changes `codex exec` hook behavior.
- Whether the plugin ingestion validator will later accept an explicit
  `"hooks": "./hooks/hooks.json"` manifest field.
- Whether interactive Codex TUI hook trust currently executes plugin hooks
  end-to-end into a real OneMem trace on this machine.

## Not Included

- No real trusted interactive `/hooks` Codex session was completed in this
  brief.
- No new registry publication is claimed here.
