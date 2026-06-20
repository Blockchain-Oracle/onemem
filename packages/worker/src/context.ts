// Recall context — the readable markdown OneMem injects back into a coding agent
// at SessionStart (the local recent timeline) and UserPromptSubmit (semantic
// hits from MemWal). This is claude-mem's "context injection" — what makes a new
// session pick up where the last one left off.

import type { DurableHit } from "./durable.js";
import type { Observation, Summary } from "./store.js";

const TYPE_EMOJI: Record<string, string> = {
  bugfix: "🔴",
  feature: "🟣",
  refactor: "🔄",
  change: "✅",
  discovery: "🔵",
  decision: "⚖️",
  security_alert: "🚨",
  security_note: "🔐",
};

function emoji(type: string): string {
  return TYPE_EMOJI[type] ?? "•";
}

/** SessionStart: a deterministic recent-timeline preamble from local observations + last summary. */
export function buildContextMarkdown(opts: {
  project: string | null;
  observations: Observation[];
  summary: Summary | null;
}): string {
  const { project, observations, summary } = opts;
  if (observations.length === 0 && !summary) return "";

  const lines: string[] = [`# OneMem — recent context for ${project ?? "this project"}`, ""];
  lines.push(
    `Legend: ${Object.entries(TYPE_EMOJI)
      .map(([k, v]) => `${v}${k}`)
      .join("  ")}`,
  );
  lines.push("");

  if (observations.length) {
    lines.push("Recent work:");
    for (const o of observations) {
      lines.push(`- ${emoji(o.type)} ${o.title}${o.subtitle ? ` — ${o.subtitle}` : ""}`);
    }
    lines.push("");
  }

  if (summary) {
    lines.push("Most recent session summary:");
    const section = (label: string, value: string | null): void => {
      if (value) lines.push(`- **${label}:** ${value}`);
    };
    section("Request", summary.request);
    section("Investigated", summary.investigated);
    section("Learned", summary.learned);
    section("Completed", summary.completed);
    section("Next steps", summary.nextSteps);
  }

  return lines.join("\n").trimEnd();
}

/** UserPromptSubmit: semantic recall hits from the durable store, formatted for injection. */
export function buildRecallMarkdown(query: string, hits: DurableHit[]): string {
  if (hits.length === 0) return "";
  const lines: string[] = [`# OneMem — memories relevant to "${query}"`, ""];
  for (const h of hits) {
    lines.push(`- ${h.text}`);
  }
  return lines.join("\n").trimEnd();
}
