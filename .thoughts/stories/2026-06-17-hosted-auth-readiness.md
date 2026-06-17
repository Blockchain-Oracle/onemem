# Stories: Hosted Auth Readiness

## Traceability

- Spec: `.thoughts/specs/2026-06-17-hosted-auth-readiness.md`
- Research: `.thoughts/research/2026-06-17-hosted-auth-readiness.md`

## Story 1: Connect From Hosted Login

As a hosted OneMem user,
I want `/login` to use the real Sui wallet connection layer,
so that sign-in state reflects an actual browser wallet or registered Enoki
wallet instead of a fake redirect.

### Acceptance Criteria

- Covers R1, R2, R3, R4, AC1, AC2, AC3.
- The page renders a dApp Kit connect button.
- When no account is connected, the page says no account is connected.
- When Enoki public config is missing, the page says Enoki Google sign-in is
  not configured.

### Scenarios

- Given public Enoki env is absent, when I open `/login`, then I can still use
  wallet connect and see explicit Enoki setup guidance.

### Notes

- The ConnectButton opens wallet-standard providers. Actual Google OAuth cannot
  be completed in automated tests without Enoki portal configuration.

## Story 2: Honest Onboarding State

As a new hosted user,
I want onboarding to show what is connected and what is still pending,
so that I do not think a namespace was minted when no transaction ran.

### Acceptance Criteria

- Covers R5, AC3, AC4.
- Onboarding shows connected account address when available.
- If no account is connected, onboarding directs the user back to connect.
- Minting steps are labeled pending until sponsored transaction routes exist.

### Scenarios

- Given no account is connected, when I open `/onboarding`, then the account
  step cannot honestly claim namespace creation.

## Story 3: Hosted Dashboard Account Prompt

As a user opening hosted dashboard,
I want the dashboard entry to reflect my real connected-account state,
so that actions requiring an account are clearly gated.

### Acceptance Criteria

- Covers R6 and AC3.
- Connected accounts see their address.
- Disconnected users see a sign-in/connect prompt.
- Public verification remains available without account state.

## Open Questions

- Which future route should own actual MemWalAccount/namespace sponsored minting:
  `/api/onboarding/mint` or a more generic sponsored transaction API?
