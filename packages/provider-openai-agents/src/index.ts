// @onemem/openai-agents — record OpenAI Agents SDK runs as verifiable on-chain
// OneMem TraceSessions (Sui + Walrus + Seal).
//
// Auto-capture via the Runner lifecycle events (agent_tool_start/end, agent_end)
// — developed against @openai/agents@0.11. Each run is buffered per RunContext and
// flushed as one Merkle-chained TraceSession at agent_end via the shared
// `createTraceRecorder` (provisioning + fire-and-forget live in sdk-ts/runtime).
//
// Trace recording is event-driven. Explicit memory recall/capture is available
// through `createOneMemMemory(...)`; automatic extraction and memory tools are
// separate product layers.

import {
  createMemoryRecorder,
  createTraceRecorder,
  injectMemories,
  type MemoryRecorder,
  type MemoryRecorderOptions,
  type RuntimeCall,
  type TraceRecorderOptions,
} from "@onemem/sdk-ts/runtime";
import { Runner } from "@openai/agents";

export type OneMemTraceOptions = TraceRecorderOptions;
export type OneMemMemoryOptions = MemoryRecorderOptions;
export { injectMemories };

interface RunState {
  calls: RuntimeCall[];
  pending: Map<string, RuntimeCall>;
}

// Loose views of the @openai/agents payload shapes the listeners read.
type ToolLike = { name?: string };
type ToolCallLike = { callId?: string; id?: string; name?: string; arguments?: unknown };

/**
 * Attach OneMem trace recording to an OpenAI Agents `Runner`. Each run's tool
 * calls + final output are buffered (per RunContext, so concurrent runs are
 * isolated) and flushed as ONE verifiable on-chain TraceSession at agent_end.
 * Recording is fire-and-forget + zero-config. Returns the runner for chaining.
 */
export function attachOneMem(runner: Runner, opts: OneMemTraceOptions = {}): Runner {
  const recorder = createTraceRecorder({
    ...opts,
    agentId: opts.agentId ?? "openai-agents",
    environment: opts.environment ?? "openai-agents",
    label: opts.label ?? "openai-agents",
  });

  // Per-run buffer keyed by RunContext object identity (WeakMap → no leak if a
  // run errors before agent_end).
  const runs = new WeakMap<object, RunState>();
  const stateFor = (ctx: object): RunState => {
    let s = runs.get(ctx);
    if (!s) {
      s = { calls: [], pending: new Map() };
      runs.set(ctx, s);
    }
    return s;
  };
  const callIdOf = (tc: ToolCallLike): string | undefined => tc.callId ?? tc.id;

  // The Runner emits these events SYNCHRONOUSLY inside its run loop, so an
  // uncaught throw here would propagate into — and corrupt — the host run.
  // Guard every listener body to keep the never-break-the-host contract.
  const warn = (m: string) => opts.logger?.warn?.(m) ?? console.warn(m);
  const guard =
    <A extends unknown[]>(name: string, fn: (...a: A) => void) =>
    (...a: A): void => {
      try {
        fn(...a);
      } catch (err) {
        warn(
          `[onemem] ${name} handler failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    };

  runner.on(
    "agent_tool_start",
    guard("agent_tool_start", (context, _agent, tool, details) => {
      const s = stateFor(context as object);
      const tc = (details?.toolCall ?? {}) as ToolCallLike;
      const call: RuntimeCall = {
        toolName: (tool as ToolLike)?.name ?? tc.name ?? "tool",
        toolNamespace: "openai-agents",
        input: tc.arguments ?? tc,
        output: null,
      };
      s.calls.push(call);
      const id = callIdOf(tc);
      if (id) s.pending.set(id, call);
    }),
  );

  runner.on(
    "agent_tool_end",
    guard("agent_tool_end", (context, _agent, _tool, result, details) => {
      const s = stateFor(context as object);
      const id = callIdOf((details?.toolCall ?? {}) as ToolCallLike);
      const call = id ? s.pending.get(id) : undefined;
      if (call) {
        call.output = result;
        if (id) s.pending.delete(id);
      }
    }),
  );

  // Fires once per agent — in a multi-agent/handoff run each agent flushes its
  // own trace (cross-agent linking is a tracked follow-up).
  runner.on(
    "agent_end",
    guard("agent_end", (context, _agent, output) => {
      const s = stateFor(context as object);
      s.calls.push({
        toolName: "agent.response",
        toolNamespace: "openai-agents",
        input: null,
        output,
      });
      const calls = s.calls.slice();
      runs.delete(context as object);
      recorder.record(calls);
    }),
  );

  return runner;
}

/** Convenience: a fresh Runner with OneMem trace recording already attached. */
export function createTracedRunner(opts: OneMemTraceOptions = {}): Runner {
  return attachOneMem(new Runner(), opts);
}

/**
 * OneMem memory for an OpenAI Agents app — the Mem0-mirror half. Wrap a run:
 *
 *   const mem = createOneMemMemory();
 *   const input = await mem.recallInto(userText);   // search → inject context
 *   const res = await runner.run(agent, input);
 *   await mem.capture(`${userText}\n${res.finalOutput}`);  // store the exchange
 *
 * Memory injection is explicit (it modifies the agent input), so it's a wrapper
 * rather than an event listener like trace recording. Defensive: recall returns
 * the input unchanged on failure; capture is fire-and-forget.
 */
export function createOneMemMemory(opts: OneMemMemoryOptions = {}): MemoryRecorder & {
  /** Search memories for `input` and prepend them as context. Returns `input` unchanged if none. */
  recallInto(input: string, topK?: number): Promise<string>;
} {
  const recorder = createMemoryRecorder({
    ...opts,
    logger: opts.logger ?? { warn: (m) => console.warn(m) },
  });
  return {
    ...recorder,
    async recallInto(input: string, topK?: number): Promise<string> {
      return injectMemories(input, await recorder.recall(input, topK));
    },
  };
}
