# Spec: Share Capability Readiness

## Objective

Make namespace sharing honest and executable by aligning the dashboard Share
route with real Sui capability semantics and adding the missing TypeScript CLI
namespace-share command.

## Background And Current Reality

The prototype positions sharing as a core Sui-native capability flow. Current
dashboard copy already tells users to run a namespace-share command, but the
current CLI does not provide that command. The SDK and Move contract do support
capability minting and read-only capability listing, while owner-driven revoke of
another holder's cap is not supported in v0.1.

## Users

- Namespace owners who want to grant ReadOnly or ReadWrite access to another Sui
  address.
- Operators who need to inspect active capabilities on a namespace.
- Recipients and demo viewers who need an honest explanation of what a
  capability grants.

## Goals

- Add a real TS CLI `onemem namespace share` command backed by
  `shareReadOnly()`/`shareReadWrite()`.
- Add a read-only TS CLI `onemem namespace capabilities` command.
- Preserve and display the Admin cap ID when `onemem init` provisions a new
  namespace, while remaining compatible with older persisted targets.
- Update `/share` to show configured namespace details, active capabilities, and
  accurate share commands.
- Explain revoke semantics honestly: v0.1 supports holder self-revoke; owner
  admin-revoke is future work.

## Non-goals

- Do not implement hosted share or recipient claim.
- Do not fake owner-driven revoke.
- Do not add Python CLI namespace mutation support in this pass.
- Do not perform dashboard signing.

## Requirements

- R1: TS CLI must expose `namespace share <namespace-id> <recipient>` with
  `--cap ReadOnly|ReadWrite` and `--admin-cap <id>` or `ONEMEM_ADMIN_CAP_ID`.
- R2: TS CLI must expose `namespace capabilities <namespace-id>` for read-only
  active capability inspection.
- R3: `onemem init` should include `adminCapId` in fresh provisioning output and
  persisted target data when available.
- R4: `/share` must not reference nonexistent commands.
- R5: `/share` must list active capabilities for `ONEMEM_NAMESPACE_ID` when
  configured and clearly handle the no-namespace state.
- R6: `/share` must state that mint/share requires a signer and Admin cap.
- R7: `/share` must state that owner-driven revocation is not supported by the
  current contract; holder self-revoke is the v0.1 path.
- R8: Public verification link sharing must remain available.

## Acceptance Criteria

- AC1: `onemem namespace share --help` and `onemem namespace capabilities --help`
  are available in the TS CLI.
- AC2: Unit tests cover cap-kind parsing and admin-cap resolution.
- AC3: Dashboard `/share` renders no-namespace, namespace-configured, capability
  list, and public-link states without fake mutation buttons.
- AC4: Focused CLI and dashboard typecheck/test/lint/build gates pass.
- AC5: Structure test passes and the new Context Engineering artifacts are
  indexed.
- AC6: `/share` is HTTP-render or browser-checked.

## Constraints

- Use existing SDK namespace APIs.
- Keep dashboard Share files under source-size guardrails; split helpers if
  needed.
- Do not expose plaintext or private keys.
- Do not claim admin revocation exists in v0.1.

## Stories Needed

- Story 1: Owner grants a namespace capability from the CLI.
- Story 2: Operator inspects active namespace capabilities.
- Story 3: Dashboard explains share/revoke readiness honestly.

## Open Questions

- Should holder self-revoke be added as a CLI command after this pass?
- Should hosted recipient claim become the next Share-specific scope?

## Source References

- `.thoughts/research/2026-06-17-share-capability-readiness.md`
- `.thoughts/prototype-discovery/2026-06-17-one-mem-2.md`
- `/Users/abu/Downloads/One Mem 2/Share.html`
