# Stories: Hosted CLI Delegate Minting

Date: 2026-06-17

## Story 1: Persist Hosted Provisioning

As a hosted onboarding user, when I provision a OneMem namespace, the browser remembers the namespace for the connected wallet so later CLI pairing can use it.

Acceptance:

- Successful provisioning writes a wallet-scoped browser storage record.
- The record includes namespace, Admin cap, ReadWrite cap, network, and transaction digests.
- CLI pairing reuses the record only when wallet address and Sui network both match.
- No private key is stored.

## Story 2: Discover MemWal Account

As a CLI-login user, when I connect a wallet, the page finds my existing MemWal account from the registry.

Acceptance:

- The route returns public MemWal config and existing account ID.
- Missing account returns `accountId: null`, not a hard failure.
- Missing server config returns a clear non-secret error.

## Story 3: Create MemWal Account

As a CLI-login user with no MemWal account, I can create one with my connected wallet.

Acceptance:

- The page builds `account::create_account(registry, clock)`.
- The wallet signs and executes it.
- The created `MemWalAccount` object ID is parsed from real transaction object changes.
- The page reuses this account ID for delegate registration.

## Story 4: Register Delegate Key

As a CLI-login user, I can mint a real CLI delegate credential.

Acceptance:

- The page generates a fresh Ed25519 delegate key.
- The page registers the public key with `account::add_delegate_key`.
- The private key is included only in the localhost callback payload.
- The payload includes TTL metadata and expiry time.

## Story 5: Validate Local Callback

As a CLI user, I want `onemem login` to reject spoofed callbacks.

Acceptance:

- Callback fails when required delegate credential fields are missing.
- Callback fails when the delegate signature over the nonce is absent or invalid.
- Callback fails when the submitted private key does not derive the submitted public key.
- Callback fails when the submitted registration digest does not prove a successful
  `account::add_delegate_key` call for the owner/account/delegate public key.
- Callback succeeds for a nonce signed by the matching delegate key.
