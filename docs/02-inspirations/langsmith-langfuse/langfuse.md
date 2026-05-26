---
product: Langfuse
vendor: Langfuse GmbH (Berlin / SF)
license: MIT (server + SDKs); Langfuse Cloud is the hosted commercial layer
docs_root: https://langfuse.com/docs
server_repo: https://github.com/langfuse/langfuse
python_sdk_repo: https://github.com/langfuse/langfuse-python
js_sdk_repo: https://github.com/langfuse/langfuse-js
status: GA, self-hostable, OTLP-native (HTTP/JSON + HTTP/protobuf)
captured: 2026-05-23
purpose: Trace-data-model + UX reference for OneMem `/trace/[id]` route
---

# Langfuse — trace viewer reference for OneMem

## What it is (factual)

Langfuse is the open-source LLM observability platform. MIT-licensed server (TypeScript + Postgres + ClickHouse + Redis + S3), Python (v4) and JS/TS (v5) SDKs, and a Next.js dashboard. Differs from LangSmith in three load-bearing ways: (1) open source — `git clone && docker compose up` self-hosts the entire stack; (2) OTLP-native ingestion via `/api/public/otel/v1/traces` accepting both OTel GenAI semantic conventions and Langfuse-flavored attributes; (3) deeper eval + prompt-management + dataset surface than the SaaS-only competitors. Surface: trace ingestion, sessions (multi-trace conversation replay), scores (evals + annotations), prompts (versioned + A/B), datasets (with experiments), and configurable dashboards.

---

## Trace data model

Langfuse splits the hierarchy across two tables: `traces` and `observations`. Observations are the recursive node type; a Trace is the top-level container. The legacy Prisma models (still the canonical schema even after the v3 ClickHouse migration kept the same shape):

### Trace (`traces` table)

```prisma
model LegacyPrismaTrace {
  id         String   @id @default(cuid())
  externalId String?  @map("external_id")
  timestamp  DateTime @default(now())
  name       String?
  userId     String?  @map("user_id")
  metadata   Json?
  release    String?
  version    String?
  projectId  String   @map("project_id")
  public     Boolean  @default(false)       // makes the trace visitable without login
  bookmarked Boolean  @default(false)
  tags       String[] @default([])
  input      Json?                          // optional trace-level input
  output     Json?
  sessionId  String?  @map("session_id")    // groups traces into a Session
  createdAt  DateTime @default(now())
  updatedAt  DateTime @default(now()) @updatedAt
}
```

### Observation (`observations` table — recursive)

```prisma
model LegacyPrismaObservation {
  id                   String   @id @default(cuid())
  traceId              String?  @map("trace_id")           // FK → trace
  projectId            String   @map("project_id")
  type                 LegacyPrismaObservationType         // SPAN | EVENT | GENERATION | AGENT
                                                           // | TOOL | CHAIN | RETRIEVER
                                                           // | EVALUATOR | EMBEDDING | GUARDRAIL
  startTime            DateTime @default(now())
  endTime              DateTime?
  name                 String?
  metadata             Json?
  parentObservationId  String?  @map("parent_observation_id")   // → forms the tree
  level                LegacyPrismaObservationLevel @default(DEFAULT)  // DEBUG | DEFAULT | WARNING | ERROR
  statusMessage        String?
  version              String?

  // LLM-specific (used when type=GENERATION)
  model                String?  // user-provided
  internalModel        String?  // matched model.name at ingestion
  internalModelId      String?
  modelParameters      Json?
  input                Json?
  output               Json?
  promptTokens         Int      @default(0)
  completionTokens     Int      @default(0)
  totalTokens          Int      @default(0)
  unit                 String?  // "TOKENS" | "CHARACTERS" | "MILLISECONDS" | "IMAGES" | ...
  inputCost            Decimal?
  outputCost           Decimal?
  totalCost            Decimal?
  calculatedInputCost  Decimal?
  calculatedOutputCost Decimal?
  calculatedTotalCost  Decimal?
  completionStartTime  DateTime?  // TTFT
  promptId             String?    // FK → managed Prompt (versioned)
}

enum LegacyPrismaObservationType {
  SPAN          // generic timed span
  EVENT         // zero-duration log point
  GENERATION    // LLM call
  AGENT         // agent execution
  TOOL          // tool call
  CHAIN         // composite step
  RETRIEVER     // RAG retrieval
  EVALUATOR     // eval execution
  EMBEDDING
  GUARDRAIL
}

enum LegacyPrismaObservationLevel {
  DEBUG
  DEFAULT
  WARNING
  ERROR
}
```

### Score (`scores` table — feedback/eval attached to a trace or observation)

```prisma
model LegacyPrismaScore {
  id            String   @id @default(cuid())
  timestamp     DateTime @default(now())
  projectId     String
  name          String                     // e.g. "correctness", "toxicity"
  value         Float?                     // for NUMERIC / BOOLEAN
  source        LegacyPrismaScoreSource    // ANNOTATION | API | EVAL
  authorUserId  String?
  comment       String?
  traceId       String                     // always set
  observationId String?                    // optional — score can be observation-scoped
  configId      String?                    // → ScoreConfig (name, dataType, min, max, categories)
  stringValue   String?                    // for CATEGORICAL / BOOLEAN
  queueId       String?                    // → AnnotationQueue
  dataType      ScoreConfigDataType @default(NUMERIC)  // NUMERIC | CATEGORICAL | BOOLEAN | TEXT
}
```

### Session (`trace_sessions` table — multi-trace replay)

```prisma
model TraceSession {
  id          String   @default(cuid())
  projectId   String
  bookmarked  Boolean  @default(false)
  public      Boolean  @default(false)
  environment String   @default("default")
  @@id([id, projectId])
}
```

**Hierarchy:** `Project → Session → Trace → Observation (recursive) → Score`.

**Parent semantics:** `parentObservationId` is a single nullable string. The full tree is reconstructed at read time. There is no depth field, no merkle linkage, no signature. Trace-level `userId`, `sessionId`, `tags`, `metadata` propagate to all observations within the trace (server-side denormalization for filtering).

---

## OpenTelemetry compatibility

**Langfuse accepts OTLP natively.** Endpoint: `https://cloud.langfuse.com/api/public/otel/v1/traces` (or `/api/public/otel` for region/HIPAA variants, or `http://localhost:3000/api/public/otel` for self-hosted). Protocol support: **OTLP over HTTP/JSON and HTTP/protobuf. gRPC is NOT supported.**

Auth via env vars:

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT="https://cloud.langfuse.com/api/public/otel"
export OTEL_EXPORTER_OTLP_HEADERS="Authorization=Basic ${AUTH_STRING},x-langfuse-ingestion-version=4"
```

**GenAI semantic-convention mapping** (Langfuse aims for compliance):

| Langfuse field      | OTel-spec attributes (any match)                                                       |
| ------------------- | ---------------------------------------------------------------------------------------- |
| `userId`            | `langfuse.user.id`, `user.id`                                                            |
| `sessionId`         | `langfuse.session.id`, `session.id`                                                      |
| `model`             | `langfuse.observation.model.name`, `gen_ai.request.model`, `llm.model_name`              |
| `input`             | `langfuse.observation.input`, `gen_ai.prompt`, `input.value`                             |
| `output`            | `langfuse.observation.output`, `gen_ai.completion`, `output.value`                       |
| `usage` (tokens)    | `langfuse.observation.usage_details`, `gen_ai.usage.*`                                   |

Langfuse explicitly accepts both **OpenInference** (Arize Phoenix's flavor) and **OTel GenAI conventions** — meaning any OpenInference-instrumented app can dual-publish to Phoenix AND Langfuse with one OTLP exporter pointed at two endpoints. This makes Langfuse the most ecosystem-compatible option of the three.

The docs recommend "Prefer the Langfuse SDKs instead of wiring raw OpenTelemetry exporters directly" — the SDKs add cost-calculation, prompt-registry resolution, and media handling that raw OTLP loses.

---

## API surface (instrumentation)

### 1. `@observe` decorator (Python SDK)

```python
from langfuse import observe

@observe()
def my_data_processing_function(data, parameter):
    return {"processed_data": data, "status": "ok"}

@observe(name="llm-call", as_type="generation")
async def my_async_llm_call(prompt_text):
    return "LLM response"

@observe
def main_function(data, parameter):
    return my_data_processing_function(data, parameter)   # nested → child observation
```

### 2. Propagating trace-level attributes (`user_id`, `session_id`, tags) from inside

```python
from langfuse import observe, propagate_attributes

@observe()
def my_llm_pipeline(user_id: str, session_id: str):
    with propagate_attributes(
        user_id=user_id,
        session_id=session_id,
        metadata={"pipeline": "main"}
    ):
        result = call_llm()
        return result
```

### 3. Context-manager API (`start_as_current_observation`)

```python
from langfuse import get_client

langfuse = get_client()

# Create a span using a context manager
with langfuse.start_as_current_observation(as_type="span", name="process-request") as span:
    span.update(output="Processing complete")

    # Create a nested generation for an LLM call
    with langfuse.start_as_current_observation(
        as_type="generation",
        name="llm-response",
        model="gpt-3.5-turbo"
    ) as generation:
        generation.update(output="Generated response")

# All spans are automatically closed when exiting their context blocks
langfuse.flush()   # important in short-lived scripts
```

### 4. Drop-in OpenAI wrapper

```python
# Replace `from openai import OpenAI`
from langfuse.openai import OpenAI
client = OpenAI()
# every chat.completions.create call now emits a Generation
```

### 5. Connection check + init

```python
from langfuse import Langfuse, get_client

langfuse = Langfuse(
  public_key="your-public-key",
  secret_key="your-secret-key",
  base_url="https://cloud.langfuse.com",
)

if langfuse.auth_check():
    print("Langfuse client is authenticated and ready!")
```

---

## Dashboard UX — every main screen

### Trace list view (`/project/<id>/traces`)
- Columns: **ID** (truncated), **Timestamp**, **Name**, **User ID**, **Session ID** (clickable → session view), **Tags** (chips), **Latency**, **Total Cost**, **Total Tokens**, **# Observations**, **Scores** (badges).
- Filter bar: free-text over name/userId/input/output, plus structured filters for: `tags`, `userId`, `sessionId`, `environment` ("development"/"staging"/"production"/...), `release`, `version`, `metadata.<key>=<value>`, `level`, `hasScores`, date range.
- Multi-select → bulk add to dataset, bulk score, bulk delete.

### Trace detail view (`/project/<id>/traces/<trace-id>`)
- Two-pane: left = **observation tree** (indented by `parentObservationId`); right = currently-selected observation detail.
- Tree node shows: icon-by-type (LLM gear, TOOL wrench, RETRIEVER db, AGENT robot, SPAN clock), name, latency, total cost, `level` badge if WARNING/ERROR, scores attached.
- Above the tree: timeline ribbon ("Gantt-lite") — horizontal bars showing each observation's start/end overlaid on a timeline; click any bar to jump to that observation in the tree.
- Trace-level header strip: `userId` chip → links to user view; `sessionId` chip → links to session replay; `tags`; total cost; total latency; "Make public" toggle; "Share" → public URL `langfuse.com/project/<id>/traces/<trace-id>?public=true`.

### Span / observation detail
- Tabs: **Preview** (formatted view), **JSON** (raw), **Scores** (attached + add-new), **Comments**.
- For `GENERATION`: shows model, model parameters, prompt (with prompt-registry link if `promptId` set), completion, token usage (prompt/completion/total), cost (user-provided + calculated), TTFT (computed from `completionStartTime - startTime`), finish reason. Side-by-side messages view for chat models.
- For `RETRIEVER`: documents as cards with score + content snippet.
- For `TOOL`: tool name, JSON input, JSON output or error.
- Media attachments (images, audio) render inline; Langfuse handles base64 → S3 reference resolution transparently.
- Edit-in-Playground: every Generation has a "Playground" button → opens the prompt + model + params in a sandbox where you can mutate and re-run against any registered LLM provider. This is the closest Langfuse comes to "replay".

### Session view (`/project/<id>/sessions/<session-id>`)
- Distinct screen — vertical scroll of **all traces sharing the `sessionId`**, rendered as a conversation. User-role bubbles, assistant-role bubbles, tool-call cards in between. Click any bubble → opens that trace's detail.
- Total session cost, total session latency, total turn count. Add session-level scores. Public-link share.

### Replay / debug / diff
- **No multi-step session replay** beyond the conversation view above. No "scrub through every tool call in order".
- **Playground** replaces single-step replay for LLM calls only.
- **Compare view** in Experiments: two experiment runs side-by-side per dataset example. Diff is left/right panels of output JSON.

### Eval / scoring
- **Scores** are the universal feedback primitive — see schema above. Attach to trace or observation; categorical/numeric/boolean/text via `ScoreConfig`.
- **Evaluators**: LLM-as-judge templates (with versioned prompts in the prompt registry), Python custom evaluators, or external API. Can run online (sampled production traces) or batch (over a dataset).
- **Annotation Queues**: filter traces by criteria → push to queue → human annotator opens queue → scores each one against a `ScoreConfig` shape.
- **Datasets** + **Experiments**: dataset = `{input, expected_output}` examples; experiment = run a function over the dataset, attach evaluators, compare runs.
- **Prompt registry**: versioned prompts with A/B-test slot routing; observations linked to a prompt show "this generation used prompt X v3".

### Sharing / export
- Per-trace **public link** via `public: Boolean` flag on the trace row. No expiration, no view-count limit, no auth needed by viewer. Toggleable from UI or API.
- Per-session public link same mechanism.
- Bulk export: dataset and experiments downloadable as CSV/JSON. Full trace export via `/api/public/traces` REST endpoint (paginated).

### Project / workspace organization
- **Organization** > **Project** > (**Session** | **User**) > **Trace** > **Observation**.
- Each project has its own API keys + ingestion endpoint + retention settings + dashboards.
- **Environments** (`development` / `staging` / `production` / arbitrary string) are a tag-like dimension on Trace, filterable everywhere — Langfuse explicitly recommends one project per app and using environments for stage separation rather than one-project-per-stage.

---

## What we'd borrow for OneMem

1. **Two-table model: Trace + recursive Observation** with `parentObservationId`. OneMem already does this with `TraceSession` + `ActionCall` — the shape is identical to Langfuse's and that's a good sign.
2. **`level` enum on every observation** (DEBUG/DEFAULT/WARNING/ERROR) — small but high-leverage filter for "show me only the error spans in this 200-node trace". OneMem's `ActionCallStatus` covers running/success/error/blocked but should add a separate `severity` axis for non-error warnings.
3. **`environment` field** as a first-class trace attribute, indexed for filtering — most agents run in many contexts (test, staging, mainnet, devnet). OneMem should add an `environment: String` field to `TraceSession`.
4. **Sessions as a separate object grouping multiple traces** — OneMem needs this for "the same user intent spanning 4 separate Claude Code sessions over a week". `MemoryNamespace.id + user_intent_hash` could be the natural grouping key.
5. **Per-trace `public: Boolean` flag** + a public URL pattern — OneMem's `sui_object_id` is already public on-chain; the UI affordance ("Make public" toggle + copy-link) should be loud and obvious.
6. **OpenInference + GenAI dual attribute acceptance** — if OneMem accepts OTLP at all (v0.2+), this is the right pattern: don't pick one convention, accept both. Means an OpenInference-instrumented LangChain app can publish to OneMem without code changes.
7. **Score as a child object of trace OR observation** — OneMem's verifiability lets us go further: a Score can be a signed attestation, with its own `signer` field. Lets third-party reviewers score someone else's trace and stamp the score on-chain.
8. **Timeline ribbon above the tree** — Gantt-lite visualization is way more readable than a deep tree alone. Should be on `/trace/[id]` v0.1.
9. **Drop-in `from langfuse.openai import OpenAI` pattern** — for OneMem's TS provider `@onemem/vercel-ai-provider`, the literal copy is `createOneMem(openai('gpt-5.4'))` returning a `wrapLanguageModel`-wrapped model. Mirror the ergonomic minimalism.

---

## Where Langfuse falls short for our use case

- **No cryptographic verifiability.** Observations are mutable rows in Postgres/ClickHouse. The `public: Boolean` flag exposes the row but doesn't prove integrity. A self-hoster could edit rows directly.
- **No on-chain attestation.** Adding hash-chains would require schema migration + a new write path + a verification protocol. None exist.
- **No cross-vendor portability.** A trace is a `(projectId, traceId)` row. To "send" a trace, you give someone access to your Langfuse project — there is no transferable capability.
- **No cross-runtime parent referencing.** `parentObservationId` is a server-issued cuid. Two processes can't independently mint observations that link without coordinating through the same Langfuse project. OneMem's content-addressed `parent_call_id` works across runtime + project + chain boundaries because the reference is the hash, not the row id.
- **Plaintext at rest by default.** Self-hosters can encrypt the DB at the storage layer; the SDK has no end-to-end encryption. Seal threshold-encryption is OneMem-only.
- **Engineer-shaped UX** — assumes you wrote the agent and you're debugging it. The session-view conversation replay is closer to end-user than LangSmith but still requires you to set up sessions deliberately.
- **OTLP gRPC unsupported.** HTTP-only. Minor.

---

## Sources

- Langfuse data model: https://langfuse.com/docs/observability/data-model
- Langfuse OTLP integration: https://langfuse.com/docs/opentelemetry/get-started
- Langfuse SDK overview: https://langfuse.com/docs/observability/sdk
- Langfuse Python decorators: https://langfuse.com/docs/observability/sdk/python/decorators
- Langfuse sessions: https://langfuse.com/docs/observability/features/sessions
- Langfuse scores: https://langfuse.com/docs/scores/overview
- Langfuse public trace sharing: https://langfuse.com/changelog/2023-09-14-public-link-sharing
- Langfuse trace URLs: https://langfuse.com/docs/observability/features/url
- Schema (source of truth): https://github.com/langfuse/langfuse/blob/main/packages/shared/prisma/schema.prisma
- Server repo: https://github.com/langfuse/langfuse
- Python SDK: https://github.com/langfuse/langfuse-python
- JS SDK: https://github.com/langfuse/langfuse-js
