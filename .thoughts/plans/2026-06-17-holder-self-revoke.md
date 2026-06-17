# Plan: Holder Self-Revoke

Date: 2026-06-17

## References

- Research: `.thoughts/research/2026-06-17-holder-self-revoke.md`
- Spec: `.thoughts/specs/2026-06-17-holder-self-revoke.md`
- Stories: `.thoughts/stories/2026-06-17-holder-self-revoke.md`
- Prior slice: `.thoughts/verification/2026-06-17-share-capability-readiness.md`

## Steps

1. SDK
   - Add a capability kind type/parser for object type strings.
   - Add `getCapabilityKind(capId)`.
   - Add `revokeCapability({ capId, kind? })`.
   - Add focused unit tests for object-type parsing.

2. CLI
   - Add `namespace revoke <cap-id>`.
   - Add `--allow-admin` safety override.
   - Add focused tests for Admin-cap refusal.
   - Verify help output.

3. Dashboard
   - Update `/share` revocation boundary with the real self-revoke command.
   - Keep owner-driven revoke limitation explicit.

4. Verification
   - Run focused SDK/CLI/dashboard checks.
   - HTTP-render `/share`.
   - Do not execute live revoke unless a throwaway capability is intentionally
     created for this purpose.
   - Write verification audit and update wiki/structure guard.
