# Research: Multi-Agent Coordination Executable Demo

Date: 2026-06-17

## Question

What is the smallest honest implementation that turns the pending
multi-agent coordination storyboard into an executable OneMem demo?

## Current Reality

- `demos/multi-agent-coordination` only contains a short README stub.
- The architecture demo doc still describes an aspirational Claude Code ->
  Hermes -> LangGraph run with a single dashboard tree.
- LangGraph provider support is explicitly caveated as deferred in the same
  demo doc. The doc recommends substituting a v0.1-supported framework such as
  CrewAI for the third layer.
- The Move protocol and SDK already support cross-runtime composition through
  `ActionCall.parent_call_id`.
- The dashboard currently marks a call as linked when its `parent_call_id` is
  present, and grouped session replay/export can verify several TraceSessions
  together. It is not yet a full cross-session tree walker for `/trace/[id]`.
- Existing executable demos use the same pattern:
  - deterministic `trace-model.ts` plus node:test tests;
  - live `mock-*-trace.ts` command that writes real Sui testnet traces;
  - explicit proof boundaries that separate real chain proof from mocked
    runtime/tool behavior.

## Decision

Build a private workspace package that records a mocked three-agent workflow:

1. Claude Code orchestrator opens a coordination session.
2. The orchestrator emits delegate calls for two specialists.
3. A Hermes market specialist session starts with its first call linked to the
   market delegate call.
4. A CrewAI risk specialist session starts with its first call linked to the
   risk delegate call.
5. The orchestrator records a final synthesis that references both specialist
   report hashes.

This proves protocol-level cross-session stitchability and per-session Merkle
verification on Sui testnet. It does not prove real Claude Code hooks, real
Hermes, real CrewAI, LangGraph, real parallel execution, or a finished
multi-session dashboard tree.

## Source References

- `demos/multi-agent-coordination/README.md`
- `docs/05-our-architecture/08-demos-and-tests/demo-multi-agent-coordination.md`
- `docs/05-our-architecture/08-demos-and-tests/README.md`
- `contracts/onemem/sources/trace.move`
- `contracts/onemem/tests/integration_tests.move`
- `packages/sdk-ts/src/traces.ts`
- `packages/dashboard/lib/trace.ts`
- `packages/dashboard/lib/session-export.ts`
- `demos/agent-sends-money`
- `demos/switch-laptops`
- `demos/verifiable-research-agent`

## Risks

- Overclaim risk: the original storyboard says "one unified trace tree." The
  executable demo must say "cross-session parent links plus grouped
  verification" until a real cross-session tree walker exists.
- Runtime proof risk: labels such as Claude Code, Hermes, and CrewAI are mocked
  in this harness. Live runtime/plugin proof needs separate integration tests.
- Network cost risk: live testnet writes mint real objects and consume testnet
  gas, so the command must fail closed outside testnet.
