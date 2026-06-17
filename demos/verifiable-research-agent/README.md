# Demo: Verifiable Research Agent

Executable safe demo for OneMem's long-running research-memory wedge.

This demo records a mocked three-day research assistant workflow as three real
OneMem `TraceSession`s on Sui testnet, all in the same namespace:

1. Day 1 source discovery:
   - `search_prediction_market_sources`
   - `write_source_digest_memory`
2. Day 2 paper extraction and synthesis:
   - `extract_market_microstructure_summary`
   - `extract_volatility_surface_summary`
   - `write_research_synthesis_memory`
3. Day 3 synthesis answer:
   - `recall_research_memory`
   - `answer_research_question`

The research tools and runtime are labels. This demo does **not** prove a real
Hermes agent, web search, PDF extraction, MemWal semantic recall, Walrus
plaintext availability, or Seal decryptability.

## Run

From the repo root:

```bash
pnpm --filter @onemem/demo-verifiable-research-agent demo:trace
```

Machine-readable output:

```bash
pnpm --filter @onemem/demo-verifiable-research-agent demo:trace --json
```

The command writes the latest run artifact to:

```text
demos/verifiable-research-agent/out/latest-trace.json
```

That file is ignored by git. It includes the namespace ID, session IDs, call
IDs, verification summaries, memory references, Suiscan URLs, dashboard routes,
public verifier routes, continuity facts, and proof boundaries.

## Requirements

- Sui CLI active environment set to `testnet`.
- A funded testnet signer in `~/.sui/sui_config/sui.keystore`, or an existing
  signer path supported by `@onemem/sdk-ts/runtime`.
- OneMem testnet package IDs populated in `config/networks.json`.

The demo does not require MemWal credentials, an embedding API key, a Hermes
install, real web access, or local PDF files.

## What It Proves

- Three real OneMem TraceSessions and ActionCalls were written on Sui testnet.
- All sessions use the same OneMem namespace.
- Every session independently verifies from Sui events and TraceSession objects.
- The final answer session references source and synthesis memory hashes written
  by earlier sessions.

## What It Does Not Prove

- It does not prove real web search, PDF extraction, or Hermes execution.
- It does not prove MemWal semantic recall.
- It does not prove Walrus plaintext availability or Seal decryptability.
- It does not prove model intent, factual correctness, or tool honesty.

## Checks

```bash
pnpm --filter @onemem/demo-verifiable-research-agent test
pnpm --filter @onemem/demo-verifiable-research-agent typecheck
pnpm --filter @onemem/demo-verifiable-research-agent lint
```

The historical recording script lives at:

```text
docs/05-our-architecture/08-demos-and-tests/demo-verifiable-research-agent.md
```
