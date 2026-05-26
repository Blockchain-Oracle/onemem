---
purpose: Concise reference for Enoki — managed zkLogin + sponsored tx — for the OneMem dashboard onboarding.
sources:
  - https://docs.sui.io/sui-stack/zklogin-integration
  - https://docs.sui.io/sui-stack/zklogin-integration/zklogin
  - https://docs.sui.io/sui-stack/enoki/ticketing-poc
  - https://docs.enoki.mystenlabs.com
  - https://github.com/MystenLabs/ts-sdks/tree/main/packages/enoki
verified: 2026-05-23
---

# Enoki + zkLogin (for OneMem dashboard)

## TL;DR for a hackathon

**Use Enoki, not raw zkLogin.** Enoki wraps zkLogin + sponsored transactions into a hosted product. It removes:
- Running your own ZK prover service (compute-heavy: 16 vCPU + 64GB RAM minimum, 3-second proofs).
- Maintaining a per-user salt store.
- Building sponsored-tx gas pool infrastructure.

You pay nothing for normal hackathon usage; production charges per active user.

## zkLogin in one paragraph

zkLogin lets users send Sui transactions using a Google / Twitch / Facebook / Apple / Slack / Kakao / Microsoft OAuth login WITHOUT publicly linking the Web2 identity to the Sui address. Zero-knowledge Groth16 proof generated from the JWT; the Sui address derives from `iss + aud + sub + user_salt` (none of which leak onchain). Two-factor: an attacker needs BOTH the OAuth account AND the salt.

A zkLogin transaction works the same as any other Sui transaction, except the signature is a Groth16 proof + ephemeral signature combo instead of a single Ed25519 signature.

## Enoki provides

- **Hosted ZK prover** — no setup. Just SDK calls.
- **Hosted salt server** — Mysten's salt-management implementation.
- **Sponsored transactions** — Enoki signs as sponsor and executes. Gas paid from your funded Enoki account.
- **dApp-Kit integration** — `registerEnokiWallets({ apiKey, providers })` wires Enoki wallets into the standard Sui dApp Kit wallet picker.
- **React hooks** — `useEnokiFlow().login('google')` + standard `useSignAndExecuteTransaction`.

## SDK setup (TS)

```bash
npm install @mysten/enoki @mysten/dapp-kit-react @mysten/sui
```

```ts
// app/dapp-kit.ts
import { registerEnokiWallets } from '@mysten/enoki';

registerEnokiWallets({
  apiKey: process.env.NEXT_PUBLIC_ENOKI_API_KEY!,
  providers: ['google', 'twitch', 'facebook'],
});
```

```tsx
// LoginButton.tsx
import { useEnokiFlow } from '@mysten/enoki/react';

export function LoginButton() {
  const { login } = useEnokiFlow();
  return <button onClick={() => login('google')}>Sign in with Google</button>;
}
```

## Low-level sponsored tx (backend route)

```ts
import { EnokiClient } from '@mysten/enoki';

const client = new EnokiClient({ apiKey: process.env.ENOKI_API_KEY! });

// 1. Build PTB on the frontend, send transactionKindBytes to backend.
// 2. Backend creates a sponsored transaction.
const sponsored = await client.createSponsoredTransaction({
  network: 'mainnet',
  sender: '0xUserAddr',
  transactionKindBytes: '...',   // base64
});

// 3. User signs (frontend wallet popup).
// 4. Execute via Enoki.
await client.executeSponsoredTransaction({
  digest: sponsored.digest,
  signature: '<user-sig>',
});
```

## Configuration (Enoki dashboard)

At https://portal.enoki.mystenlabs.com:
1. Create an app.
2. Add OAuth providers (Google, etc.) — paste the OAuth client ID.
3. Generate public + private API keys.
4. Whitelist the OneMem Move package address.
5. Configure sponsored-tx budget / per-user caps.

In Google Cloud Console: add `http://localhost:3000/` (dev) and your prod URL as authorized JavaScript origins + redirect URIs. (Common "Google sign-in doesn't trigger" bug — see ticketing-poc troubleshooting.)

## Pattern from ticketing-poc (OneMem can mirror)

The `ticketing-poc` reference app uses Enoki + zkLogin + sponsored tx for an Ed25519-permit ticket-minting flow. The architecture pattern:

1. User signs in with Google via Enoki → gets zkLogin Sui address.
2. Frontend POSTs to `/api/permit/mint-ticket` (backend signs an Ed25519 permit with a stored admin key).
3. Frontend builds a 2-call PTB: `new_mint_permit` (verifies signature, consumes nonce) + `mint` (creates NFT).
4. Frontend POSTs PTB bytes to `/api/sponsor` → Enoki sponsors → returns sponsored bytes.
5. Frontend wallet signs the sponsored tx.
6. Frontend POSTs signed tx to `/api/execute` → Enoki executes.

OneMem's flow translates almost 1:1:

1. User signs in with Google via Enoki.
2. Frontend builds a PTB that calls `onemem::commit_memory` (or whatever the audit-entry function is).
3. Backend sponsors via Enoki.
4. User signs via wallet (no Sui gas needed).
5. Tx executes — `MemoryCommit` authenticated event fires.

User experience: "Sign in with Google → start using OneMem. No wallet popups for gas. No SUI required."

## OneMem implications

- **Day 0-2**: scaffold dashboard with `pnpm create @mysten/dapp` (React + Vite + dApp Kit). Register Enoki wallets.
- **Day 3-5**: wire `LoginButton` + `useEnokiFlow` + a backend `/api/sponsor` route.
- **Day 6+**: every OneMem mutating Move call goes through the sponsored-tx flow.
- **Salt management**: use the Enoki-hosted salt store (option 4 in the canonical zkLogin doc — HKDF-derived per-user salts from a master seed).
- **Whitelisting**: OneMem Move package address must be on the Enoki app allowlist for sponsored tx to work.

## Pricing / production caveats

- Free tier covers hackathon usage. Production charges per active user.
- Master seed for salt derivation cannot be rotated without changing user addresses (losing funds). Mysten manages this if you use Enoki's hosted salt.
- For mainnet launch: re-audit Enoki ToS for app-level liability. Hackathon scope: fine.

## Raw zkLogin (if you absolutely must)

If OneMem needs custom OAuth providers Enoki doesn't support, fall back to `@mysten/sui/zklogin`:
- Generate ephemeral keypair + randomness + nonce.
- Redirect user to OAuth URL with the nonce.
- Receive JWT from callback.
- POST JWT + ephemeral pubkey + maxEpoch + salt → ZK prover (Mysten-hosted or self-hosted Docker).
- Build tx with `setSender(zkLoginAddress)`, sign with ephemeral key, combine with ZK proof via `getZkLoginSignature`.
- Execute.

Reference: `docs/content/sui-stack/zklogin-integration/zklogin.mdx` (the full integration walkthrough — ~370 lines).

For OneMem: do NOT do this. Enoki saves 3-5 days of plumbing.
