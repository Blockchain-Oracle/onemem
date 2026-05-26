# CLI Command Surface — `onemem`

**Load-bearing file.** Every command, flag, exit code. Both TS (Node) and Python implementations expose THIS EXACT surface.

---

## Top-level structure

```
onemem <command> [subcommand] [args] [flags]
```

Global flags (work on every command):

| Flag | Description |
|---|---|
| `--json` | Output JSON instead of human-readable text |
| `--verbose, -v` | Verbose logging |
| `--quiet, -q` | Suppress non-essential output |
| `--config <path>` | Override credentials file (default `~/.onemem/credentials.json`) |
| `--namespace <id>` | Override default namespace for this command |
| `--server <url>` | Override relayer URL |
| `--network <name>` | Sui network (default `mainnet`) |
| `--help, -h` | Show help |
| `--version` | Show CLI version |

---

## Commands

### `onemem login`

Browser-based wallet login. Writes `~/.onemem/credentials.json`.

```
onemem login [--account-id <id>]
```

Detail: `login-flow.md`.

Exit: 0 success, 1 cancelled by user, 2 wallet error.

---

### `onemem logout`

Clears `~/.onemem/credentials.json`.

Exit: 0 always.

---

### `onemem init`

Bootstrap a new MemWalAccount + first namespace. Run after `login`.

```
onemem init [--name <namespace-name>] [--kind <USER|AGENT|ORG|SESSION>]
```

If `--name` omitted: prompts interactively.
If `--kind` omitted: defaults to `USER`.

Output (human):
```
✓ Created MemWalAccount on Sui: 0xabc...
✓ Created namespace "personal" on Sui: 0xdef...
✓ Minted Admin capability: 0xfff...

Set these in your shell:
  export ONEMEM_DELEGATE_KEY=<from credentials>
  export ONEMEM_ACCOUNT_ID=0xabc...
  export ONEMEM_NAMESPACE_ID=0xdef...
```

Output (`--json`):
```json
{"accountId": "0xabc...", "namespaceId": "0xdef...", "adminCapId": "0xfff...", "suiTxDigest": "..."}
```

Exit: 0 success.

---

### `onemem dashboard`

Launches the local OneMem dashboard at `http://localhost:4040`.

```
onemem dashboard [--port <n>] [--no-open]
```

Default port 4040. `--no-open` skips auto-opening browser. Process runs until Ctrl-C.

Exit: 0 (on Ctrl-C), 1 (port in use, etc).

---

### `onemem search`

Vector + entity search.

```
onemem search <query> [--top-k <n>] [--threshold <0..1>] [--namespace <id>]
```

Output (human, table):
```
ID                       Class        Tier  Text                                  Verified
─────────────────────── ──────────── ────  ──────────────────────────────────── ────────
0x123abc...              episodic     L0    User prefers dark mode               ✓
0x456def...              semantic     L1    Project uses pnpm + Vite             ✓
```

Output (`--json`):
```json
{"results": [{"id": "0x123...", "text": "...", "memoryClass": "episodic", ...}]}
```

Exit: 0 success, 0 empty results (just empty table).

---

### `onemem add`

Add a memory.

```
onemem add <text> [--class <semantic|episodic|procedural>] [--tier <L0|L1|L2>] [--metadata <json>]
```

Output: `{ memoryId, walrusBlobId, suiTxDigest }`

Exit: 0 success.

---

### `onemem get <memory-id>`

Fetch a single memory by ID.

---

### `onemem update <memory-id> <new-text>`

Update memory; emits new version.

---

### `onemem delete <memory-id>`

Soft delete.

---

### `onemem list`

List memories (paginated). Subset of `search` but without query.

```
onemem list [--limit <n>] [--page <n>] [--namespace <id>] [--filter <key=value,...>]
```

---

### `onemem history <memory-id>`

Show all versions of a memory (OneMem-unique — every version is on-chain).

---

### `onemem export`

Tamper-evident export (Walrus IDs + Sui txids + Seal policy proofs included).

```
onemem export [--out <file>] [--format <json|sarif>] [--namespace <id>] [--since <iso-date>]
```

---

### `onemem namespace ...`

Namespace operations.

```
onemem namespace create <name> [--kind <USER|AGENT|ORG|SESSION|SHARED>]
onemem namespace list
onemem namespace get <namespace-id>
onemem namespace share <namespace-id> <recipient-address> [--cap <ReadOnly|ReadWrite|Admin>]
onemem namespace revoke <namespace-id> <capability-id>
onemem namespace deactivate <namespace-id>
onemem namespace reactivate <namespace-id>
onemem namespace caps <namespace-id>      # list all capabilities
```

---

### `onemem trace ...`

Trace session operations.

```
onemem trace list [--namespace <id>] [--agent <id>] [--limit <n>]
onemem trace get <session-id>
onemem trace tree <session-id>            # render ASCII tree
onemem trace events <session-id>          # tail trace events (SSE; Ctrl-C to stop)
onemem trace end <session-id> [--status <COMPLETED|FAILED|ABORTED>]
```

---

### `onemem verify <session-id>`

Walk the Merkle chain end-to-end.

Output (human):
```
Verifying session 0x123...
  ✓ ActionCall 1/47 (Read /path/to/file)
  ✓ ActionCall 2/47 (Bash echo $FOO)
  ...
  ✓ ActionCall 47/47 (memwal_write)
  ✓ Session merkle_root: 0xabc... (matches on-chain)

VERIFIED ✓
```

Output (failure):
```
Verifying session 0x123...
  ✓ ActionCall 1/47
  ...
  ✗ ActionCall 12/47: content_hash mismatch
    expected: 0xabc...
    actual:   0xdef...
    
BROKEN at call 0xcall12 (status: chain integrity failed)
```

Output (`--json`):
```json
{"verified": true, "chainLength": 47, "merkleRoot": "0xabc..."}
```

Exit: 0 verified, 1 broken, 2 not found.

---

### `onemem replay <session-id>`

Reconstruct the full session from chain + Walrus + Seal.

```
onemem replay <session-id> [--out <file>] [--format <json|text>]
```

Human output: chronological list of decrypted call inputs/outputs.

JSON output: full ReplayedSession object per `02-sdks/shared-api-surface.md`.

---

### `onemem stats`

Quick stats: total memories, total sessions, namespace count.

```
onemem stats [--namespace <id>]
```

---

### `onemem health`

Check relayer + chain + SDK compatibility.

Output:
```
OneMem CLI v0.1.0
  Relayer:        ✓ relayer.memwal.ai (200ms)
  Sui network:    ✓ mainnet (block 12345678)
  SDK version:    0.1.0 (min supported: 0.1.0) ✓
  Credentials:    ✓ valid, expires in 30d
  Active namespace: 0x123... ("personal")
```

---

### `onemem install --runtime <id>`

Install OneMem plugin for a specific runtime. Mirrors claude-mem's `install --ide <id>` pattern.

```
onemem install --runtime <id>
```

Supported `<id>` values at v0.1:
- `claude-code` — installs `@onemem/claude-code-plugin` + writes plugin marketplace entry
- `openclaw` — installs `@onemem/oc-onemem` + sets `plugins.slots.memory = 'onemem'`
- `hermes` — installs `hermes-onemem` + sets `memory.provider = onemem` in Hermes config
- `cursor` — writes `.cursor/mcp.json` with OneMem MCP entry
- `windsurf` — writes `.windsurf/mcp.json`
- `codex` — writes `~/.codex/config.toml` MCP entry
- `claude-desktop` — writes Claude Desktop config
- `cline` — writes Cline MCP config
- `vscode` — writes VS Code MCP config
- `antigravity` — writes `mcp_config.json`
- `all` — installs MCP entry for every detected MCP-capable runtime + native plugins where supported

Each installer is a separate module in `src/installers/<runtime>.ts` / `onemem/installers/<runtime>.py`.

Output:
```
✓ Detected Claude Code at /Users/.../.claude/
✓ Installed plugin to ~/.claude/plugins/onemem
✓ Wrote plugin manifest
✓ Added MCP server entry

Restart Claude Code to activate.
```

---

### `onemem uninstall --runtime <id>`

Reverses `install`.

---

### `onemem set-namespace <namespace-id>`

Set the active namespace (saved to credentials file).

---

### `onemem set-agent <agent-id>`

Set the active agent_id used for trace emission.

---

## Exit code conventions (across all commands)

| Code | Meaning |
|---|---|
| 0 | Success |
| 1 | User-facing failure (bad input, validation error, etc) |
| 2 | System failure (network, auth, etc) |
| 3 | Verification failure (Merkle chain broken, etc) |
| 130 | Ctrl-C (SIGINT) |

---

## Help text convention

`onemem <command> --help` always shows:
1. One-line description
2. Usage
3. Arguments table
4. Flags table
5. Examples (2-3)
6. Related commands
7. Link to docs.onemem.ai for that command

---

## Cross-references

- `README.md` — design principles
- `output-design.md` — color + table + JSON formats
- `cli-typescript-impl.md` — Node implementation
- `cli-python-impl.md` — Python implementation
- `login-flow.md` — browser-based login detail
- `../02-sdks/shared-api-surface.md` — SDK methods each command wraps
