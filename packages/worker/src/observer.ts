// The observer — claude-mem's "brain", decentralized. It takes a batch of raw
// tool calls off the local queue and asks an LLM (the user's OWN coding CLI:
// `codex exec` for Codex, the Claude Agent SDK for Claude — ZERO API key) to
// compress them into readable, structured observations: a `type` (8), a title,
// subtitle, self-contained facts, a narrative, `concepts` (7), and the
// files_read / files_modified "files view". The backend is injected so the loop
// is fully unit-testable with a fake; the real backends live in
// observer-backends.ts and are exercised against the real CLIs.

import type { AddObservationInput, Observation, WorkerEvent, WorkerStore } from "./store.js";

/** The 8 observation types (claude-mem parity). */
export const OBSERVATION_TYPES = [
  "bugfix",
  "feature",
  "refactor",
  "change",
  "discovery",
  "decision",
  "security_alert",
  "security_note",
] as const;

/** The 7 concepts an observation may be tagged with (2–5 each). */
export const OBSERVATION_CONCEPTS = [
  "how-it-works",
  "why-it-exists",
  "what-changed",
  "problem-solution",
  "gotcha",
  "pattern",
  "trade-off",
] as const;

const TYPE_SET = new Set<string>(OBSERVATION_TYPES);
const CONCEPT_SET = new Set<string>(OBSERVATION_CONCEPTS);
const FALLBACK_TYPE = "change";
const MAX_CONCEPTS = 5;

/** Per-field truncation budget so a giant Read doesn't blow the observer's context. */
const FIELD_MAX_CHARS = 16_000;

/** JSON Schema for the observer's structured output (e.g. `codex exec --output-schema`). */
export const OBSERVATION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["observations"],
  properties: {
    observations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "type",
          "title",
          "subtitle",
          "facts",
          "narrative",
          "concepts",
          "files_read",
          "files_modified",
        ],
        properties: {
          type: { type: "string", enum: [...OBSERVATION_TYPES] },
          title: { type: "string" },
          subtitle: { type: "string" },
          facts: { type: "array", items: { type: "string" } },
          narrative: { type: "string" },
          concepts: { type: "array", items: { type: "string" } },
          files_read: { type: "array", items: { type: "string" } },
          files_modified: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
} as const;

export interface ParsedObservation {
  readonly type: string;
  readonly title: string;
  readonly subtitle: string | null;
  readonly facts: string[];
  readonly narrative: string;
  readonly concepts: string[];
  readonly filesRead: string[];
  readonly filesModified: string[];
}

/** A pluggable compression backend (CodexBackend / ClaudeBackend / KeyBackend). */
export interface ObserverBackend {
  readonly name: string;
  available(): Promise<boolean>;
  /** Compress the prompt → a JSON string matching `schema` (or empty/idle output). */
  compress(prompt: string, schema?: Record<string, unknown>): Promise<string>;
}

export interface ObserverDeps {
  readonly store: WorkerStore;
  readonly backend: ObserverBackend;
  readonly broadcast?: (event: string, data: unknown) => void;
  /** Max raw events compressed per call (amortizes the observer's prompt overhead). */
  readonly batchSize?: number;
}

export interface ObserverRunResult {
  readonly sessionId: string;
  readonly observations: Observation[];
}

function truncateField(value: string): string {
  if (value.length <= FIELD_MAX_CHARS) return value;
  const head = Math.floor(FIELD_MAX_CHARS * 0.6);
  const tail = Math.floor(FIELD_MAX_CHARS * 0.3);
  const elided = value.length - head - tail;
  return `${value.slice(0, head)}\n<elided chars="${elided}" reason="oversize" />\n${value.slice(value.length - tail)}`;
}

/** Build the observer instructions + the observed tool-call blocks. */
export function buildObserverPrompt(events: WorkerEvent[]): string {
  const blocks = events
    .map((e) => {
      const parts = [`<tool>${e.toolName ?? "unknown"}</tool>`];
      if (e.inputPreview) parts.push(`<parameters>${truncateField(e.inputPreview)}</parameters>`);
      if (e.outputPreview) parts.push(`<outcome>${truncateField(e.outputPreview)}</outcome>`);
      return `<tool_call>\n${parts.join("\n")}\n</tool_call>`;
    })
    .join("\n\n");

  return [
    "You are an observer that compresses a coding agent's tool calls into searchable memory FOR FUTURE SESSIONS.",
    'Return ONLY JSON matching the required schema: { "observations": [ ... ] }. No prose.',
    "",
    `Each observation's "type" MUST be exactly one of: ${OBSERVATION_TYPES.join(", ")}.`,
    `"concepts" MUST be 2-5 of: ${OBSERVATION_CONCEPTS.join(", ")} (do not use a type as a concept).`,
    '"title" is short; "subtitle" is one sentence (<=24 words); "facts" are self-contained (no pronouns, include filenames/values);',
    '"narrative" gives full context; "files_read"/"files_modified" are paths from the project root.',
    'Merge related calls into one observation. Skip routine/no-op calls (empty reads, trivial listings, successful installs with no change). If nothing is worth recording, return { "observations": [] }.',
    "",
    "Observed tool calls:",
    blocks,
  ].join("\n");
}

function asArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((x): x is string => typeof x === "string" && x.length > 0);
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function stripFence(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return fenced?.[1] ?? raw;
}

export function extractJson(raw: string): unknown {
  const candidate = stripFence(raw).trim();
  if (!candidate) return null;
  try {
    return JSON.parse(candidate);
  } catch {
    // Salvage the first {...} or [...] span (models sometimes wrap JSON in text).
    const start = candidate.search(/[[{]/);
    if (start === -1) return null;
    const open = candidate[start];
    const close = open === "{" ? "}" : "]";
    const end = candidate.lastIndexOf(close);
    if (end <= start) return null;
    try {
      return JSON.parse(candidate.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

function normalizeObservation(raw: unknown): ParsedObservation | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;

  const rawType = asString(o.type).trim();
  const type = TYPE_SET.has(rawType) ? rawType : FALLBACK_TYPE;

  const title = asString(o.title).trim();
  const subtitle = asString(o.subtitle).trim();
  const narrative = asString(o.narrative).trim();
  const facts = asArray(o.facts);

  const concepts = [...new Set(asArray(o.concepts))]
    .filter((c) => CONCEPT_SET.has(c))
    .slice(0, MAX_CONCEPTS);

  const filesRead = asArray(o.files_read);
  const filesModified = asArray(o.files_modified);

  // Skip empty/no-signal observations.
  if (!title && !narrative && facts.length === 0 && concepts.length === 0) return null;

  return {
    type,
    title,
    subtitle: subtitle || null,
    facts,
    narrative,
    concepts,
    filesRead,
    filesModified,
  };
}

/** Tolerantly parse the observer's output (JSON, fenced JSON, or salvageable text) → observations. */
export function parseObserverOutput(raw: string): ParsedObservation[] {
  const parsed = extractJson(raw);
  if (parsed === null) return [];

  let list: unknown[];
  if (Array.isArray(parsed)) {
    list = parsed;
  } else if (
    typeof parsed === "object" &&
    Array.isArray((parsed as Record<string, unknown>).observations)
  ) {
    list = (parsed as Record<string, unknown>).observations as unknown[];
  } else if (typeof parsed === "object") {
    list = [parsed]; // a single bare observation object
  } else {
    return [];
  }

  const out: ParsedObservation[] = [];
  for (const item of list) {
    const obs = normalizeObservation(item);
    if (obs) out.push(obs);
  }
  return out;
}

function toAddInput(sessionId: string, obs: ParsedObservation): AddObservationInput {
  return {
    sessionId,
    type: obs.type,
    title: obs.title,
    subtitle: obs.subtitle,
    facts: obs.facts,
    narrative: obs.narrative,
    concepts: obs.concepts,
    filesRead: obs.filesRead,
    filesModified: obs.filesModified,
  };
}

/**
 * One pass of the observer: claim the oldest pending batch, compress it, store
 * the resulting observations, and drain the batch. Returns null if nothing is
 * pending. If the backend throws, the batch is left pending (retryable).
 */
export async function runObserverOnce(deps: ObserverDeps): Promise<ObserverRunResult | null> {
  const { store, backend, broadcast } = deps;
  const batch = store.nextPendingBatch(deps.batchSize ?? 40);
  if (!batch) return null;

  const prompt = buildObserverPrompt(batch.events);
  // Let backend errors propagate — the batch stays pending so it can be retried.
  const raw = await backend.compress(
    prompt,
    OBSERVATION_SCHEMA as unknown as Record<string, unknown>,
  );
  const parsed = parseObserverOutput(raw);

  const observations: Observation[] = [];
  for (const p of parsed) {
    const stored = store.addObservation(toAddInput(batch.sessionId, p));
    observations.push(stored);
    broadcast?.("new_observation", stored);
  }

  store.markEvents(
    batch.events.map((e) => e.id),
    parsed.length > 0 ? "compressed" : "skipped",
  );

  const queueDepth = store.pendingEventCount();
  broadcast?.("processing_status", { isProcessing: queueDepth > 0, queueDepth });

  return { sessionId: batch.sessionId, observations };
}
