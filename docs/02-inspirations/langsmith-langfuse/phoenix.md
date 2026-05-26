---
product: Arize Phoenix
vendor: Arize AI
license: ELv2 (server) + Apache-2.0 (Python/TS subpackages + OpenInference spec)
docs_root: https://arize.com/docs/phoenix
server_repo: https://github.com/Arize-ai/phoenix
openinference_repo: https://github.com/Arize-ai/openinference
status: GA, runs locally (notebook / docker / k8s) or on Phoenix Cloud
captured: 2026-05-23
purpose: Trace-data-model + UX reference for OneMem `/trace/[id]` route
---

# Arize Phoenix — trace viewer reference for OneMem

## What it is (factual)

Arize Phoenix is the open-source LLM observability stack from Arize AI. Distinct from the other two products in one fundamental way: **Phoenix is OpenTelemetry/OpenInference-native end-to-end**. There is no proprietary span format — Phoenix is an OTel collector + a UI over OpenInference-conventioned spans. The platform comprises: the Phoenix server (Python, runs as `pip install arize-phoenix` → in-process; or container; or hosted at `app.phoenix.arize.com`), a family of lightweight Python + TS subpackages (`arize-phoenix-otel`, `arize-phoenix-client`, `arize-phoenix-evals`, `@arizeai/phoenix-otel`, `@arizeai/phoenix-mcp`, `@arizeai/phoenix-cli`), and the **OpenInference** semantic-convention spec + auto-instrumentation library family (`openinference-instrumentation-openai`, `-langchain`, `-llama-index`, `-crewai`, etc — 25+ frameworks).

---

## Trace data model

Phoenix's data model **IS** the OpenTelemetry data model, with OpenInference semantic conventions layered on top. There is no Phoenix-specific schema for spans — they're vanilla OTel spans with well-known attribute names.

### Span (OpenTelemetry shape, Phoenix-stored)

| Field           | Type                                                          | Notes                                                       |
| --------------- | ------------------------------------------------------------- | ----------------------------------------------------------- |
| `name`          | string                                                        | e.g. `"llm"`, `"retrieve"`, `"agent.run"`                  |
| `context`       | `{trace_id, span_id, trace_state}`                            | OTel SpanContext                                            |
| `kind`          | `SpanKind`                                                    | OTel kind (usually `INTERNAL` for LLM workloads)            |
| `parent_id`     | string \| null                                                | Parent span_id; null = root                                 |
| `start_time`    | ISO 8601                                                      |                                                             |
| `end_time`      | ISO 8601                                                      |                                                             |
| `status`        | `{status_code: "OK" \| "ERROR" \| "UNSET", description?}`     |                                                             |
| `attributes`    | `Map<string, AttributeValue>`                                 | OpenInference attributes live here (`llm.*`, `tool.*`, ...) |
| `events`        | `Array<{name, timestamp, attributes}>`                        | OTel events; Phoenix uses for exception capture             |
| `links`         | `Array<{context, attributes}>`                                | OTel links (cross-trace references)                         |
| `resource`      | `{attributes, schema_url}`                                    | OTel resource (service.name, etc)                           |

### OpenInference span classification — `openinference.span.kind` attribute

```
LLM | RETRIEVER | RERANKER | EMBEDDING | CHAIN | TOOL | AGENT | GUARDRAIL | EVALUATOR | UNKNOWN
```

This is **Phoenix's equivalent of `run_type` (LangSmith) / `type` (Langfuse)** — a single string attribute on every span.

### Attribute conventions (subset — full spec at github.com/Arize-ai/openinference/spec)

```
# LLM spans
llm.model_name
llm.provider
llm.system
llm.invocation_parameters
llm.input_messages.[i].message.role
llm.input_messages.[i].message.content
llm.output_messages
llm.prompts
llm.choices
llm.function_call
llm.finish_reason
llm.prompt_template.template
llm.prompt_template.variables
llm.prompt_template.version
llm.token_count.prompt
llm.token_count.completion
llm.token_count.total
llm.token_count.prompt_details.cache_read
llm.token_count.prompt_details.cache_write
llm.token_count.prompt_details.audio
llm.token_count.completion_details.reasoning
llm.token_count.completion_details.audio
llm.cost.prompt
llm.cost.completion
llm.cost.total
llm.cost.prompt_details.cache_read
llm.cost.prompt_details.cache_write
llm.cost.prompt_details.audio
llm.cost.completion_details.reasoning
llm.cost.completion_details.audio
llm.tools

# RETRIEVER spans
retrieval.documents.[i].document.id
retrieval.documents.[i].document.score
retrieval.documents.[i].document.content
retrieval.documents.[i].document.metadata

# TOOL spans
tool.name
tool.id
tool.description
tool.json_schema
tool.parameters

# EMBEDDING spans
embedding.model_name
embedding.text
embedding.vector
embedding.embeddings
embedding.invocation_parameters

# AGENT spans
agent.name

# Generic (all spans)
input.value
output.value
metadata
session.id
user.id
tag.tags
openinference.span.kind
```

**Parent semantics:** standard OTel — `parent_id` references another span's `span_id` within the same `trace_id`. Trees are reconstructed at read time. Cross-trace references use `links`. No depth field, no hash chain.

---

## OpenTelemetry compatibility

**Full OTLP native**, both HTTP (4318 / `:6006/v1/traces`) and gRPC (4317 / configurable `PHOENIX_GRPC_PORT`). Phoenix IS an OTel collector — any OTel-instrumented app pointing its exporter at Phoenix's endpoint will show up. Auto-instrumentation packages publish OpenInference-compliant spans via standard OTel SDKs.

OpenInference is published as an open semantic-convention spec at github.com/Arize-ai/openinference. **Both Langfuse and DataDog APM-LLM accept OpenInference-conventioned spans alongside their own** — meaning instrument-once-publish-many is real if you adopt OpenInference attributes.

---

## API surface (instrumentation)

Two-layer model: (1) `phoenix.otel.register()` configures the OTel TracerProvider with Phoenix-aware defaults; (2) auto-instrumentation libraries OR `tracer.chain` / `tracer.tool` decorators emit OpenInference spans.

### 1. Auto-instrumentation (zero-code-change)

```bash
pip install arize-phoenix-otel openinference-instrumentation-openai
```

```python
from phoenix.otel import register

# Auto-trace OpenAI, LangChain, LlamaIndex, etc.
tracer_provider = register(
    auto_instrument=True,       # turns on every installed openinference-instrumentation-* lib
    batch=True,                 # production batching
    project_name="my-app",
)
```

Now every `openai.chat.completions.create(...)` (or `langchain.invoke(...)`, or `crewai.kickoff()`) emits OpenInference spans to Phoenix with zero code changes.

### 2. Decorators — `@tracer.chain`, `@tracer.tool` (and `.agent`, `.llm`)

```python
from phoenix.otel import register

tracer_provider = register()
tracer = tracer_provider.get_tracer(__name__)

@tracer.chain
def process_data(data):
    return data + " processed"

@tracer.tool
def weather(location):
    return "sunny"
```

These decorators are imported through `phoenix.otel` but live in `openinference.instrumentation` — they wrap the function in an OTel span with `openinference.span.kind = "CHAIN" | "TOOL" | "AGENT" | "LLM"` and capture `input.value` / `output.value` automatically.

### 3. Context managers + manual attributes

```python
from openinference.semconv.trace import SpanAttributes, OpenInferenceSpanKindValues

with tracer.start_as_current_span("custom-llm-call") as span:
    span.set_attribute(
        SpanAttributes.OPENINFERENCE_SPAN_KIND,
        OpenInferenceSpanKindValues.LLM.value,
    )
    span.set_attribute(SpanAttributes.LLM_MODEL_NAME, "gpt-5.4")
    span.set_attribute(SpanAttributes.INPUT_VALUE, prompt)
    result = call_llm(prompt)
    span.set_attribute(SpanAttributes.OUTPUT_VALUE, result)
```

### 4. Trace-scoped context (session, user, metadata, prompt template, tags)

```python
from openinference.instrumentation import (
    using_session, using_user, using_metadata, using_tags, using_prompt_template,
)

with using_user("user-42"), using_session("session-7"), using_tags(["prod", "v2"]):
    response = chain.invoke({"question": "..."})
# every span emitted inside the `with` block carries session.id, user.id, tag.tags
```

### 5. Direct OTel — Phoenix as just-an-OTLP-endpoint

```python
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter

provider = TracerProvider()
provider.add_span_processor(BatchSpanProcessor(
    OTLPSpanExporter(endpoint="http://localhost:6006/v1/traces")
))
# Now any OTel-instrumented library publishes to Phoenix.
```

### 6. Local launch — embedded server

```python
import phoenix as px
session = px.launch_app()   # spins up Phoenix UI at http://localhost:6006
# or px.launch_app(trace_data=trace_dataset) to view a pre-recorded trace
```

---

## Dashboard UX — every main screen

### Project view (`/projects/<id>`)
- A Project = one app's worth of traces. Default project is `"default"`.
- Top-level metrics: total trace count, error count, p50/p95/p99 latency, total cost, total tokens, scatterplots of latency over time.

### Trace list (within a project)
- Columns: **Trace ID** (truncated), **Root Span Name**, **Timestamp**, **Latency**, **Total Tokens**, **Total Cost**, **Status** (OK/ERROR dot), **# Spans**, **session.id**, **user.id**, **tags**, **annotations** (scores attached).
- Filter bar: structured filter on any OpenInference attribute (`llm.model_name = "gpt-5.4"`, `openinference.span.kind = "RETRIEVER"`, `session.id = "..."`), free-text on `input.value` / `output.value`.
- Phoenix's filter syntax is its own mini-DSL — supports boolean ops, regex, numeric comparisons across span attributes.

### Trace detail view (`/projects/<id>/traces/<trace-id>`)
- Two-pane: left = **span tree** (indented by `parent_id`); right = currently-selected span detail.
- Tree node: icon by `openinference.span.kind`, name, latency badge, token badge, status dot. Spans render the OpenInference kind icon explicitly.
- Above the tree: **Gantt chart** with horizontal bars per span on a shared timeline — Phoenix's Gantt is more prominent than Langfuse's ribbon. Click a bar to jump to that span.

### Span detail
- Tabs: **Info** (kind, status, latency, parent), **Attributes** (formatted by kind — LLM bubbles for `LLM` spans, document cards for `RETRIEVER`, tool input/output for `TOOL`, vector heatmap for `EMBEDDING`), **Events** (OTel events incl. exceptions), **Code Snippets** (auto-generated cURL / Python to reproduce).
- LLM spans: full message thread with role bubbles, model + parameters, token counts with cache_read/cache_write breakdown, cost breakdown with the same detail.
- Retriever spans: list of returned documents ranked by score with content + metadata.
- Embedding spans: shows the input text + the vector itself (truncated), useful for debugging RAG.

### Replay / debug / diff
- **Prompt Playground** is a top-level screen. Loads any LLM span's prompt + params; lets you mutate model, temperature, system message, run against any configured LLM provider, and compare outputs side-by-side.
- "Replay span in playground" button on every `LLM` span detail.
- **No full-trace replay** (same gap as the other two products).
- **Compare** view in Experiments: per-example diff of outputs across experiment runs, with diff coloring on text fields.

### Eval / scoring
- **Datasets**: collections of `{input, expected_output, metadata}` examples. Built from production traces (select trace → "Add to dataset"), uploaded as CSV/JSON, or built programmatically with `phoenix.client`.
- **Experiments**: run a function over every dataset example, attach evaluators, get a per-example + aggregate scorecard.
- **Annotations** (Phoenix's equivalent of Langfuse Scores): attach key-value annotations to any span. Phoenix UI auto-detects columns named `label` and `score` for display. Annotations can come from human reviewers (in-UI), LLM-judges (via `arize-phoenix-evals`), or programmatic (via the client SDK).
- **`arize-phoenix-evals`** ships LLM-as-judge templates for: hallucination, relevance, toxicity, QA correctness, RAG retrieval-relevance, summarization quality, code-readability, code-functionality. Each emits its own evaluator span (Phoenix is unusual in this — eval runs are themselves traced and visible alongside the eval'd trace).
- **Evaluator traces** are a distinct browse-able view — when an LLM-judge evaluates a trace, that judge's reasoning becomes its own trace, queryable to debug eval quality.

### Sharing / export
- Phoenix is most often run locally — sharing is "send them the docker container with the data volume" or "screenshot". The hosted `app.phoenix.arize.com` adds per-space sharing.
- The OpenAPI-spec client (`arize-phoenix-client`) at `https://github.com/Arize-ai/phoenix/blob/main/schemas/openapi.json` exposes every trace/span/annotation as REST — full export is trivial.
- **`@arizeai/phoenix-mcp`** ships Phoenix-as-MCP-server: a coding agent (Claude Code, Cursor) can query Phoenix traces via MCP tools, useful for "show me my last 5 failed traces" inside a coding session.
- **`@arizeai/phoenix-cli`** does the same from a terminal — `phoenix traces fetch ...`.

### Project / workspace organization
- **Space** (cloud only) > **Project** > **Trace** > **Span** > **Annotation**.
- Self-hosted is single-tenant; cloud adds spaces + RBAC.

---

## What we'd borrow for OneMem

1. **`openinference.span.kind` as a single string attribute, not a column** — OneMem's `tool_kind` is a column. Phoenix's approach is more extensible: new span kinds don't require schema migration. We should make `tool_kind` a string on `ActionCall` (which it is) and treat it as OneMem's equivalent.
2. **OpenInference attribute names verbatim where they overlap** — using `llm.input_messages.[i].message.role` instead of inventing our own means a Phoenix-instrumented app can publish to OneMem with zero translation (when we add OTLP support in v0.2). This is the cheapest interop win in the entire stack.
3. **Gantt-chart-above-tree as the trace detail layout** — Phoenix's Gantt is more prominent than Langfuse's ribbon. For agent runs with 60+ spans and significant parallelism (web fetches, multi-agent delegation), the Gantt is the killer view. Ship on `/trace/[id]` v0.1.
4. **Auto-instrumentation lib family** — Phoenix's `openinference-instrumentation-<framework>` family is the gold-standard distribution pattern. OneMem's provider matrix (Claude Code MCP, Hermes plugin, Vercel provider, OpenAI Agents, LiveKit) is the same pattern with a different naming convention.
5. **Evaluator-as-trace** — when an LLM-judge scores a trace, the judge's own trace is browse-able. OneMem could ship this naturally — verification of someone else's trace IS itself a trace, and the verification result is an attestation. Two birds.
6. **Phoenix-as-MCP-server** (`@arizeai/phoenix-mcp`) — OneMem should ship the same: `@onemem/mcp` exposing the trace database to coding agents via MCP. Very small surface, very useful for the Claude Code persona.
7. **`phoenix-cli`** — OneMem should ship a CLI for the same reason. Pull a trace by hash, verify locally, replay.
8. **In-UI rendering by span kind** — LLM bubbles for LLM spans, doc cards for retriever, vector preview for embedding, audio player for voice. OneMem adds: tx detail card for `financial` spans, image preview for `image-gen` spans. The renderer dispatch on `tool_kind` is the same shape as Phoenix's dispatch on `openinference.span.kind`.

---

## Where Phoenix falls short for our use case

- **No cryptographic verifiability.** Spans are OTel rows in Phoenix's datastore. Auto-instrumentation makes them easy to capture, not hard to mutate.
- **No on-chain attestation.** Phoenix is local-first, but local-first ≠ verifiable. A user can edit their local SQLite trace store.
- **No cross-vendor portability of viewer state.** A Phoenix trace exists in YOUR Phoenix instance; sending a trace = sending the data. There's no shareable capability.
- **No cross-process trace stitching by default.** Two separate processes both auto-instrumented to Phoenix produce two separate traces unless they propagate a `traceparent` header — works for HTTP-style services, doesn't work for "Claude Code session → Hermes session" hand-offs that lose context.
- **Plaintext storage by default.** Self-hoster controls encryption; SDK has no end-to-end primitive.
- **Engineer-shaped UX** — the most engineer-shaped of the three. The Attributes tab shows OTel attribute names directly. Phoenix's audience IS ML/AI engineers debugging RAG pipelines — they speak OpenTelemetry. OneMem's persona doesn't.
- **Phoenix server is ELv2** (not OSI-approved open source) — the *server* can't be forked into a commercial competitor. OneMem is a different product, not a Phoenix fork, but this is worth knowing.

---

## Sources

- Phoenix tracing concepts: https://arize.com/docs/phoenix/tracing/concepts-tracing
- Phoenix custom spans: https://arize.com/docs/phoenix/tracing/how-to-tracing/setup-tracing/custom-spans
- Phoenix Python instrumentation: https://arize.com/docs/phoenix/tracing/how-to-tracing/setup-tracing/instrument-python
- Phoenix datasets + experiments: https://arize.com/docs/phoenix/datasets-and-experiments/overview-datasets
- Phoenix evaluator traces: https://arize.com/docs/phoenix/evaluation/llm-evals/evaluator-traces
- Phoenix server repo: https://github.com/Arize-ai/phoenix
- Phoenix OTEL package README: https://github.com/Arize-ai/phoenix/blob/main/packages/phoenix-otel/README.md
- Phoenix DeepWiki (tracing + observability): https://deepwiki.com/Arize-ai/phoenix/5.1-tracing-and-observability
- OpenInference spec repo: https://github.com/Arize-ai/openinference
- OpenInference semantic conventions: https://github.com/Arize-ai/openinference/blob/main/spec/semantic_conventions.md
- Phoenix OpenAPI spec: https://github.com/Arize-ai/phoenix/blob/main/schemas/openapi.json
- Phoenix MCP server: https://github.com/Arize-ai/phoenix/tree/main/js/packages/phoenix-mcp
- Phoenix CLI: https://github.com/Arize-ai/phoenix/tree/main/js/packages/phoenix-cli
