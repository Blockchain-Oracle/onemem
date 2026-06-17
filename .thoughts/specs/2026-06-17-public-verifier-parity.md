# Spec: Public Verifier Prototype Parity

Date: 2026-06-17

## Scope

Bring hosted `/verify/[session_id]` closer to the One Mem 2 prototype's trust
moment without adding login, plaintext decryption, or fake proof claims.

## Requirements

- R1: `/verify/[session_id]` remains public and does not require wallet/login.
- R2: The page verifies the TraceSession through the existing SDK verifier.
- R3: The page fetches all matching `ActionCallEmittedEvent` pages for the
  session, not only the latest 50 global events.
- R4: The page shows explicit "Proven" and "Not proven" sections.
- R5: The page shows expected/on-chain root and computed/re-derived root.
- R6: The page shows call evidence count and visible per-call rows when events
  are available.
- R7: The page handles failed verification, missing session, and incomplete event
  evidence honestly.
- R8: Browser smoke covers the public verifier route without requiring account
  state.

## Out Of Scope

- Plaintext decrypt.
- Agent intent or real-world correctness proof.
- Wallet-gated share/capability flows.
- Animated chain-walk timing parity with the prototype.

## Acceptance Criteria

- AC1: Tests cover paginated event reads.
- AC2: Tests cover root/call count formatting helpers.
- AC3: Hosted browser smoke visits `/verify/<session-id>` and sees public
  verifier copy, Proven/Not proven sections, and no account requirement.
- AC4: Hosted lint, typecheck, build, browser smoke, and structure gates pass.
