# Stories: Hosted Sponsored Provisioning

## Traceability

- Research:
  `.thoughts/research/2026-06-17-hosted-sponsored-provisioning.md`
- Spec:
  `.thoughts/specs/2026-06-17-hosted-sponsored-provisioning.md`

## Story 1: Start Real Hosted Provisioning

As a connected hosted user,
I want onboarding to start from my real wallet address,
so that any namespace it creates belongs to me on Sui.

### Acceptance Criteria

- Covers R1, R2, R3, R6, R7, R9, AC1, AC3, AC5.
- The user cannot start provisioning while disconnected.
- The prepare request sends the connected account address and a sanitized label.
- Missing Enoki configuration shows a structured error instead of fake success.

### Scenarios

- Given no wallet is connected, when I open onboarding, then the provisioning
  action remains gated behind account connection.
- Given Enoki private sponsorship is missing, when I start provisioning, then I
  see that the deployment is not configured.

### Notes

- This story does not require completing a wallet popup in automated smoke.

## Story 2: Create Namespace Through Sponsorship

As a connected hosted user,
I want the namespace-create transaction to be sponsored and signed by my wallet,
so that the resulting namespace and Admin capability are real Sui objects owned
by my account.

### Acceptance Criteria

- Covers R1, R4, R5, R7, R8, AC2, AC3, AC4.
- The server builds only `namespace::create` for this action.
- The server allowlists the OneMem namespace create Move target.
- The UI signs returned sponsored bytes with dApp Kit.
- The execute route returns namespace and Admin capability IDs parsed from the
  executed transaction.

### Scenarios

- Given a connected account and configured Enoki key, when I complete the first
  sponsored transaction, then onboarding displays the created namespace and
  Admin cap IDs.

## Story 3: Mint ReadWrite Capability Through Sponsorship

As a newly provisioned hosted user,
I want onboarding to mint a ReadWrite capability to my own account,
so that the namespace can later be used by trace-recording runtimes.

### Acceptance Criteria

- Covers R1, R3, R4, R5, R7, R8, AC2, AC3, AC4.
- The server validates namespace and Admin cap object IDs.
- The server builds only `namespace::mint_capability_readwrite` for this action.
- The server allowlists the OneMem RW-cap mint Move target.
- The execute route returns a real RW capability ID parsed from transaction
  object changes.

### Scenarios

- Given namespace creation succeeded, when I complete the second sponsored
  transaction, then onboarding displays namespace, Admin cap, RW cap, and
  transaction digests.

## Story 4: Operator-Safe Deployment Diagnostics

As a deployment operator,
I want missing sponsorship configuration to be explicit and safe,
so that I can configure Enoki without leaking server secrets or confusing users.

### Acceptance Criteria

- Covers R6, R9, R10, AC1, AC5, AC6.
- API responses mention missing config by name but never include the configured
  private key value.
- Browser smoke checks the disconnected/missing-config path.
- Structure tests require the provisioning artifacts and smoke files.

## Open Questions

- The next slice must decide how to persist the provisioned namespace/RW cap for
  CLI login and hosted share flows.
