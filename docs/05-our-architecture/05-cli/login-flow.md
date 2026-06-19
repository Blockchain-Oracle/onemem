# Browser Login Flow — `onemem login`

> Current implementation note, 2026-06-17: the TS CLI binds
> `127.0.0.1` on an OS-assigned free port (`listen(0)`) and passes that port to
> the hosted `/cli-login` page. The current CLI does not register a `logout`
> command.

Browser-based wallet login that writes `~/.onemem/credentials.json`. Mirrors the `@mysten-incubation/memwal-mcp` pattern (per `02-inspirations/memwal-incubation/README.md`).

---

## The flow (end-to-end)

```
1. User runs:
   $ onemem login

2. CLI starts an ephemeral HTTP server on 127.0.0.1 using an OS-assigned free port

3. CLI opens browser to:
   https://app.onemem.xyz/cli-login?nonce=<random>&port=<bound-port>
   
   (or https://staging.app.onemem.xyz/... in staging mode)

4. Browser loads OneMem hosted dashboard's CLI-login page
   - User connects wallet via @mysten/dapp-kit
   - User signs the nonce + (optionally) mints a MemWalAccount if they don't have one
   - User picks an active namespace from their owned namespaces (or creates a new one)
   - User generates a delegate key (Ed25519) for the CLI to use
   - Delegate key is registered to the MemWalAccount on-chain (one Sui tx)
   - All gasless via Enoki sponsored-tx for new users

5. Browser POSTs back to http://127.0.0.1:<bound-port>/callback with:
   {
     "delegateKey": "<ed25519 private hex>",
     "delegatePublicKey": "<hex>",
     "accountId": "<sui object id>",
     "suiAddress": "<sui address that signed>",
     "activeNamespaceId": "<sui object id>",
     "agentId": "cli-default",
     "signature": "<signature of nonce by delegate key>",
     "expiresAt": <epoch ms>
   }

6. CLI validates signature against nonce

7. CLI writes to ~/.onemem/credentials.json:
   {
     "delegateKey": "...",
     "delegatePublicKey": "...",
     "accountId": "...",
     "suiAddress": "...",
     "activeNamespaceId": "...",
     "agentId": "cli-default",
     "createdAt": <now>,
     "expiresAt": <epoch ms>,
     "sdkVersion": "0.1.0"
   }
   chmod 600

8. CLI prints:
   ✓ Logged in as 0xsui_address...
     Account: 0xaccount...
     Active namespace: 0xnamespace... ("personal")
   
   Set these in your shell to use OneMem in code:
     export ONEMEM_DELEGATE_KEY=...
     export ONEMEM_ACCOUNT_ID=0xaccount...
     export ONEMEM_NAMESPACE_ID=0xnamespace...

9. CLI exits 0
```

---

## Why browser-based (not just a private key prompt)

- **Security:** users never paste their wallet private key into a CLI. The wallet signs in the browser; the CLI gets a derived delegate key only.
- **UX:** wallet integration UX (Slush, Suiet, etc) lives in browsers, not terminals. Don't reinvent.
- **Gasless onboarding:** browser flow can mint the MemWalAccount via Enoki sponsored-tx in one click; pure-CLI would require the user to have SUI for gas.
- **MemWal precedent:** `@mysten-incubation/memwal-mcp` uses exactly this pattern. Users familiar with MemWal recognize it.

---

## Credentials file format (`~/.onemem/credentials.json`)

```json
{
  "delegateKey": "0x...",
  "delegatePublicKey": "0x...",
  "accountId": "0xMemWalAccountObjectId",
  "suiAddress": "0xUserWalletAddress",
  "activeNamespaceId": "0xNamespaceObjectId",
  "agentId": "cli-default",
  "createdAt": 1748275200000,
  "expiresAt": 1750867200000,
  "sdkVersion": "0.1.0"
}
```

Permissions: `chmod 600` (owner read/write only). Refuse to load if perms are wider.

---

## Refresh / expiry handling

- Delegate keys default to 30-day expiry (configurable per `app.onemem.xyz/cli-login`)
- CLI checks `expiresAt` on every command; warns at <7 days remaining
- On expiry: any command fails with `OneMemAuthError`; user runs `onemem login` again
- There is no current logout command; credential deletion and on-chain delegate
  revocation are deferred lifecycle work.

---

## Multiple credentials (planned for v0.2)

`~/.onemem/credentials.json` is single-account at v0.1. v0.2 could support:

```
~/.onemem/
├── credentials.json          # default
└── profiles/
    ├── work.json
    ├── personal.json
    └── dev.json
```

With `onemem --profile work search ...`. Out of scope at v0.1.

---

## Browser-side implementation reference

The browser side is implemented in the hosted dashboard (`app.onemem.xyz/cli-login`). It uses:

- `@mysten/dapp-kit` for wallet connect
- `@mysten/sui` for tx building
- `@mysten/enoki` for sponsored-tx (gasless MemWalAccount mint for new users)
- `@mysten-incubation/memwal` SDK helpers for delegate key registration

Detail in `06-dashboard/hosted-deploy.md` §"CLI login page".

---

## Failure modes

| Failure | What CLI does |
|---|---|
| Browser doesn't open | Prints URL to terminal + waits — user opens manually |
| User closes browser without signing | Times out after 5 min; CLI exits with error |
| User cancels wallet signature | Browser POSTs `{"cancelled": true}`; CLI exits with error |
| Local callback bind fails | CLI exits with the bind error before opening the browser |
| Network error during callback | CLI exits with helpful error message |
| Signature validation fails (replay attack attempt) | CLI exits with error; logs to stderr |

---

## Cross-references

- `command-surface.md` — `onemem login` command spec
- `cli-typescript-impl.md` — Node implementation of login server
- `cli-python-impl.md` — historical Python parity sketch; current Python CLI has no login command
- `../06-dashboard/hosted-deploy.md` — `app.onemem.xyz/cli-login` page detail
- `../../01-sui-ecosystem/enoki-zklogin.md` — Enoki sponsored-tx mechanics
- `../../02-inspirations/memwal-incubation/README.md` — MemWal MCP login pattern (the reference)
