# Research: Verifiable Research Agent Executable Demo

Date: 2026-06-17

## Question

The demo matrix still marks "Verifiable research agent" as pending. What is the
smallest honest executable slice that turns this from storyboard-only into a
repeatable OneMem testnet proof?

## Sources Inspected

- `demos/verifiable-research-agent/README.md`
- `docs/05-our-architecture/08-demos-and-tests/demo-verifiable-research-agent.md`
- `demos/agent-sends-money/*`
- `demos/switch-laptops/*`
- `docs/05-our-architecture/08-demos-and-tests/README.md`
- `tests/structure.test.ts`

## Current State

- `demos/verifiable-research-agent/README.md` is currently a short pointer to
  the historical storyboard.
- The storyboard describes a three-day Hermes research assistant that searches,
  reads PDFs, writes memory, and answers a synthesis question from accumulated
  memory.
- The existing executable demos use a safer, narrower pattern:
  - deterministic mocked call model,
  - private workspace package,
  - `demo:trace` command,
  - Sui testnet-only guard,
  - real OneMem `TraceSession` / `ActionCall` writes,
  - verification from chain data,
  - JSON artifact under ignored `out/`,
  - explicit proof boundaries.

## Chosen Slice

Build `demos/verifiable-research-agent` as a private workspace package that
records three day-labeled mocked research sessions in one OneMem namespace:

1. Day 1 source discovery:
   - `search_prediction_market_sources`
   - `write_source_digest_memory`
2. Day 2 paper extraction:
   - `extract_market_microstructure_summary`
   - `extract_volatility_surface_summary`
   - `write_research_synthesis_memory`
3. Day 3 synthesis answer:
   - `recall_research_memory`
   - `answer_research_question`

Each session verifies independently from Sui events and the `TraceSession`
object. The output artifact shows continuity through shared memory references
and same namespace.

## Why This Is The Right Next Step

- It closes one of the remaining visible demo-matrix pending rows.
- It reuses the proven executable-demo architecture instead of building a new
  test harness.
- It gives demo-day material with stronger product narrative than a single
  trace: accumulated context over time.
- It avoids false claims about real web/PDF/Hermes/MemWal behavior.

## Non-Goals

- No real web search.
- No real PDF ingestion.
- No real Hermes runtime execution.
- No real MemWal semantic recall.
- No Walrus plaintext or Seal decrypt proof.
- No 142-memory / 47-session high-volume stress run.
- No final video production.

