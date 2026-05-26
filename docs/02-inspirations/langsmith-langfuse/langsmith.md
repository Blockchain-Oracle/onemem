---
product: LangSmith
vendor: LangChain Inc.
license: Proprietary (closed-source SaaS + self-hosted enterprise tier)
docs_root: https://docs.langchain.com/langsmith
sdk_repo: https://github.com/langchain-ai/langsmith-sdk (Apache-2.0, Python+TS client only)
status: GA, dominant LangChain/LangGraph trace viewer
captured: 2026-05-23
purpose: Trace-data-model + UX reference for OneMem `/trace/[id]` route
---

# LangSmith — trace viewer reference for OneMem

## What it is (factual)

LangSmith is LangChain Inc.'s commercial LLM observability SaaS. Closed-source server; open-source Python + TypeScript clients (`langsmith-sdk`). Tightly coupled to the LangChain ecosystem (LangChain, LangGraph, LangChain.js) but framework-agnostic via `@traceable`. The product surface is: (1) trace ingestion + viewer, (2) prompt playground + prompt registry, (3) dataset + experiment runner with LLM-as-judge evals, (4) annotation queues for human feedback, (5) prebuilt + custom dashboards over trace data. Pricing is per-seat + per-trace-stored. Self-hosted offered to enterprise.

---

## Trace data model

LangSmith's atom is the **Run** — not "Span". From `langsmith-sdk/python/langsmith/schemas.py`:

```python
class RunBase(BaseModel):
    """A Run is a span representing a single unit of work or operation within your LLM app.
    This could be a single call to an LLM or chain, to a prompt formatting call,
    to a runnable lambda invocation. If you are familiar with OpenTelemetry,
    you can think of a run as a span."""

    id: UUID                              # unique run id
    name: str                             # human-readable name
    start_time: datetime
    run_type: str                         # "tool" | "chain" | "llm" | "retriever"
                                          # | "embedding" | "prompt" | "parser"
    end_time: Optional[datetime] = None
    extra: Optional[dict] = Field(default_factory=_default_extra)  # arbitrary metadata
    error: Optional[str] = None
    serialized: Optional[dict] = None     # serialized callable (for replay)
    events: Optional[list[dict]] = None   # ordered event log (start/end/custom)
    inputs: dict = Field(default_factory=dict)
    outputs: Optional[dict] = None
    reference_example_id: Optional[UUID] = None
    parent_run_id: Optional[UUID] = None  # → forms the tree
    tags: Optional[list[str]] = None

class Run(RunBase):
    session_id: Optional[UUID] = None     # project (called "session" internally) FK
    child_run_ids: Optional[list[UUID]] = None
    child_runs: Optional[list["Run"]] = None
    feedback_stats: Optional[dict[str, Any]] = None
    app_path: Optional[str] = None        # relative URL inside LangSmith app
    status: Optional[str] = None          # "success" | "error" | "pending"
    prompt_tokens: Optional[int] = None
    completion_tokens: Optional[int] = None
    total_tokens: Optional[int] = None
    prompt_token_details: Optional[dict[str, int]] = None
    completion_token_details: Optional[dict[str, int]] = None
    first_token_time: Optional[datetime] = None   # TTFT
    total_cost: Optional[Decimal] = None
    prompt_cost: Optional[Decimal] = None
    completion_cost: Optional[Decimal] = None
```

**Trace vs Run**: A *Trace* is "a collection of runs for a single operation" — i.e., the connected component of runs sharing a root `parent_run_id = None` ancestor. Traces cap at 25,000 runs each (LangSmith docs). There is no separate `Trace` row in the schema — the trace IS the set of runs that share a root run id.

**Project (also called "Session" in the schema, confusingly)**: a `session_id: UUID` field on every Run. UI talks "Projects"; DB calls it `session_id`. A project is the workspace-scoped container for related applications' traces.

**Parent semantics**: `parent_run_id` is a single nullable UUID pointing to the immediate parent. There is no depth field, no merkle linkage, no signature. The full tree is reconstructed at read time. `child_run_ids` is populated by the server on read for convenience but is not the source of truth.

**Run types** are a small open enum (the `RunTypeEnum` exists but is marked deprecated — server now accepts arbitrary strings):

```python
class RunTypeEnum(str, Enum):
    """(Deprecated) Enum for run types. Use string directly."""
    tool = "tool"
    chain = "chain"
    llm = "llm"
    retriever = "retriever"
    embedding = "embedding"
    prompt = "prompt"
    parser = "parser"
```

**Feedback** is a separate first-class object attached to a Run by `run_id` — it holds a `key` (e.g., "correctness"), a `score`, optional `value`, `comment`, `correction`, and a `source` enum (`MODEL` / `API` / `APP` / `RUN_EVALUATOR` / `LANGFUSE`).

---

## OpenTelemetry compatibility

LangSmith is **not OTLP-native**. The docs say "If you are familiar with OpenTelemetry, you can think of a LangSmith trace as a collection of spans" — purely as a mental model. The wire protocol is LangSmith's own REST/multipart ingestion endpoint (`/runs/multipart`), not OTLP. No GenAI semantic-convention attribute mapping. Auto-instrumentation comes from LangChain's `BaseCallbackHandler` system, not OTel instrumentation libraries. Self-hosted LangSmith ships an OTel-compatible export *out* (mid-2025) but ingestion remains proprietary.

---

## API surface (instrumentation)

Three primary patterns, all from `langsmith` Python / `langsmith` JS:

### 1. `@traceable` decorator (Python)

```python
from openai import OpenAI
from langsmith.wrappers import wrap_openai
from langsmith import traceable

client = wrap_openai(OpenAI())

@traceable(run_type="tool")
def get_context(question: str) -> str:
    return "LangSmith traces are stored for 14 days on the Developer plan."

@traceable
def assistant(question: str) -> str:
    context = get_context(question)
    response = client.chat.completions.create(
        model="gpt-5.4-mini",
        messages=[
            {"role": "system", "content": f"Answer using the context below.\n\nContext: {context}"},
            {"role": "user", "content": question},
        ],
    )
    return response.choices[0].message.content
```

`wrap_openai` monkey-patches the OpenAI client so every `chat.completions.create` becomes a child `llm` run of whatever `@traceable` is on the call stack. Nesting happens via Python `contextvars` — no explicit parent passing.

### 2. `@traceable` with tags + metadata

```python
@traceable(
    tags=["openai", "chat"],
    metadata={"foo": "bar"}
)
def invoke_runnnable(question, context):
    result = chain.invoke({"question": question, "context": context})
    return "The response is: " + result
```

Every metadata key and every tag becomes a first-class filter dimension in the UI.

### 3. `traceable()` higher-order function (TypeScript)

```typescript
import { traceable } from "langsmith/traceable";
import { ChatOpenAI } from "@langchain/openai";

const main = traceable(
  async (input: { question: string; context: string }) => {
    const callbacks = await getLangchainCallbacks();
    const response = await chain.invoke(input, { callbacks });
    return response;
  },
  { name: "main" }
);
```

### 4. `RunTree` — manual run construction (rare; used for bridging)

```typescript
const tracedChild = traceable((input: string) => `Child Run: ${input}`, {
  name: "Child Run",
});

const parrot = new RunnableLambda({
  func: async (input: { text: string }, config?: RunnableConfig) => {
    return await tracedChild(input.text);
  },
});
```

### 5. Env vars to enable everything

```bash
export LANGSMITH_TRACING=true
export LANGSMITH_API_KEY="..."
export LANGSMITH_PROJECT="my-project"   # optional; defaults to "default"
```

The Python SDK auto-batches runs into 1-second multipart-form flushes against `api.smith.langchain.com/runs/multipart`. No code changes beyond the decorator.

---

## Dashboard UX — every main screen

### Trace list view (`/projects/p/<project-id>/traces`)
- Columns: **Name** (root run name), **Run Type** (chain/llm/tool/...), **Start Time** (relative), **Latency** (ms), **Tokens** (prompt/completion/total), **Cost** ($), **Error** (red badge if any), **Feedback** (aggregated thumbs/scores), **Tags** (chips).
- Top filter bar: free-text search over inputs/outputs, plus structured filters for: `run_type`, `tags`, `metadata.<key>=<value>`, `latency >`, `error_only`, `has_feedback`, time-range picker.
- Group-by toggle: by `metadata.user_id`, by `tag`, by date. Group rows expand to show the underlying runs.
- Bulk-select → "Add to dataset" or "Annotate".

### Trace detail view (`/projects/p/<id>/r/<run-id>`)
- Left panel: collapsible **tree** of runs, indented by `parent_run_id` depth. Each node shows: icon-by-run-type, name, latency badge, token badge, status dot (green/red/grey-spinner).
- Center panel: **span detail** for the currently-selected run. Tabs: `Inputs` (JSON-pretty-printed), `Outputs`, `Metadata`, `Feedback`, `Logs` (stdout/stderr captured), `Run` (raw run object).
- LLM runs additionally render: side-by-side **Messages** view (system/user/assistant bubbles) instead of raw JSON. Token-stream replay if the run was streamed.
- Right rail (collapsible): trace-level metadata, total cost, total latency, error count, "Open in Playground" button (opens the LLM call in the prompt playground with the same model+prompt prefilled).

### Span detail
- For `llm` runs: model name, temperature, max_tokens, the full prompt template variables, token counts (prompt/completion + cache_read/cache_write detail), cost breakdown, TTFT (`first_token_time - start_time`), finish reason.
- For `tool` runs: tool name, tool input JSON, tool output JSON or error stacktrace.
- For `retriever` runs: query, list of returned documents with scores + content snippets.
- For any run: copy-as-curl, copy run ID, share button (per-trace public link).

### Replay / debug / diff
- **No replay-from-trace** of an entire agent run. The only "replay" surface is the **Prompt Playground**: clicking "Open in Playground" on an `llm` run lets you re-run that *single* LLM call against a different model/temperature/prompt and see the new output. There is no "replay this whole trace step-by-step" mode.
- **Comparison view** in Experiments: side-by-side run outputs for the same dataset example across different runs. Diff is rendered as left/right panels, not a unified diff.

### Eval / scoring
- **Datasets**: collections of `{inputs, outputs}` example pairs. Built from production traces (right-click any trace → "Add to dataset") or uploaded as CSV/JSON.
- **Experiments**: run a function over every example in a dataset, then apply 0+ evaluators (LLM-as-judge, exact-match, regex, custom Python). Each example becomes one trace; aggregate scores roll up.
- **Annotation Queues**: shove flagged runs into a review pool; human annotator sees the run, picks a score from a configured `ScoreConfig` (CATEGORICAL/NUMERIC/BOOLEAN/TEXT), comment, optional correction.
- **Online evaluators**: schedule an LLM-judge to score every Nth production trace; results show up as feedback.

### Sharing / export
- Per-trace **public link**: open trace → vertical-dot menu → "Share" → modal with copyable URL. "Shared traces are accessible to anyone with the link, even without a LangSmith account." Viewer-only; no edits. Revocable from Settings → Shared URLs.
- Bulk export: dataset CSV/JSON download. No way to export raw run blobs in bulk through the UI; must use the SDK + REST API.

### Project / workspace organization
- **Workspace** > **Project** (`session_id`) > **Trace** (root run id) > **Run** (any node).
- Workspace = billing + RBAC boundary. Project = app-level isolation. Each project has its own prebuilt dashboard (trace count, error rate, p50/p99 latency, token usage, cost over time) and supports custom dashboards (configurable chart collection).

---

## What we'd borrow for OneMem

1. **Run tree on left, span detail on right** — the canonical two-pane layout. Don't reinvent. `/trace/[id]` mirrors this exactly.
2. **Run-type icons + colored dot + latency badge inline on every tree node** — visual density makes 100-node trees scannable.
3. **Messages-view for LLM spans** (system/user/assistant bubbles) instead of raw JSON — non-engineers can't read prompt JSON.
4. **Tabbed span detail panel** (`Inputs` / `Outputs` / `Metadata` / `Logs` / raw) — every node gets the same tab shape regardless of `tool_kind`.
5. **Per-trace public link as a first-class UX** — the share button must be at the top of the trace detail page, not buried in a menu. OneMem's NFT-capability-mint flow replaces the SaaS link with on-chain capability transfer but the user-facing affordance is the same.
6. **Group-by-metadata in the trace list** — OneMem's `agent_id` and `runtime` fields are the natural group-by keys.
7. **Feedback as a separate object attached by `run_id`** — keeps the run immutable; lets users score someone else's trace without mutation. Maps cleanly onto a Sui pattern (feedback as a child object of the `ActionCall`).
8. **Run-type as an open string** — OneMem's `tool_kind` should follow this; closed enums break when a new runtime ships an unexpected category.

---

## Where LangSmith falls short for our use case

- **No cryptographic verifiability.** Runs are server-mutable. The dashboard is the source of truth; there is no way for a viewer to prove a trace was not edited after the fact.
- **No on-chain attestation.** Traces live in LangSmith's Postgres+ClickHouse. Adding chain-of-custody is a multi-quarter retrofit; their architecture has no hash-chain anywhere.
- **No cross-vendor portability.** A trace is a LangSmith-account-scoped object; transferring ownership means inviting another user to the workspace. There is no "send this trace to that person" primitive.
- **No cross-runtime composition.** A LangChain trace and a separate Python script's trace are two unrelated traces unless the developer manually wires `parent_run_id` across processes — and even then both processes must hold LangSmith credentials. OneMem's content-addressed `parent_call_id` (referenced by `content_hash`, not a server-issued UUID) works across runtimes without coordination.
- **Plaintext storage.** Inputs/outputs are stored unencrypted in LangSmith's DB. Customers with regulatory needs must use the self-hosted enterprise tier, which is gated by sales.
- **Vendor-controlled.** Pricing per trace; retention 14 days on Developer plan; project deletion is irreversible and final.
- **Engineer-shaped UX.** Filter chips, JSON tabs, callback-handler vocabulary. The dashboard assumes you wrote the agent. OneMem's persona is the *user* of someone else's agent.

---

## Sources

- LangSmith concepts: https://docs.langchain.com/langsmith/observability-concepts (redirected from docs.smith.langchain.com)
- LangSmith trace logging: https://docs.langchain.com/langsmith/trace-with-langchain
- LangSmith quickstart: https://docs.langchain.com/langsmith/observability-quickstart
- LangSmith dashboards: https://docs.langchain.com/langsmith/dashboards
- LangSmith share-trace: https://docs.langchain.com/langsmith/share-trace
- Run schema (source of truth): https://github.com/langchain-ai/langsmith-sdk/blob/main/python/langsmith/schemas.py
- LangSmith product page: https://www.langchain.com/langsmith/observability
- Vercel AI SDK ↔ LangSmith adapter: https://ai-sdk.dev/v4/providers/observability/langsmith
- LangSmith evaluation product: https://www.langchain.com/langsmith/evaluation
- AI.cc 2026 LangSmith guide: https://www.ai.cc/blogs/how-to-use-langsmith-2026-complete-guide/
