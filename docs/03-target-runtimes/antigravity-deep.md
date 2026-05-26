# Antigravity CLI — Deep Runtime Reference

**What it is.** Google's terminal coding agent (binary: `agy`), released May 19 2026 as the successor to Gemini CLI. Built in Go (not Node), part of the broader "Antigravity" platform that also includes the Antigravity 2.0 desktop app. Gemini CLI stops serving consumer-tier requests on June 18 2026; Standard/Enterprise contracts continue. Keeps the Gemini-CLI feature shape — *"Agent Skills, Hooks, Subagents, and Extensions (now as Antigravity plugins)"* per the [Google Developers Blog](https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli/) — but moves MCP config out of `settings.json` into a dedicated `mcp_config.json`, renames the remote-server field from `url` → `serverUrl`, and remaps skill directories.

**Docs caveat.** The official docs surface ([antigravity.google/docs](https://antigravity.google/docs)) is currently a single-page placeholder. The substantive technical references at the time of this writing are: the Google Developers blog transition post, [antigravity.google/docs/gcli-migration](https://antigravity.google/docs/gcli-migration) (referenced in the announcement, not fully populated), the [Antigravity 2.0 product page](https://antigravity.google/docs/cli-features), community articles ([agentpedia.codes deep dive](https://agentpedia.codes/blog/antigravity-cli-deep-dive), [agentpedia.codes migration guide](https://agentpedia.codes/blog/gemini-cli-to-antigravity-cli-migration), [medium.com/@dazbo on MCP+skills](https://medium.com/google-cloud/configuring-mcp-servers-and-skills-for-antigravity-cli-and-ide-a938c7eebb78)), and the official [Google AI Developers Forum](https://discuss.ai.google.dev/t/hooks-in-antigravity/120458). Treat the hook payload schema as **inherited unchanged from Gemini CLI** per the migration guide: *"JSON hooks fire on the same lifecycle moments... existing hooks continue working without modification."*

---

## Hook contract — lifecycle events

From the [Gemini CLI hooks reference](https://github.com/google-gemini/gemini-cli) carried into Antigravity unchanged, plus the SDK's nine "hook points" referenced in the [Antigravity SDK announcement](https://antigravity.google/blog/introducing-google-antigravity-sdk):

| Event | When it fires | Notes |
|---|---|---|
| `SessionStart` | Session begins or resumes | Inject preamble context |
| `SessionEnd` | Session terminates | Final cleanup / archival |
| `BeforeAgent` | Before agent processes a turn | Pre-turn gating |
| `AfterAgent` | After agent finishes a turn | Post-turn capture; the common audit hook |
| `BeforeModel` | Before model call dispatched | Used for model-routing (e.g. [oh-my-antigravity](https://github.com/Joonghyun-Lee-Frieren/oh-my-antigravity)'s `oma-model-router`) |
| `AfterModel` | After model returns | Response shaping |
| `BeforeToolSelection` | Before agent picks a tool | Tool-routing override |
| `BeforeTool` (aka `PreToolUse`) | Before tool executes | Approve/deny/modify tool inputs |
| `AfterTool` (aka `PostToolUse`) | After tool completes | Outputs visible; the capture point |
| `PreCompress` (aka `PreCompact`) | Before context compaction | Inject critical-info preservation |
| `Notification` | UI/system notifications | Optional sink |

Per the SDK's [hook categorization](https://www.datacamp.com/tutorial/antigravity-cli), each event accepts hooks of one of three kinds:
- **Inspect** — read-only, non-blocking; for logging / metrics / audit trails.
- **Decide** — read-only, blocking; approve/deny actions (policies).
- **Transform** — modifying, blocking; reshape data in transit (redaction, sanitization, error recovery).

### Payload + return shape

Hook scripts read JSON from stdin, write JSON to stdout. Standard envelope (carried from Gemini CLI):

```json
{
  "session_id": "string",
  "hook_event_name": "BeforeTool",
  "cwd": "string",
  "model": "string",
  "tool_name": "...",
  "tool_input": { ... }
}
```

Return shape:

```json
{
  "continue": true,
  "decision": "allow|deny",
  "updatedInput": { ... },
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "string to inject into preamble"
  }
}
```

**Exit codes:** `0` = success, **`2` = block** (writes stderr as block reason — same convention as Claude Code / Codex). Anything else = error, logged and skipped.

The `hookSpecificOutput.additionalContext` field is the same shape as Claude Code's `SessionStart` injection — paste-portable.

---

## `hooks.json` configuration

Hooks are registered either at the user level (in the global config tree) or inside a plugin. The plugin-local wrapping convention from the [community schema notes](https://github.com/anthropics/claude-code/issues/22031) (which the Antigravity team mirrors):

```json
{
  "hooks": {
    "SessionStart": [
      { "hooks": [
          { "type": "command",
            "command": "node ${PLUGIN_ROOT}/hooks/session-start.mjs",
            "timeout": 5 }
        ] }
    ],
    "AfterTool": [
      { "matcher": "^shell$",
        "hooks": [
          { "type": "command", "command": "python3 ${PLUGIN_ROOT}/hooks/capture.py" }
        ] }
    ]
  }
}
```

Settings-level hooks (top-level in `settings.json`) omit the `description` field but otherwise share schema. Real-world hook registrations seen in [oh-my-antigravity](https://github.com/Joonghyun-Lee-Frieren/oh-my-antigravity):

- `BeforeModel` → `oma-model-router` (silently maps outgoing model requests to active strategy)
- `AfterAgent` → `oma-learn-signal-after-agent` (safety-filtered learn-signal capture)

Disable a registered hook by name (user override):

```json
{ "hooksConfig": { "disabled": ["oma-learn-signal-after-agent"] } }
```

---

## MCP server registration — `mcp_config.json`

**Config moved out of `settings.json`** in the Gemini→Antigravity transition. Two locations:

- Global: `~/.gemini/antigravity-cli/mcp_config.json` (also referenced as `~/.gemini/config/mcp_config.json` in some docs)
- Workspace: `.agents/mcp_config.json`

Schema (per [medium.com/@dazbo](https://medium.com/google-cloud/configuring-mcp-servers-and-skills-for-antigravity-cli-and-ide-a938c7eebb78)):

```json
{
  "mcpServers": {
    "server-name": {
      "command": "command-name",
      "args": ["arg1", "arg2"],
      "env": { "ENV_VAR": "value" },
      "disabled": false
    }
  }
}
```

Local subprocess:

```json
{ "avtool": { "command": "mcp-avtool-go", "env": { "PROJECT_ID": "my-project" } } }
```

Remote — **`serverUrl`, not `url`** (silent failure if you migrate Gemini configs verbatim):

```json
{
  "FirestoreMCP": {
    "serverUrl": "https://firestore.googleapis.com/mcp",
    "authProviderType": "google_credentials"
  }
}
```

Migration field changes ([agentpedia.codes migration guide](https://agentpedia.codes/blog/gemini-cli-to-antigravity-cli-migration)):
- `"url"` → `"serverUrl"` (remote MCP)
- `"httpUrl"` → removed (deprecated)
- Top-level `"timeout"` → removed
- Inline JSON comments → no longer supported

Auth options for remote: `authProviderType: "google_credentials"`, or static `oauth` block, or `headers` map.

In-TUI commands: `/mcp` lists/manages active MCP servers.

---

## Skills (the new "commands")

The legacy Gemini `commands` concept is gone — *"collapsed into the broader `skills` primitive (the import does the conversion)"* per the migration guide. Skills are Markdown files with frontmatter:

```markdown
---
name: greet
description: Greet the user.
---
Greet the user warmly and ask how you can help.
```

Locations:
- Workspace skills: `.agents/skills/<skill-name>/SKILL.md`
- Global skills (all Antigravity tools): `~/.gemini/skills/<skill-name>/SKILL.md` (recommended)
- CLI-only skills: `~/.gemini/antigravity-cli/skills/<skill-name>/SKILL.md`

In-TUI: `/skills` lists available skills. No `/commands` equivalent — fully replaced.

---

## Plugin manifest (replaces Gemini CLI "Extensions")

Antigravity plugins are the direct rebrand of Gemini CLI Extensions. The manifest file `gemini-extension.json` carries through to Antigravity. One-shot import:

```bash
agy plugin import gemini   # converts every Gemini extension to an Antigravity plugin
```

Output of the import (verbatim from migration guide):

```
[ok]    google-workspace
        ✔ skills      : 6 processed
        ✔ commands    : 4 processed (converted to skills)
        ✔ mcpServers  : 1 processed
```

Plugin directory layout (from [oh-my-antigravity](https://github.com/Joonghyun-Lee-Frieren/oh-my-antigravity)):

```
my-plugin/
├── gemini-extension.json    # manifest
├── GEMINI.md                # plugin-level context
├── skills/                  # Markdown skill bodies
├── commands/                # legacy; auto-converts on import
├── agents/                  # subagent definitions
├── hooks/
│   ├── hooks.json
│   └── scripts/*.js         # hook scripts
└── context/
```

**No public schema for `gemini-extension.json` has been published yet** beyond field names visible in the import output (`skills`, `commands`, `mcpServers`). Treat as a moving target until [antigravity.google/docs/gcli-migration](https://antigravity.google/docs/gcli-migration) ships its plugin reference.

Install third-party plugins:

```bash
agy plugin install https://github.com/<owner>/<repo>
```

---

## CLI commands (verified)

```bash
agy                          # launch TUI
agy -p "prompt"              # single-prompt mode
agy --version
agy inspect                  # show active project context, skills, plugins, hooks, MCP servers
agy plugin import gemini     # one-shot migrate Gemini CLI extensions
agy plugin install <git-url> # install plugin from Git
```

In-TUI slash commands ([antigravitylab.net](https://antigravitylab.net/en/articles/antigravity/antigravity-cli-agy-setup-and-slash-commands-getting-started)):

- Flow: `/resume`, `/rewind`, `/rename`, `/fork`, `/clear`, `/fast`
- Config: `/permissions`, `/model`, `/keybindings`, `/statusline`, `/logout`
- Tools: `/tasks`, `/skills`, `/mcp`, `/usage`, `/artifacts`, `/task`, `/btw`
- Goal: `/goal` (autonomous), `/grill-me` (clarifying questions first), `/schedule`, `/browser`

---

## Settings + config file locations

| Path | Purpose |
|---|---|
| `~/.config/antigravity/config.toml` | Top-level config (model, base_url, name, env_key) |
| `~/.gemini/antigravity-cli/settings.json` | User settings (colorScheme, editor, model, permissions) |
| `~/.gemini/antigravity-cli/mcp_config.json` | Global MCP servers |
| `~/.gemini/antigravity-cli/skills/` | CLI-only skills |
| `~/.gemini/skills/` | Shared skills (CLI + IDE) |
| `.agents/mcp_config.json` | Workspace MCP servers |
| `.agents/skills/` | Workspace skills |
| `.agents/workflows/` | Workflow definitions (multi-step automation, e.g. "run tests after every refactor") |
| `.agents/rules/` | Behavioral rules — replaces traditional hooks for many use cases |
| `AGENTS.md` / `GEMINI.md` | Workspace context, prepended to every prompt |

Binary location: `~/.local/bin/agy` (Unix), `%LOCALAPPDATA%\Antigravity\` (Windows).

Install:

```bash
curl -fsSL https://antigravity.google/cli/install.sh | bash     # macOS/Linux
irm https://antigravity.google/cli/install.ps1 | iex             # Windows
```

---

## Permission / trust model

Adjusted in-TUI via `/permissions`. Workflows + rules under `.agents/workflows/` and `.agents/rules/` provide a hooks-adjacent gating layer that some users prefer over scripted hooks for safety policies — the [Google AI Forum thread](https://discuss.ai.google.dev/t/hooks-in-antigravity/120458) describes these as the **first-class control surface** with hooks treated as escape-hatch.

No documented hook hash / trust ledger (unlike Codex). Plugin install is the trust boundary — once installed, the plugin's hooks run.

---

## Breaking changes vs Gemini CLI

From the [agentpedia.codes migration guide](https://agentpedia.codes/blog/gemini-cli-to-antigravity-cli-migration):

- Binary `gemini` → `agy`
- Runtime: Node → Go
- Workspace skills: `.gemini/skills/` → `.agents/skills/`
- Global skills: `~/.gemini/skills/` → `~/.gemini/antigravity-cli/skills/`
- MCP config moved from inline `settings.json` → standalone `mcp_config.json`
- Remote MCP field `url` → `serverUrl` (silent failure if not renamed)
- `httpUrl` and top-level `timeout` removed
- Inline JSON comments no longer parsed
- Custom themes not yet supported
- Legacy `commands` deprecated → converted to `skills` on import
- Service cutoff for Gemini CLI consumer tier: **June 18, 2026**

Hook events **unchanged** from Gemini CLI per the migration guide.

---

## Known issues / anti-patterns

- **`BeforeTool` hooks broken on some builds** — [forum thread](https://discuss.ai.google.dev/t/getting-beforetool-hook-working/145574) reports hook registration silently failing in Antigravity 2.0; restart doesn't fix. Verify on the user's installed version.
- **Env vars not propagating to API keys** — known issue: secrets stored in `env` blocks in `mcp_config.json` don't always reach the subprocess, forcing temporary hard-coding ([medium.com/@dazbo](https://medium.com/google-cloud/configuring-mcp-servers-and-skills-for-antigravity-cli-and-ide-a938c7eebb78)). Use absolute paths and external secret managers if possible.
- **Silent MCP fail on `url` field** — if you copy a Gemini CLI MCP config across without renaming `url` → `serverUrl`, the server appears to load but is never reachable.
- **No `--output-format json` flag on Windows builds yet** — per [dev.to/arindam_1729](https://dev.to/arindam_1729/antigravity-cli-a-hands-on-guide-to-googles-terminal-coding-agent-5bc7) commenters.
- **Plugin manifest schema not officially published** — `gemini-extension.json` is the de facto manifest but the spec isn't versioned/documented yet. Track [antigravity.google/docs/gcli-migration](https://antigravity.google/docs/gcli-migration).
- **Mixing extension-managed and manually-registered hooks duplicates events** — `AfterAgent` output may fire twice. Keep one authoritative registration path per event.
- **Workflows + rules are favored over hooks** for control-plane use cases by the Google team — hooks docs are intentionally thin. Expect the `.agents/workflows/` and `.agents/rules/` API to evolve faster than `hooks.json`.
- **Antigravity SDK is the forward path** — the [Antigravity SDK announcement](https://antigravity.google/blog/introducing-google-antigravity-sdk) hints at a Go SDK with nine "hook points" (Inspect / Decide / Transform categorization). Long-term, plugin authors will target the SDK rather than `hooks.json`. Don't over-invest in the JSON hook surface.

---

## OneMem implementation notes

**Verdict: defer to v0.2.** The plugin manifest schema isn't stable, hook registration is buggy on current builds, and the SDK that *will* be canonical is still in announcement-only state. Build against MCP today, full native plugin once the SDK ships.

**v0.1 path (1 day, MCP only).** Drop into `~/.gemini/antigravity-cli/mcp_config.json`:

```json
{
  "mcpServers": {
    "onemem": {
      "command": "npx",
      "args": ["-y", "@onemem/mcp"],
      "env": { "ONEMEM_NAMESPACE": "default" }
    }
  }
}
```

Capture happens inside MCP tool handlers (same pattern as Cursor) — no hook reliance. Workspace install variant: `.agents/mcp_config.json`.

**v0.2 path (3 days, native plugin).** Ship `gemini-extension.json` + `hooks/hooks.json` registering:

- `SessionStart` → `node hooks/session-start.mjs` → recall last summary, emit as `hookSpecificOutput.additionalContext`
- `AfterTool` (matcher `^shell$|^edit$`) → `node hooks/capture.mjs` → emit `ActionCall` + Walrus blob
- `AfterAgent` → end-of-turn rollup
- `SessionEnd` → final attestation
- `PreCompress` → inject critical-info preservation (the namespace pointer the next session needs)

Hook script shape (paste-ready, Node, exit-2 = block):

```js
#!/usr/bin/env node
import { readFileSync } from "node:fs";
const p = JSON.parse(readFileSync(0, "utf8"));
// p.session_id, p.tool_name, p.tool_input, p.tool_output, p.hook_event_name
// emit ActionCall via MemWal SDK ...
process.stdout.write(JSON.stringify({
  continue: true,
  hookSpecificOutput: { hookEventName: p.hook_event_name }
}));
```

Install one-liner (v0.2):

```bash
agy plugin install https://github.com/onemem/antigravity-plugin
```

**Risk to flag in the wedge:** Antigravity is the *one* runtime where OneMem can't promise full trace coverage today — the SDK is announcement-stage and hooks are buggy. Ship v0.1 (MCP) and explicitly document the v0.2 native-plugin upgrade path once the SDK lands.
