---
purpose: Concise reference for Sui Stack Messaging — beta E2EE messaging primitive, relevant if OneMem needs cross-agent encrypted channels.
sources:
  - https://docs.sui.io/sui-stack/seal/sui-chat-app
  - https://github.com/MystenLabs/sui-stack-messaging
verified: 2026-05-23
---

# Sui Stack Messaging (for OneMem)

Beta mainnet + testnet E2EE messaging primitive from Mysten. NOT to be confused with the older `sui-stack-messaging-sdk` (alpha, testnet-only, on-chain messages — superseded).

## When OneMem might use it

- Multi-agent encrypted handoff channels (e.g. "Agent A finished a research task, hand off encrypted notes to Agent B").
- Cross-team collaboration around audit findings (e.g. "Show Engineer X the trace where Agent Y made decision Z, encrypted").
- A built-in "alerts" channel where OneMem emits encrypted notifications when an agent's memory exceeds policy thresholds.

If OneMem stays single-agent / single-user in the MVP, **skip this entirely** for Sui Overflow.

## Architecture (3 layers, 5 actors)

```
User → React frontend → Relayer (Rust/Axum) → Walrus
                     → Seal key servers
                     → messaging Move package
```

- **Frontend** — wallet connect, message compose, client-side encrypt/decrypt, group mgmt.
- **Relayer** — Rust/Axum HTTP service. Stores encrypted messages in memory, verifies sender signatures, checks onchain permissions via cached membership store, batches to Walrus.
- **Walrus** — encrypted message quilts for decentralized persistence.
- **Move package** (`MystenLabs/sui-stack-messaging/move/packages/sui_stack_messaging`) — group creation, permissions, encryption-key history, Seal access gate.
- **Seal key servers** — release DEK shares only when `seal_approve_reader` confirms the caller has `MessagingReader` permission.

## Envelope encryption

Two-layer scheme:
1. **DEK layer (Seal)** — group creation generates a random AES-256 DEK. SDK encrypts DEK with Seal, stores ciphertext in onchain `EncryptionHistory` object. Each key rotation appends a new version.
2. **Message layer (AES-256-GCM)** — sender fetches encrypted DEK from chain, decrypts via Seal (gated by `MessagingReader` permission), encrypts the message with the DEK + random 12-byte nonce. Relayer + Walrus see only ciphertext.

This is the right pattern for OneMem's trace blobs too (>100KB) — see `seal-deep-dive.md`.

## Permission types (7 granular)

- `MessagingSender` — send messages
- `MessagingReader` — read / decrypt
- `MessageEditor` — edit own / others
- `MessageDeleter` — delete
- `MemberAdmin` — add / remove members
- `EncryptionKeyRotator` — rotate DEK
- `GroupAdmin` — change group settings

All managed via the `PermissionedGroup<Messaging>` shared object. Removing a member + rotating the DEK in one atomic tx revokes future-message access while preserving past-message access for existing members.

## Deployed package IDs (live)

| Network | Groups SDK package ID |
|---|---|
| Testnet | `0xba8a26d42bc8b5e5caf4dac2a0f7544128d5dd9b4614af88eec1311ade11de79` |
| Mainnet | `0x541840ae7df705d1c6329c22415ed61f9140a18b79b13c1c9dc7415b115c1ba8` |

## SDK setup

```ts
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { createMessagingGroupsClient } from '@mysten/sui-stack-messaging';

const client = createMessagingGroupsClient(
  new SuiGrpcClient({ baseUrl: 'https://fullnode.testnet.sui.io:443', network: 'testnet' }),
  {
    seal: {
      serverConfigs: [
        { objectId: '0x...', weight: 1 },
        { objectId: '0x...', weight: 1 },
      ],
    },
    encryption: { sessionKey: { signer: keypair } },
    relayer: { relayerUrl: 'https://your-relayer.example.com' },
  },
);
```

For typical hackathon use: spin up the chat-app's relayer locally (`cd relayer && cargo run`, defaults to `localhost:3000`); use the chat-app frontend as a starting scaffold.

## OneMem implications

If OneMem ships a cross-agent channel feature, lift wholesale from `MystenLabs/sui-stack-messaging/chat-app`:
- Move policy (`seal_approve_reader`) → adapt to OneMem's `agent_id` / `account_id` checks.
- DEK rotation pattern → reuse for OneMem's per-namespace encryption-key versioning.
- Relayer pattern → mirror the in-memory-then-Walrus-archival flow.

If OneMem stays single-user, **skip** — adds 1-2 days of integration with little judging payoff.
