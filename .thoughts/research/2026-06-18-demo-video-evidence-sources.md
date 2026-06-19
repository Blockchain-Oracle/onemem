# Reality Research: Demo Video Evidence Sources

## Scope

Checked whether the four existing executable demos can supply real, truthful
inputs for the long OneMem demo video.

## Sources Checked

- `demos/switch-laptops/package.json`
- `demos/switch-laptops/README.md`
- `demos/switch-laptops/out/latest-trace.json`
- `demos/agent-sends-money/package.json`
- `demos/agent-sends-money/README.md`
- `demos/agent-sends-money/out/latest-trace.json`
- `demos/verifiable-research-agent/package.json`
- `demos/verifiable-research-agent/README.md`
- `demos/verifiable-research-agent/out/latest-trace.json`
- `demos/multi-agent-coordination/package.json`
- `demos/multi-agent-coordination/README.md`
- `demos/multi-agent-coordination/out/latest-trace.json`

## Verified Facts

- All four demos expose a `demo:trace` script.
- The demos are explicitly safe mocked workflows, not proof of real hooks,
  real payments, real web research, real MemWal semantic recall, or real
  Walrus/Seal plaintext availability.
- The existing `out/latest-trace.json` artifacts contain real testnet evidence:
  namespace IDs, session IDs, call names, verification `ok` flags, dashboard
  paths, public verifier paths, Suiscan URLs, and proof boundaries.
- `switch-laptops` has two verified sessions in one namespace, modeling
  runtime continuity.
- `agent-sends-money` has one verified session with four payment-flow calls:
  `resolve_suins`, `fetch_pyth_oracle`, `check_gas_estimate`, and
  `execute_payment`.
- `verifiable-research-agent` has three verified sessions in one namespace,
  modeling research memory across days.
- `multi-agent-coordination` has three verified sessions in one namespace and
  cross-runtime parent/child links from the orchestrator to specialists.

## Inferences

- The long demo video can truthfully show these artifacts as recorded trace
  evidence panels before real screen recordings exist.
- The final footage slots still need UI or terminal recordings if the demo is
  expected to show live product operation rather than evidence visualization.

## Unknowns And Questions

- Whether Abu wants the final submission to use mostly UI screen recordings,
  mostly generated evidence visualization, or a hybrid.
- Whether fresh testnet traces should be generated immediately before the final
  video submission.

## Not Included

- No new testnet demo run was executed in this research pass.
- No claim is made that the mocked demo labels prove real Claude Code, Hermes,
  CrewAI, OpenClaw, MemWal, Walrus plaintext, Seal decrypt, or payment behavior.
