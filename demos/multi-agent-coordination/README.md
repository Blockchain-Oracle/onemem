# Demo: Multi-Agent Coordination

Executable safe demo for OneMem's cross-runtime trace-composition wedge.

This demo records a mocked three-agent workflow as real OneMem `TraceSession`s
on Sui testnet, all in the same namespace:

1. Claude Code orchestrator:
   - `plan_multi_agent_coordination`
   - `delegate_market_specialist`
   - `delegate_risk_specialist`
   - `synthesize_specialist_reports`
2. Hermes market specialist:
   - starts from the market delegate `parentCallId`
   - writes a mocked market specialist report
3. CrewAI risk specialist:
   - starts from the risk delegate `parentCallId`
   - writes a mocked risk specialist report

The specialist runtimes are labels in this harness. The protocol proof is real:
the specialist sessions' first calls are emitted with parent call IDs from the
orchestrator session, and every session is verified from Sui events and
TraceSession objects.

## Run

From the repo root:

```bash
pnpm --filter @onemem/demo-multi-agent-coordination demo:trace
```

Machine-readable output:

```bash
pnpm --filter @onemem/demo-multi-agent-coordination demo:trace --json
```

The command writes the latest run artifact to:

```text
demos/multi-agent-coordination/out/latest-trace.json
```

That file is ignored by git. It includes the namespace ID, session IDs, call
IDs, cross-runtime links, verification summaries, report references, Suiscan
URLs, dashboard routes, public verifier routes, and proof boundaries.

## Requirements

- Sui CLI active environment set to `testnet`.
- A funded testnet signer in `~/.sui/sui_config/sui.keystore`, or an existing
  signer path supported by `@onemem/sdk-ts/runtime`.
- OneMem testnet package IDs populated in `config/networks.json`.

The demo does not require real Claude Code hooks, Hermes, CrewAI, LangGraph,
MemWal credentials, embedding API keys, Walrus plaintext reads, or Seal
decryption.

## What It Proves

- Three real OneMem TraceSessions and ActionCalls were written on Sui testnet.
- All sessions use the same OneMem namespace.
- Specialist sessions can be cross-linked to orchestrator delegate calls using
  `parentCallId`.
- Every generated session independently verifies from Sui events and
  TraceSession objects.
- The final orchestrator synthesis references the specialist report hashes and
  source session IDs.

## What It Does Not Prove

- It does not prove real Claude Code hook execution.
- It does not prove real Hermes, CrewAI, or LangGraph execution.
- It does not prove real parallelism.
- It does not prove MemWal semantic recall.
- It does not prove Walrus plaintext availability or Seal decryptability.
- It does not prove that `/trace/[id]` is already a complete cross-session tree
  walker; current dashboard grouping/export can verify multiple sessions.

## Checks

```bash
pnpm --filter @onemem/demo-multi-agent-coordination test
pnpm --filter @onemem/demo-multi-agent-coordination typecheck
pnpm --filter @onemem/demo-multi-agent-coordination lint
```

The historical recording script lives at:

```text
docs/05-our-architecture/08-demos-and-tests/demo-multi-agent-coordination.md
```
