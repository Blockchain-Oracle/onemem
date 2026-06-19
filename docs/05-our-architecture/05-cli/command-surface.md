# CLI Command Surface — `onemem`

**Load-bearing current surface.** This file describes the commands registered in
the current v0.1 CLIs, not the larger historical/planned CLI surface.

Authoritative implementation files:

- TS CLI: `packages/cli-ts/src/index.ts`
- Python CLI: `packages/cli-python/onemem_cli/main.py`

---

## Binaries

| Binary | Package | Scope |
|---|---|---|
| `onemem` | `@onemem/cli` | Canonical TS CLI. Read-only verification, hosted login pairing, provisioning, namespace capability operations, and MemWal-backed memory add/search. |
| `onemem-py` | `onemem-cli` | Python read-only mirror for verification, trace inspection, and health checks. |

The Python CLI intentionally does not expose provisioning, namespace writes, or
MemWal memory add/search in v0.1 because the Python SDK is verification-focused.

---

## Global Flags

The current TS CLI accepts:

| Flag | Description |
|---|---|
| `--json` | Output machine-readable JSON where supported. |
| `--network <name>` | Sui network: `testnet`, `mainnet`, `devnet`, or `local`. |
| `--help`, `-h` | Show help. |
| `--version` | Show CLI version. |

The Python CLI accepts:

| Flag | Description |
|---|---|
| `--json` | Output machine-readable JSON where supported. |
| `--network <name>` | Sui network: `testnet`, `mainnet`, `devnet`, or `local`. |
| `--help` | Show help. |

---

## Current TS Commands

### `onemem health`

Check Sui RPC and package reachability.

Needs: no signer.

### `onemem dashboard`

Launch the local dashboard by spawning the `onemem-dashboard` binary from the
separate `@onemem/dashboard` package.

Options:

| Flag | Description |
|---|---|
| `--port <port>` | Local dashboard port. Defaults to `4040`. |

Needs: `@onemem/dashboard` installed or `onemem-dashboard` otherwise available
on `PATH`. No signer is required to launch; route data still depends on local
credentials and configured network state.

### `onemem verify <session-id>`

Independently verify a `TraceSession` Merkle chain from chain data.

Needs: no signer, no Walrus, no Seal.

### `onemem trace list`

List recent `TraceSessionOpenedEvent` sessions for the configured package.

Needs: no signer.

### `onemem trace get <session-id>`

Show session metadata.

Needs: no signer.

### `onemem trace events <session-id>`

Show decoded `ActionCallEmittedEvent` rows for a session.

Needs: no signer.

### `onemem login`

Pair the terminal with the hosted dashboard and save
`~/.onemem/credentials.json`.

Options:

| Flag | Description |
|---|---|
| `--url <url>` | Dashboard URL. Defaults to `$ONEMEM_DASHBOARD_URL` or `https://app.onemem.xyz`. |
| `--timeout <seconds>` | Callback wait timeout. |
| `--no-open` | Print the pairing URL instead of opening a browser. |

The callback payload is validated before persistence: delegate key/public key
match, nonce signature verifies, delegate address matches, and the submitted
registration digest proves a successful MemWal `account::add_delegate_key` call
for the submitted owner/account/delegate.

### `onemem init`

Provision or reuse a namespace + ReadWrite capability using the shared runtime
signer resolver.

Options:

| Flag | Description |
|---|---|
| `--label <label>` | Namespace label. Defaults to `onemem`. |

Needs: a Sui signer resolvable by the SDK runtime.

Outputs:

- sender address
- network
- namespace ID
- ReadWrite cap ID
- Admin cap ID when created/resolved

### `onemem namespace share <namespace-id> <recipient>`

Mint and transfer a namespace capability to a recipient address.

Options:

| Flag | Description |
|---|---|
| `--cap <kind>` | `ReadOnly` or `ReadWrite`. Defaults to `ReadOnly`. |
| `--admin-cap <id>` | Admin capability ID. Falls back to `ONEMEM_ADMIN_CAP_ID`. |

Needs: signer + Admin cap.

### `onemem namespace revoke <cap-id>`

Holder self-revoke. Consumes a capability object owned by the signer.

Options:

| Flag | Description |
|---|---|
| `--allow-admin` | Permit revoking an Admin cap. Without this guard, Admin cap revocation is refused. |

Needs: signer that owns the capability object.

### `onemem namespace admin-revoke <namespace-id> <cap-id>`

Admin revoke. Records the capability ID as revoked under the namespace. The
holder-owned cap object is not deleted, but future OneMem trace/write/decrypt
authorization gates reject it.

Options:

| Flag | Description |
|---|---|
| `--admin-cap <id>` | Admin capability ID. Falls back to `ONEMEM_ADMIN_CAP_ID`. |
| `--allow-admin` | Permit admin-revoking an Admin cap. Without this guard, Admin cap revoke is refused. |

Needs: signer + Admin cap.

### `onemem namespace capabilities <namespace-id>`

List active capabilities for a namespace from chain events.

Needs: no signer.

### `onemem add <text>`

Store a memory through MemWal and emit a verifiable OneMem `ActionCall`.

Options:

| Flag | Description |
|---|---|
| `--namespace <ns>` | MemWal namespace override. |

Needs: signer + MemWal config.

### `onemem search <query>`

Vector-recall memories through MemWal.

Options:

| Flag | Description |
|---|---|
| `--top-k <n>` | Max result count. |
| `--namespace <ns>` | MemWal namespace override. |

Needs: signer + MemWal config.

---

## Current Python Commands

The Python CLI exposes the independently-verifiable read surface:

```text
onemem-py health
onemem-py verify <session-id>
onemem-py trace list
onemem-py trace get <session-id>
onemem-py trace events <session-id>
```

These commands are read-only and require no signer, Walrus, or Seal.

---

## Deferred Commands

These appeared in older design docs but are not registered in the current v0.1
TS/Python CLI surface:

- `onemem logout`
- `onemem get`
- `onemem update`
- `onemem delete`
- `onemem list`
- `onemem history`
- `onemem export`
- `onemem namespace create`
- `onemem namespace list`
- `onemem namespace get`
- `onemem namespace deactivate`
- `onemem namespace reactivate`
- `onemem trace tree`
- `onemem trace end`
- `onemem replay`
- `onemem stats`
- `onemem set-namespace`
- `onemem set-agent`
- `onemem install --runtime <id>`
- `onemem uninstall --runtime <id>`

Implementing any deferred command should be a separate researched slice with its
own spec, tests, and verification. The dashboard package exposes the local
dashboard binary as `onemem-dashboard`, and the current TS CLI `dashboard`
subcommand delegates to it.

---

## Cross-references

- `packages/cli-ts/README.md` — package-facing TS CLI surface.
- `packages/cli-python/README.md` — package-facing Python CLI surface.
- `apps/docs/reference/cli.mdx` — public docs CLI reference.
- `login-flow.md` — hosted pairing flow.
