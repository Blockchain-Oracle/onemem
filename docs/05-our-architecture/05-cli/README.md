# Pillar 5 — CLI (OneMem)

> Current note, 2026-06-17: this is a historical design document. Current CLI
> command truth lives in `packages/cli-ts/src/index.ts`,
> `packages/cli-python/onemem_cli/main.py`, and package READMEs.

`onemem` — the developer command-line for OneMem. The TS CLI
(`@onemem/cli`) is the canonical write-capable CLI. The Python CLI
(`onemem-cli`, binary `onemem-py`) is the read-only verifier/trace mirror for
Python-first environments.

---

## Read order

| File | Purpose |
|---|---|
| `README.md` | This file — design principles |
| `command-surface.md` | **Load-bearing.** Current commands, subcommands, and flags |
| `output-design.md` | Historical richer-output sketch; current package output is simpler |
| `cli-typescript-impl.md` | Historical `@onemem/cli` implementation sketch; source is authoritative |
| `cli-python-impl.md` | Historical Python parity sketch; current CLI uses Click read-only commands |
| `login-flow.md` | Current TS browser-pairing callback contract |

---

## Design principles

1. **TS canonical, Python read-only mirror.** TS owns provisioning, hosted login
   pairing, namespace writes, and MemWal memory add/search. Python mirrors the
   independently-verifiable read surface (`verify`, `trace`, `health`).
2. **Only advertise commands that are registered in code.** Replay, logout, and
   unified runtime installers stay deferred until implemented.
3. **Runtime wiring is package-owned for v0.1.** Runtime packages expose their
   own install paths; `onemem install --runtime <id>` is a later convenience
   command, not current behavior.
4. **JSON output via `--json` flag** on every read command — for scripting.
5. **Human output stays simple and test-backed.** Richer color/table/progress
   design is historical unless package code and tests implement it.
6. **Read commands fast (<500ms p95)** — direct relayer + chain calls, no waiting on Sui finality.
7. **Write commands report on-chain tx digest + Walrus blob ID** so users can verify externally.
8. **Apache-2.0 license.**

---

## Implementation status

| Component | Status |
|---|---|
| `@onemem/cli` package skeleton | Built. |
| Command surface implemented (TS) | Built for current v0.1: verify, trace list/get/events, health, dashboard launcher, hosted login pairing, init, namespace share/revoke/capabilities, add, and search. |
| `onemem-cli` package skeleton | Built. |
| Command surface implemented (Python) | Built as read-only mirror: verify, trace list/get/events, and health. |
| Browser login flow | Built in TS CLI + hosted `/cli-login` callback flow; live wallet popup remains manual proof. |
| `onemem install --runtime <id>` per-runtime configurators | Deferred; runtime packages expose their own install paths. |

---

## Cross-references

- `../02-sdks/shared-api-surface.md` — SDK API the CLI wraps
- `../../02-inspirations/mem0/README.md` — Mem0 CLI patterns
- `../../02-inspirations/claude-mem/HOOKS_AND_VIEWER_REFERENCE.md` — claude-mem install --ide pattern
