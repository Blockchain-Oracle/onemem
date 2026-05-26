---
captured: 2026-05-23
purpose: Side-by-side comparison of LangSmith / Langfuse / Phoenix as OneMem UX + data-model references
inputs:
  - ./langsmith.md
  - ./langfuse.md
  - ./phoenix.md
  - ../../../WEDGE_V2.md (OneMem `ActionCall` + `TraceSession` Move structs)
---

# Trace Viewers — Comparison + Adoption Plan for OneMem

## Side-by-side feature matrix

| Feature                            | LangSmith                                | Langfuse                                  | Phoenix                                  |
| ---------------------------------- | ---------------------------------------- | ----------------------------------------- | ---------------------------------------- |
| License                            | Proprietary SaaS (+ ent self-host)       | MIT (server + SDKs)                       | ELv2 server + Apache-2.0 subpackages     |
| Core atom                          | **Run** (typed)                          | **Observation** (typed enum)              | **OTel Span** + `openinference.span.kind` |
| Container/root                     | Trace = connected runs                   | Trace (separate table)                    | Trace (OTel)                             |
| Parent reference                   | `parent_run_id: UUID`                    | `parentObservationId: cuid`               | `parent_id: span_id` (OTel)              |
| Cross-process composition          | Manual `parent_run_id` plumb             | Manual `parentObservationId` plumb        | OTel `traceparent` header propagation    |
| Run-type / kind vocab              | string (`tool/chain/llm/...`)            | enum: SPAN/EVENT/GENERATION/AGENT/TOOL/CHAIN/RETRIEVER/EVALUATOR/EMBEDDING/GUARDRAIL | `openinference.span.kind` attribute      |
| Level/severity                     | none (status only)                       | DEBUG / DEFAULT / WARNING / ERROR         | OTel status (OK/ERROR/UNSET) + events    |
| OTLP native                        | **No** (proprietary HTTP)                | **Yes** (HTTP/JSON + protobuf, no gRPC)   | **Yes** (full HTTP + gRPC)               |
| Semantic conv: GenAI               | n/a                                      | accepts (with aliases)                    | accepts via OpenInference                |
| Semantic conv: OpenInference       | n/a                                      | accepts                                   | **native**                               |
| Auto-instrument frameworks         | LangChain ecosystem first-class          | OpenAI/LangChain/Vercel AI/LangGraph/...  | 25+ via `openinference-instrumentation-*` |
| Instrument API                     | `@traceable` / `wrap_openai`             | `@observe` / `start_as_current_observation` / `langfuse.openai` | `@tracer.chain` / `register(auto_instrument=True)` / OTel SDK |
| Session/multi-trace replay         | **No** (only Project grouping)           | **Yes** (Session view = conversation replay) | partial (Phoenix Sessions, weaker UI)    |
| Gantt-chart UI on trace            | minimal                                  | timeline ribbon                           | **prominent Gantt**                      |
| Tree-on-left + detail-on-right     | yes                                      | yes                                       | yes                                      |
| Per-span tabbed detail             | Inputs/Outputs/Metadata/Feedback/Logs    | Preview/JSON/Scores/Comments              | Info/Attributes/Events/Code-Snippets     |
| LLM messages as bubbles            | yes                                      | yes                                       | yes                                      |
| Eval / scoring primitive           | Feedback (key+score)                     | Score (NUMERIC/CAT/BOOL/TEXT + `ScoreConfig`) | Annotation (auto-detects `label`+`score`) |
| LLM-as-judge built-in              | yes (Experiments)                        | yes (online + batch)                      | yes (`arize-phoenix-evals`)              |
| Evaluator runs are traced          | partial                                  | partial                                   | **yes — evaluator traces are first-class** |
| Prompt registry                    | yes                                      | **yes (versioned + A/B)**                 | weaker                                   |
| Prompt Playground                  | yes (single LLM call)                    | yes (open from Generation)                | **yes — top-level screen**               |
| Datasets + Experiments             | yes                                      | yes                                       | yes                                      |
| Annotation queues                  | **yes** (single + pairwise)              | yes                                       | yes                                      |
| Per-trace public link              | yes (revocable)                          | **yes (`public: Boolean` flag, no expiry)** | hosted-tier only                         |
| Bulk export                        | dataset only via UI; full via SDK        | dataset + full traces REST                | full REST + CLI + MCP                    |
| MCP server for traces              | no                                       | no                                        | **yes — `@arizeai/phoenix-mcp`**         |
| CLI for traces                     | no first-party                           | no first-party                            | **yes — `@arizeai/phoenix-cli`**         |
| Self-host                          | enterprise only                          | **`docker compose up`**                   | `pip install` + container                |
| Cryptographic verifiability        | **no**                                   | **no**                                    | **no**                                   |
| On-chain attestation               | **no**                                   | **no**                                    | **no**                                   |
| Transferable trace capability      | **no** (project ACL only)                | **no** (project ACL only)                 | **no** (project ACL only)                |
| End-to-end encryption              | **no**                                   | **no**                                    | **no**                                   |

---

## Which product's data model is closest to OneMem's?

**Langfuse, on shape. Phoenix, on conventions. LangSmith, on UX patterns.**

OneMem's `TraceSession` + recursive `ActionCall` is structurally identical to Langfuse's `Trace` + recursive `Observation`. Same split (top-level container + recursive typed node), same `parent_*_id: Option<ID>` model, same per-node `metadata` JSON, same per-node `level`/`status` axis (OneMem uses a single `status` field; Langfuse uses two — see "what to borrow" below).

Phoenix's data model is the cleanest *conceptually* but ties OneMem to OTel for ingestion, which is overkill for v0.1's six SDK-driven providers (Claude Code MCP, Hermes, Vercel AI, OpenAI Agents, LiveKit, core SDKs). The right move is to **adopt OpenInference attribute names where they overlap** (the `llm.input_messages.[i].message.role` family) so future OTel ingestion is a header-and-attribute mapping, not a data-model migration.

LangSmith owns the trace-detail-page UX vocabulary that engineers already speak (tree-left + detail-right + tabbed span panel + filter chips). Copy that.

---

## OneMem `ActionCall` ↔ trace-viewer span — cross-reference

Field-by-field mapping from the WEDGE_V2.md `ActionCall` Move struct to its three-viewer equivalents:

| OneMem `ActionCall` field      | LangSmith Run field                              | Langfuse Observation field             | Phoenix / OpenInference span attribute               |
| --------------------------------- | ------------------------------------------------ | -------------------------------------- | ---------------------------------------------------- |
| `session_id: ID`                  | `session_id: UUID` (project, not trace)          | `traceId: String`                      | `context.trace_id`                                   |
| `parent_call_id: Option<ID>`      | `parent_run_id: UUID?`                           | `parentObservationId: String?`         | `parent_id: span_id?`                                |
| `depth: u32`                      | derived at read                                  | derived at read                        | derived at read                                      |
| `runtime: String`                 | (no native field; goes in `extra`/tags)          | `metadata.runtime`                     | `resource.attributes["service.name"]` or `tag.tags`  |
| `tool_name: String`               | `name: String`                                   | `name: String?`                        | `name` (span name) + `tool.name` for TOOL spans      |
| `tool_kind: String`               | `run_type: str` ("tool"/"chain"/"llm"/...)       | `type: ObservationType` enum            | `openinference.span.kind` ("LLM"/"TOOL"/"AGENT"/...) |
| `walrus_inputs_blob: vector<u8>`  | `inputs: dict` (inline JSON)                     | `input: Json?`                         | `input.value` (string)                               |
| `walrus_outputs_blob: Option<…>`  | `outputs: dict?`                                 | `output: Json?`                        | `output.value`                                       |
| `started_at_ms: u64`              | `start_time: datetime`                           | `startTime: DateTime`                  | `start_time`                                         |
| `ended_at_ms: Option<u64>`        | `end_time: datetime?`                            | `endTime: DateTime?`                   | `end_time`                                           |
| `status: u8` (0..3)               | `status: str?` + `error: str?`                   | `level` + `statusMessage`              | `status.status_code` + `status.description`          |
| `agent_id: address`               | (custom metadata, not native)                    | `userId` OR `metadata.agent_id`        | `user.id` OR `agent.name`                            |
| `content_hash: vector<u8>`        | **none**                                         | **none**                               | **none**                                             |
| `prev_hash: vector<u8>`           | **none**                                         | **none**                               | **none**                                             |
| `seal_envelope_hash: Option<…>`   | **none**                                         | **none**                               | **none**                                             |
| `display_name: String`            | `name` doubles as display                        | `name` doubles as display              | `name`                                               |
| `walrus_inputs_blob` (large)      | LangSmith stores inputs/outputs in S3 over 5KB   | media via separate `trace_media` table | OTel doesn't address this; clients handle            |

**What OneMem adds that none of them have:**
- `content_hash` / `prev_hash` — hash-chain for tamper-evidence
- `seal_envelope_hash` — encryption-at-rest proof
- `signer` + `sui_tx_digest` — on-chain attestation (the verify-button killshot)
- `walrus_*_blob` IDs — content-addressed storage independent of trace database
- `merkle_root` on `TraceSession` — single root that can be verified end-to-end

**What OneMem should ADD borrowed from Langfuse:**
- `level: Level` enum (DEBUG/DEFAULT/WARNING/ERROR) — separate axis from `status`. A successful call can still be a WARNING (e.g., retried 3x before succeeding).
- `environment: String` on `TraceSession` — first-class for dev/staging/mainnet/devnet filtering.
- `version: String` on `ActionCall` — agent code version, lets you filter "errors that started after v2.3 of the agent".

**What OneMem should ADD borrowed from Phoenix:**
- Accept OpenInference attribute names in `metadata` so OpenInference-instrumented apps publish to OneMem with no translation layer (v0.2 OTLP ingestion).
- `events: vector<Event>` per ActionCall (for exception capture + custom log points). Move struct addition; ~30 lines.

---

## The five-to-seven dashboard screens OneMem ships at v0.1

1. **`/trace/[id]` — Trace detail (THE HEADLINE)**
   - Layout inspiration: **LangSmith** (left tree + right tabbed detail).
   - Add: **Phoenix-style Gantt chart** above the tree.
   - Add: trace-level header strip with **`agent_id`, `user_intent`, total cost, total latency, "Verify on-chain" button, "Share via NFT" button, "Replay" modal trigger** — header is denser than any of the three because we have on-chain affordances they don't.
   - Span detail tabs: `Preview` (formatted by `tool_kind`, e.g. messages for LLM, doc cards for retriever, tx detail for financial, audio player for voice) / `Inputs JSON` / `Outputs JSON` / `Attestation` (Sui tx, Walrus blob ID, Seal envelope hash, prev_hash, content_hash) / `Verify` (one-click client-side re-walk).

2. **`/traces` — Trace list**
   - Layout inspiration: **Langfuse** (denser column set than LangSmith; `userId`/`sessionId` chips that link to grouping views).
   - Columns: `Timestamp`, `User Intent` (first 80 chars of `TraceSession.user_intent`), `Agent`, `Runtimes Touched` (chips: claude-code, hermes, vercel-ai, ...), `Latency`, `# ActionCalls`, `Verified` (green/grey dot), `Shared` (link/wallet chip).
   - Filter bar: agent_id, runtime, tag, environment, has_error, time-range, verified_only.
   - Group-by: agent_id (default), runtime, namespace_id.

3. **`/memories` — Per-app provenance index**
   - No direct analog in the three products — this is OneMem-specific. Same two-pane shape as `/trace/[id]` but the left pane is **memory write records** (each ActionCall of kind `memory`), the right pane is **the provenance trace that produced that memory** (which trace, which span, which agent, which session).
   - Filter by namespace, by source app, by content type.

4. **`/sessions/[id]` — Session / conversation replay**
   - Layout inspiration: **Langfuse Sessions** (vertical scroll of multiple traces grouped by `sessionId`, rendered as a conversation with role bubbles + tool-call cards).
   - In OneMem this is "all traces in the same `MemoryNamespace` belonging to one user intent thread".
   - Click any bubble → opens that trace's `/trace/[id]`.

5. **`/share/[capability-id]` — Public/transferred trace view**
   - No direct analog — this is the **NFT-capability-mint + public-view** route that's our killshot.
   - URL is a Sui object ID; viewer is unauthenticated; the page renders the trace tree + verify button + "this trace was minted by <wallet> and transferred to <wallet>" provenance strip.
   - Layout: same as `/trace/[id]` but with a "Provenance of this share" sidebar showing the capability transfer chain on Sui.

6. **`/apps` — Per-app overview + pause/revoke**
   - No direct analog; closest is LangSmith's project dashboard.
   - List of apps (Claude Code, Hermes, Vercel AI, ...) registered against the user's Sui address, with: total ActionCalls written, total memories written, total cost, last activity timestamp, **pause/revoke buttons** (mints a Sui revocation tx).
   - Click an app → drill into its traces (filter to that runtime).

7. **`/` — Overview / home**
   - Inspiration: **Phoenix Project view** (metrics + recent traces scatter).
   - Cards: recent traces (last 5), recent memories written (last 5), recent shares (last 5), aggregate metrics (lifetime cost, lifetime ActionCalls, lifetime verified-percentage).
   - This is the OneMem dashboard front door — make it feel like a wallet, not a dashboard.

**Optional v0.2** (not shipping at v0.1 per WEDGE_V2 cuts):
- `/playground` — Phoenix/Langfuse-style re-run-with-different-model
- `/datasets` + `/experiments` — eval surface
- `/diff` — multi-trace diff (Langfuse Compare equivalent)

---

## The "trace pattern" to adopt

**Verbatim model (data-shape):** Langfuse's `Trace` + recursive typed `Observation` with `parentObservationId`. OneMem already has this. Don't change it. Add `level`, `environment`, `version` (above).

**Verbatim model (attribute names):** OpenInference / Phoenix. When OneMem adds OTLP ingestion at v0.2, accept OpenInference + GenAI conventions both (the Langfuse pattern). Don't invent new attribute names where standard ones exist.

**Verbatim model (UX shapes):** LangSmith's tree-left + tabbed-detail-right + filter-chip-bar, with Phoenix's Gantt ribbon above the tree, with Langfuse's Session view as a separate screen, with OneMem-original Verify + Share buttons in the trace-detail header.

**The differentiator that none of them can match:** **per-ActionCall on-chain attestation**, **transferable trace capability via NFT**, and **cross-runtime parent referencing by `content_hash` not by server-issued UUID**. These three together are the moat. Every UX decision should make these visible and one-click — the Verify animation is the demo killshot.

---

## Cross-references

- `./langsmith.md` — LangSmith deep dive
- `./langfuse.md` — Langfuse deep dive
- `./phoenix.md` — Phoenix deep dive
- `../../../WEDGE_V2.md` — OneMem wedge, `ActionCall` Move struct
- `../../../TRACE_AND_PROVIDERS.md` §4.1 — TypeScript-flavored `ActionCall` interface
- `../../../TRACE_AND_PROVIDERS.md` §4.2 — Move-struct decomposition
