// Session summaries — the 5-section "what happened last session" checkpoint that
// powers recall (claude-mem parity: request / investigated / learned / completed
// / next_steps). When a session closes, the observer loop summarizes its
// compressed observations via the same zero-key backend and stores the result.

import { extractJson, type ObserverBackend } from "./observer.js";
import type { Observation, Summary, WorkerStore } from "./store.js";

/** JSON Schema for the structured summary output (e.g. `codex exec --output-schema`). */
export const SUMMARY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  // strict structured output requires EVERY property to be listed here.
  required: ["request", "investigated", "learned", "completed", "next_steps", "notes"],
  properties: {
    request: { type: "string" },
    investigated: { type: "string" },
    learned: { type: "string" },
    completed: { type: "string" },
    next_steps: { type: "string" },
    notes: { type: "string" },
  },
} as const;

export interface ParsedSummary {
  readonly request: string | null;
  readonly investigated: string | null;
  readonly learned: string | null;
  readonly completed: string | null;
  readonly nextSteps: string | null;
  readonly notes: string | null;
}

export interface SummaryDeps {
  readonly store: WorkerStore;
  readonly backend: ObserverBackend;
  readonly broadcast?: (event: string, data: unknown) => void;
}

export function buildSummaryPrompt(
  observations: Observation[],
  opts: { project?: string | null; lastPrompt?: string | null } = {},
): string {
  const lines = observations.map(
    (o) => `- [${o.type}] ${o.title}${o.subtitle ? ` — ${o.subtitle}` : ""}`,
  );
  return [
    "Summarize this coding session into a 5-section progress checkpoint FOR FUTURE SESSIONS.",
    'Return ONLY JSON matching: { "request", "investigated", "learned", "completed", "next_steps", "notes"? }. No prose.',
    "request = the user's goal; investigated = what was explored; learned = key discoveries; completed = what shipped or changed; next_steps = the current trajectory (what's being worked on next, NOT post-session ideas).",
    opts.lastPrompt ? `\nUser's latest prompt:\n${opts.lastPrompt}\n` : "",
    `Observations from the session${opts.project ? ` (project: ${opts.project})` : ""}:`,
    lines.join("\n"),
  ]
    .filter(Boolean)
    .join("\n");
}

function cleanString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** Parse the model's summary output. Returns null only if it's not an object at all. */
export function parseSummaryOutput(raw: string): ParsedSummary | null {
  const parsed = extractJson(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const o = parsed as Record<string, unknown>;
  return {
    request: cleanString(o.request),
    investigated: cleanString(o.investigated),
    learned: cleanString(o.learned),
    completed: cleanString(o.completed),
    nextSteps: cleanString(o.next_steps ?? o.nextSteps),
    notes: cleanString(o.notes),
  };
}

/** An honest fallback derived from the real observations (used if the model output is unusable). */
function fallbackSummary(observations: Observation[]): ParsedSummary {
  const completed = observations.map((o) => `${o.type}: ${o.title}`).join("; ");
  const files = [...new Set(observations.flatMap((o) => o.filesModified))];
  return {
    request: null,
    investigated: null,
    learned: null,
    completed: completed || null,
    nextSteps: null,
    notes: files.length ? `Files touched: ${files.join(", ")}` : null,
  };
}

/**
 * Summarize one closed session that still needs a summary. Returns null if none
 * do. Always stores a summary when a session qualifies (model output, or an
 * honest fallback derived from observations) so the queue can't loop forever.
 */
export async function runSummaryOnce(deps: SummaryDeps): Promise<Summary | null> {
  const { store, backend, broadcast } = deps;
  const sessionId = store.findSessionNeedingSummary();
  if (!sessionId) return null;

  const observations = store.listObservations(sessionId);
  if (observations.length === 0) return null;

  const session = store.getSession(sessionId);
  const lastPrompt = store.listPrompts(sessionId).at(-1)?.text ?? null;
  const prompt = buildSummaryPrompt(observations, {
    project: session?.project ?? null,
    lastPrompt,
  });

  // Let backend errors propagate — the session stays un-summarized (retryable).
  const raw = await backend.compress(prompt, SUMMARY_SCHEMA as unknown as Record<string, unknown>);
  const parsed = parseSummaryOutput(raw);
  const hasContent = parsed && Object.values(parsed).some((v) => v);
  const sections = hasContent ? (parsed as ParsedSummary) : fallbackSummary(observations);

  const summary = store.addSummary({ sessionId, ...sections });
  broadcast?.("new_summary", summary);
  return summary;
}
