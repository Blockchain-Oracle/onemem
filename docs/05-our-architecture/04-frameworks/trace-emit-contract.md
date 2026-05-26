# Trace Emit Contract — OneMem Frameworks

**Load-bearing file.** The CONSISTENT pattern every framework provider follows for emitting `ActionCall`s. Ensures cross-framework trace composition works in the dashboard `/trace/[id]` view.

---

## The contract

Every framework provider MUST:

1. **Start a `TraceSession`** when the framework's session/conversation/room/run begins
2. **Emit an `ActionCall` (PENDING)** when any tool/model call starts within that session
3. **Close the `ActionCall` (SUCCESS/FAILURE)** when the call completes
4. **End the `TraceSession`** when the framework's session ends
5. **Propagate `parent_call_id`** when the framework spawns a sub-call (agent delegation, tool that calls other tools, etc.)
6. **Use a consistent `tool_namespace`** that identifies the framework + tool source

---

## The canonical fields per `ActionCall`

```python
{
    "tool_name": str,           # the actual tool name (e.g., "Read", "generate", "search")
    "tool_namespace": str,      # framework + tool-source identifier (see table below)
    "input": Any,               # the input payload (will be Seal-encrypted before Walrus upload)
    "parent_call_id": Optional[str],  # cross-call composition
    "label": Optional[str],     # human-readable label for dashboard rendering
}
```

For `close_call`:

```python
{
    "output": Any,              # output payload (Seal-encrypted)
    "events": [                 # optional in-call events (exceptions, warnings, metrics)
        {"kind": "EXCEPTION", "message": str, "timestamp": int},
        {"kind": "METRIC", "message": str, "payload_hash": str, "timestamp": int},
        ...
    ],
}
# status: "SUCCESS" | "FAILURE" | "TIMEOUT" | "CANCELLED"
# level: "DEBUG" | "DEFAULT" | "WARNING" | "ERROR"  (default "DEFAULT")
```

---

## Per-framework `tool_namespace` values (canonical registry)

This is the registry. Stick to these strings exactly so the dashboard can group + filter consistently.

| Framework | tool_namespace value |
|---|---|
| Vercel AI SDK (model call) | `vercel-ai-sdk` |
| Vercel AI SDK (tool call via model) | `vercel-ai-sdk-tool` |
| OpenAI Agents SDK | `openai-agents-tool` |
| OpenAI Agents SDK (OneMem-exposed tool) | `onemem-builtin` |
| CrewAI (task execute) | `crewai-task` |
| CrewAI (agent tool) | `crewai-tool` |
| LiveKit (voice transcript) | `livekit-voice` |
| LiveKit (tool call) | `livekit-tool` |
| ElevenLabs (voice transcript) | `elevenlabs-voice` |
| ElevenLabs (tool call) | `elevenlabs-tool` |
| Hermes (agent tool) | `hermes-tool` |
| Hermes (delegation marker) | `hermes-runtime` |
| Claude Code (built-in tool) | `claude-code-builtin` |
| OpenClaw (built-in tool) | `openclaw-builtin` |
| MCP-served tool | `mcp:<server-name>` (e.g., `mcp:filesystem`) |
| OneMem-exposed MCP tool | `onemem-mcp` |

---

## Cross-framework trace composition (the killer pattern)

The dashboard `/trace/[id]` route renders the FULL call tree across frameworks. This works because:

1. **Shared `namespace_id`** — all frameworks in one user's setup emit to the same namespace
2. **Shared `parent_call_id`** — set via env var propagation (`ONEMEM_PARENT_TRACE_SESSION_ID` + `ONEMEM_PARENT_CALL_ID`) when one framework spawns another
3. **Stable `agent_id`** per framework instance — lets dashboard color-code calls by agent

### Example: Vercel AI SDK → spawns CrewAI sub-task → CrewAI agent calls LangChain tool

```
TraceSession: A1 (namespace NS1, agent "next-app")
  └─ ActionCall: vercel-ai-sdk / model.generate (root)
      └─ Output: "I'll delegate to CrewAI for the research."
      └─ Emits delegation marker:
         ActionCall: crewai-runtime / spawn_crew (parent_call_id=root)
             ↓ env: ONEMEM_PARENT_CALL_ID=spawn_crew, ONEMEM_PARENT_TRACE_SESSION_ID=A1

TraceSession: C1 (same namespace NS1, agent "crewai-crew")
  └─ ActionCall: crewai-task / task.research_topic (parent_call_id=spawn_crew, namespace=NS1)
      └─ ActionCall: crewai-tool / langchain.SerpAPISearch (parent_call_id=task.research_topic)
      └─ ActionCall: onemem-builtin / save_memory (parent_call_id=task.research_topic)
  └─ Session ends
```

Dashboard renders this as ONE tree (sessions A1 + C1 visually unified via `parent_call_id`), with color bands per `agent_id`. Cryptographically verifiable end-to-end.

---

## Env var propagation contract

When a framework launches a sub-agent (or sub-process), it MUST set:

```bash
ONEMEM_NAMESPACE_ID=<current namespace_id>
ONEMEM_PARENT_TRACE_SESSION_ID=<current session_id>
ONEMEM_PARENT_CALL_ID=<the call_id that represents the spawn point>
```

The child process's OneMem provider reads these env vars on init + wires its first ActionCall's `parent_call_id` accordingly.

This is the ONLY mechanism for cross-process trace composition. Don't reinvent it per framework.

---

## Async patterns per framework

| Framework | Pattern |
|---|---|
| Vercel AI SDK | `wrapGenerate` / `wrapStream` middleware — await both append + close before returning |
| OpenAI Agents SDK | function tools execute synchronously from agent's POV — emit append + close in tool body |
| CrewAI | task callbacks (when available) emit append on start + close on end. Fallback: just trace save/search calls |
| LiveKit | per-tool-call hooks; emit append+close pair around tool execution |
| ElevenLabs | same as LiveKit |
| Hermes | `handle_tool_call` emits append; tool return emits close; `on_delegation` emits delegation marker |
| Claude Code | PreToolUse emits append; PostToolUse emits close |
| OpenClaw | agent_turn collects pending; agent_end closes each |

All providers must handle: relayer unreachable → silent skip (don't block user). Same pattern as claude-mem's worker-down behavior.

---

## What if a call has no clear parent?

If a framework operation has no preceding `ActionCall` in the session (e.g., the first call), `parent_call_id = None` and `prev_hash = session.merkle_root` (the initial empty root). This is normal — the call becomes the `root_call_id` of the session.

---

## Performance budget per emit

| Op | Budget (p95) | Notes |
|---|---|---|
| Seal encryption | <50ms | local; small payloads |
| Walrus upload | <500ms | depends on relayer queue |
| Sui PTB execution | <2s | mainnet finality ~1s |
| Total append_call | <3s | the user-visible latency |
| Total close_call | <3s | same |

For latency-sensitive flows (voice agents), providers can fire-and-forget: return immediately, let the SDK queue the write. Trade-off: if write fails, the trace has a gap.

---

## Cross-references

- `README.md` — framework matrix
- per-framework docs (vercel-ai-provider.md / openai-agents-tools.md / etc) — implementations of this contract
- `../01-protocol/events-and-attestation.md` — events emitted on the chain side
- `../01-protocol/data-model.md` — `ActionCall` struct fields
- `../02-sdks/shared-api-surface.md` — `trace.appendCall` / `closeCall` API
- `../03-runtimes/hermes-plugin.md` — `on_delegation` for cross-runtime parent setup
