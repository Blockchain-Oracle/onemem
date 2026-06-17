# Verification Audit: Hosted Sponsored Provisioning

## Verdict

Pass.

The hosted app now has a real two-transaction sponsored provisioning path for
testnet: namespace create, then ReadWrite capability mint. The server controls
the transaction builders and Enoki allowlists, the browser UI signs sponsored
bytes through dApp Kit, and successful results are parsed from executed Sui
transaction object changes. Delegate credentials and hosted share/revoke remain
separate follow-ups at the time of this audit. Hosted owner share creation is
superseded by `.thoughts/verification/2026-06-17-hosted-share-capability-creation.md`;
recipient claim links and owner-driven revoke remain follow-ups.

## Artifacts Checked

- Research:
  `.thoughts/research/2026-06-17-hosted-sponsored-provisioning.md`
- Spec:
  `.thoughts/specs/2026-06-17-hosted-sponsored-provisioning.md`
- Stories:
  `.thoughts/stories/2026-06-17-hosted-sponsored-provisioning.md`
- Plan:
  `.thoughts/plans/2026-06-17-hosted-sponsored-provisioning.md`
- Quality profile:
  `.thoughts/quality/2026-06-17-project-quality-profile.md`
- Implementation:
  `apps/hosted-dashboard/lib/sponsored-provisioning.ts`
  `apps/hosted-dashboard/app/api/onboarding/sponsored/prepare/route.ts`
  `apps/hosted-dashboard/app/api/onboarding/sponsored/execute/route.ts`
  `apps/hosted-dashboard/app/onboarding/SponsoredProvisioning.tsx`
  `apps/hosted-dashboard/app/onboarding/page.tsx`
  `apps/hosted-dashboard/scripts/browser-smoke.mjs`
  `tests/structure.test.ts`

## Requirement Traceability

- R1: `sponsored-provisioning.ts` builds only `namespace-create` and
  `rw-cap-mint` actions. It never accepts arbitrary client transaction bytes.
- R2: `prepare/route.ts` and `execute/route.ts` expose the two-step API.
- R3: The helper validates action, sender, network, namespace ID, Admin cap ID,
  digest, and signature.
- R4: `prepareSponsoredProvisioning` calls Enoki with action-specific
  `allowedMoveCallTargets` and `allowedAddresses`.
- R5: `executeSponsoredProvisioning` calls Enoki with digest + signature, waits
  for the transaction, checks success, and parses created OneMem objects from
  `objectChanges`.
- R6: API responses include object IDs, digests, and error codes only; private
  Enoki keys are read server-side and never returned.
- R7: `SponsoredProvisioning.tsx` uses dApp Kit `useSignTransaction` to sign
  server-returned sponsored bytes.
- R8: The UI runs namespace create before RW-cap mint and displays IDs only
  after execution.
- R9: The browser smoke verifies missing sponsorship config returns structured
  `not_configured` JSON instead of fake success.
- R10: Structure tests now require the helper, routes, component, smoke script,
  and Context Engineering artifacts.

## Acceptance Criteria Coverage

- AC1: Passed. `browser:smoke` clears private Enoki env for its temporary
  server and verifies `POST /api/onboarding/sponsored/prepare` returns HTTP 503
  with `code: "not_configured"`.
- AC2: Passed. A live testnet smoke loaded the local Enoki key from `.env`,
  prepared both sponsored transactions, signed them with the local Sui signer,
  executed them through Enoki, and parsed real object IDs.
- AC3: Passed by code inspection and typecheck. The onboarding UI signs
  sponsored bytes with `useSignTransaction` before calling execute.
- AC4: Passed. The helper returns namespace/Admin/RW IDs only by reading
  executed transaction `objectChanges`.
- AC5: Passed by code inspection and smoke. Client code does not reference
  `ENOKI_PRIVATE_KEY` or `ENOKI_SECRET_KEY`; smoke checks the no-config response
  does not leak key assignments.
- AC6: Hosted lint, typecheck, build, browser smoke, and live testnet smoke
  passed. Repo structure and full lint are run after this audit is written.

## Quality Gates

- `pnpm --filter @onemem/hosted-dashboard lint` passed.
- `pnpm --filter @onemem/hosted-dashboard typecheck` passed.
- `pnpm --filter @onemem/hosted-dashboard build` passed.
- `pnpm --filter @onemem/hosted-dashboard browser:smoke` passed 16 checks,
  including sponsored prepare missing-config behavior.
- Live sponsored provisioning smoke passed on testnet:
  - sender `0x633dbf84...e60c235a`
  - namespace `0x378a4bae...3fb7271f`
  - Admin cap `0xb929f945...3eb1fa24`
  - ReadWrite cap `0x9136b89f...4410c409`
  - namespace tx `AkLfLTQE4C...cMTxEosQ`
  - RW cap tx `3WeTfwCjZp...n2aPg4yg`

## Deviations From Plan

- Enoki does not support local network sponsorship, so the helper rejects
  `local` even though `SuiNetwork` includes it.
- The live sponsorship smoke was run from `apps/hosted-dashboard` so workspace
  package resolution matched the app runtime.
- A production build attempted in parallel with `next dev` failed with a
  transient `/_document` module lookup during `.next` collection. The build was
  rerun alone and passed.

## Gaps And Risks

- The app still does not persist provisioned IDs into a hosted session, CLI
  pairing payload, or server-side account store.
- The CLI delegate credential mint endpoint remains separate follow-up work.
- Browser smoke does not complete wallet popup signing; live signing was tested
  through the same server helper with the local Sui signer.
- Mainnet/devnet sponsorship will not work until the OneMem deployment manifest
  has those network addresses and Enoki portal allowlists are configured.

## Follow-ups

- Persist provisioned namespace/Admin/RW IDs for hosted CLI pairing.
- Build the delegate credential mint endpoint on top of a real provisioned
  namespace/RW capability.
- Hosted owner share creation is now handled by the hosted-share slice. Add
  recipient claim/history work after hosted ownership/session persistence is
  defined.
- Keep owner-driven revoke deferred until the Move contract supports it.

## Evidence Log

- Context7 fetched current Enoki sponsored transaction docs and Sui transaction
  signing/building docs.
- Web research checked Enoki sponsored transactions, Enoki SDK examples, Enoki
  typedoc, and Sui transaction auth docs.
- Hosted lint/typecheck/build passed after implementation.
- Hosted browser smoke passed 16 checks and wrote
  `apps/hosted-dashboard/.browser-smoke/hosted-sponsored-provisioning.png`.
- Live testnet smoke minted disposable sponsored objects and parsed object IDs
  from real transaction effects.
