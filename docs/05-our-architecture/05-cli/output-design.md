# CLI Output Design — `onemem`

Consistent visual + structural output across Node + Python implementations. References brand tokens from `../../02-inspirations/BRAND_AND_SURFACES.md`.

---

## Color palette (terminal)

ANSI 256-color codes mapped to brand colors:

| Token | Hex (brand) | Terminal | Use |
|---|---|---|---|
| Primary | `#B08FFF` lavender | 183 (bright magenta-violet) | Headings, primary text, "OneMem" wordmark |
| Verify accent | `#D4FF5E` chartreuse | 191 (bright yellow-green) | Verified ✓ marks, "VERIFIED" status |
| Sui blue | `#0090FF` | 39 (bright blue) | Suiscan links, on-chain references |
| Success | `#22c55e` green | 76 | Generic success |
| Warning | `#facc15` yellow | 220 | Warnings |
| Error | `#ef4444` red | 196 | Errors, FAILURE status |
| Muted | `#94a3b8` slate | 245 | Secondary text, metadata |
| Surface | (terminal default bg) | default | Background |

Disable colors with `--no-color` or `NO_COLOR` env (per CLI conventions).

---

## Status icons / symbols

| Icon | Meaning |
|---|---|
| `✓` (green or chartreuse) | Success / verified |
| `✗` (red) | Failure / verification broken |
| `⚠` (yellow) | Warning |
| `→` (muted) | Continuation, "next step" |
| `…` (muted) | In progress |
| `●` (color-coded) | Status bullet (color per status: green/yellow/red) |

---

## Table format

For commands returning lists (`search`, `list`, `namespace list`, `trace list`, etc):

```
ID                       Class        Tier  Text                                  Verified
─────────────────────── ──────────── ────  ──────────────────────────────────── ────────
0x123abc...              episodic     L0    User prefers dark mode               ✓
0x456def...              semantic     L1    Project uses pnpm + Vite             ✓
0xff8800...              procedural   L2    Run `pnpm test` before commit        ✓

Showing 3 of 142 memories.  →  onemem list --page 2
```

- Columns auto-sized to content width
- Header row in primary color
- Separator: U+2500 (light horizontal)
- Truncation: U+2026 (…) for overflowing cells
- "Showing X of Y" footer with pagination hint (when applicable)

---

## Single-record format (`get`, `namespace get`, `trace get`)

```
Memory 0x123abc...
  Text:        User prefers dark mode
  Class:       episodic
  Tier:        L0
  Verified:    ✓
  Namespace:   0xnamespace... ("personal")
  Walrus blob: 0xblob...
  Sui tx:      0xtx... (view on Suiscan)
  Created:     2026-05-26 10:14:32 UTC
  Updated:     —
  Version:     1
```

Indent: 2 spaces. Labels in primary color. Values default. Links (Suiscan) underlined in Sui blue.

---

## Trace tree format

For `onemem trace tree <session-id>`:

```
Session 0xsession... (claude-code-1.2.3, COMPLETED, 47 calls)
└─ ✓ memwal_write [claude-code-builtin] (root)
   ├─ ✓ Read /Users/abu/dev/file.ts [claude-code-builtin]
   ├─ ✓ Bash "pnpm test" [claude-code-builtin]
   │  ├─ Output: 14 tests passed
   │  └─ Duration: 2.3s
   ├─ ✓ delegate_to_subagent [hermes-runtime]
   │  └─ → Spawned session 0xhermes_session
   └─ ✗ Bash "git push" [claude-code-builtin]
      └─ Output: error: failed to push some refs

Session merkle_root: 0xabc... (on Suiscan: ...)
```

Tree branches: U+2502 (│), U+251C (├), U+2514 (└), U+2500 (─). Status icons inline. Sub-call details indented.

---

## Verify output

```
$ onemem verify 0xsession...

Verifying session 0xsession...
  [████████████████████████████░░░░] 38/47 calls verified

Walking the Merkle chain:
  ✓ ActionCall 1/47 (Read /Users/abu/...)
  ✓ ActionCall 2/47 (Bash pnpm test)
  ...
  ✓ ActionCall 47/47 (memwal_write)

Session merkle_root: 0xabc...
On-chain root:        0xabc...
Match:                ✓

VERIFIED ✓
```

Progress bar uses U+2588 (full) and U+2591 (light shade). Chartreuse accent on `VERIFIED ✓`.

---

## Error format

```
$ onemem add "Hello"
✗ Failed: namespace 0x... is deactivated

  The namespace was deactivated on 2026-05-20 by 0xabc...
  Reactivate with: onemem namespace reactivate 0x...

  Or write to a different namespace:
    onemem add "Hello" --namespace <other-id>
```

Structure: ✗ in red + one-line failure + indented context + indented suggested-fix command.

---

## JSON output

When `--json` is passed, ALL human formatting is suppressed. Output is a single JSON object on stdout. No colors, no progress bars, no logs to stdout (those go to stderr).

Example:

```bash
$ onemem search "dark mode" --json
{"results":[{"id":"0x123","text":"User prefers dark mode","memoryClass":"episodic",...}],"count":1}
```

Error in JSON mode:

```bash
$ onemem add "Hello" --json
{"error":{"type":"OneMemValidationError","message":"namespace 0x... is deactivated","detail":{...}}}
```

Exit code unchanged regardless of `--json`.

---

## Progress indicators

Long operations show progress:

```
Replaying session 0xsession...
  Fetching events: 47 events ✓
  Fetching Walrus blobs: [████████░░░░░░░░] 24/47
```

Render via `cli-progress` (Node) / `rich.progress` (Python). Disable with `--quiet`.

---

## Spinners

For unknowable-duration operations:

```
⠋ Waiting for Sui tx finality...
⠙ Waiting for Sui tx finality...
⠹ Waiting for Sui tx finality...
```

Braille spinner (U+2800 series). Standard pattern; `ora` (Node) / `rich.status` (Python).

---

## Logs to stderr (when `--verbose`)

```
$ onemem add "Hello" --verbose
[onemem] Encrypting text via Seal /manual flow
[onemem] Uploading encrypted blob to Walrus via relayer.memwal.ai
[onemem] Building PTB: trace::append_call
[onemem] Signing PTB with delegate key
[onemem] Executing on Sui mainnet
[onemem] Tx confirmed: 0xtxdigest...
✓ Saved memory 0xmemid (blob 0xblob, tx 0xtx)
```

All `[onemem]` log lines go to stderr; ✓ result line goes to stdout. Lets users `2>/dev/null` the logs while keeping the result.

---

## Cross-references

- `README.md` — design principles
- `command-surface.md` — every command + its expected output
- `../../02-inspirations/BRAND_AND_SURFACES.md` — brand tokens
- `cli-typescript-impl.md` — Node libraries: chalk, ora, cli-progress, cli-table3
- `cli-python-impl.md` — Python libraries: rich (handles all of the above)
