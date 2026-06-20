"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { RuntimeLogo } from "@/components/RuntimeLogo";
import type {
  LocalObservation,
  LocalPrompt,
  LocalSession,
  LocalSummary,
  ProcessingStatus,
} from "@/lib/local-worker";
import {
  formatTime,
  plural,
  projectName,
  runtimeLabel,
  typeMeta,
  walrusExplorerUrl,
} from "@/lib/memory-view";

type WorkerState = "connecting" | "connected" | "offline";

function upsert<T extends { id: number; createdAt: number }>(items: T[], next: T): T[] {
  const rest = items.filter((item) => item.id !== next.id);
  return [next, ...rest].sort((a, b) => b.createdAt - a.createdAt);
}

export function LocalMemoryFeed() {
  const [observations, setObservations] = useState<LocalObservation[]>([]);
  const [summaries, setSummaries] = useState<LocalSummary[]>([]);
  const [prompts, setPrompts] = useState<LocalPrompt[]>([]);
  const [sessions, setSessions] = useState<LocalSession[]>([]);
  const [processing, setProcessing] = useState<ProcessingStatus>({
    isProcessing: false,
    queueDepth: 0,
  });
  const searchParams = useSearchParams();
  const projectFilter = searchParams.get("project") ?? "all";
  const [query, setQuery] = useState("");
  const [durableActive, setDurableActive] = useState(false);
  const [state, setState] = useState<WorkerState>("connecting");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/worker/observations", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/worker/summaries", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/worker/prompts", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/worker/sessions", { cache: "no-store" }).then((r) => r.json()),
    ])
      .then(([obs, sum, prm, sess]) => {
        if (cancelled) return;
        if (!obs.ok || !sess.ok) {
          setState("offline");
          setError(obs.error ?? sess.error ?? "worker unavailable");
          return;
        }
        setState("connected");
        setObservations(obs.observations ?? []);
        setSummaries(sum.summaries ?? []);
        setPrompts(prm.prompts ?? []);
        setSessions(sess.sessions ?? []);
      })
      .catch((err) => {
        if (cancelled) return;
        setState("offline");
        setError(err instanceof Error ? err.message : String(err));
      });

    fetch("/api/worker/health", { cache: "no-store" })
      .then((r) => r.json())
      .then((h) => {
        if (!cancelled) setDurableActive(Boolean(h?.durable));
      })
      .catch(() => {});

    const events = new EventSource("/api/worker/stream");
    const on = <T,>(name: string, fn: (data: T) => void) =>
      events.addEventListener(name, (e) => {
        setState("connected");
        try {
          fn(JSON.parse((e as MessageEvent).data) as T);
        } catch {
          /* ignore malformed frames */
        }
      });

    events.addEventListener("connected", () => {
      setState("connected");
      setError(null);
    });
    events.addEventListener("worker_unavailable", (e) => {
      setState("offline");
      try {
        setError((JSON.parse((e as MessageEvent).data) as { error?: string }).error ?? "offline");
      } catch {
        setError("worker unavailable");
      }
    });
    on<LocalObservation>("new_observation", (o) => setObservations((c) => upsert(c, o)));
    on<LocalSummary>("new_summary", (s) => setSummaries((c) => upsert(c, s)));
    on<LocalPrompt>("new_prompt", (p) => setPrompts((c) => upsert(c, p)));
    on<{ id: number; blobId: string }>("observation_stored", ({ id, blobId }) =>
      setObservations((c) => c.map((o) => (o.id === id ? { ...o, blobId } : o))),
    );
    on<{ id: number; blobId: string }>("summary_stored", ({ id, blobId }) =>
      setSummaries((c) => c.map((s) => (s.id === id ? { ...s, blobId } : s))),
    );
    on<ProcessingStatus>("processing_status", (p) => setProcessing(p));
    on<LocalSession>("session", (s) => setSessions((c) => upsertSession(c, s)));
    on<LocalSession>("session_ended", (s) => setSessions((c) => upsertSession(c, s)));
    events.onerror = () => setState((c) => (c === "connected" ? c : "offline"));

    return () => {
      cancelled = true;
      events.close();
    };
  }, []);

  const sessionsById = useMemo(() => new Map(sessions.map((s) => [s.id, s])), [sessions]);

  const projectOf = useCallback(
    (sessionId: string): string =>
      sessionsById.get(sessionId)?.project ?? projectName(sessionsById.get(sessionId)?.projectPath),
    [sessionsById],
  );

  const feed = useMemo(() => {
    type Item =
      | {
          kind: "observation";
          key: string;
          createdAt: number;
          sessionId: string;
          data: LocalObservation;
        }
      | { kind: "summary"; key: string; createdAt: number; sessionId: string; data: LocalSummary }
      | { kind: "prompt"; key: string; createdAt: number; sessionId: string; data: LocalPrompt };
    const items: Item[] = [
      ...observations.map((d) => ({
        kind: "observation" as const,
        key: `o${d.id}`,
        createdAt: d.createdAt,
        sessionId: d.sessionId,
        data: d,
      })),
      ...summaries.map((d) => ({
        kind: "summary" as const,
        key: `s${d.id}`,
        createdAt: d.createdAt,
        sessionId: d.sessionId,
        data: d,
      })),
      ...prompts.map((d) => ({
        kind: "prompt" as const,
        key: `p${d.id}`,
        createdAt: d.createdAt,
        sessionId: d.sessionId,
        data: d,
      })),
    ];
    const q = query.trim().toLowerCase();
    const matches = (i: Item): boolean => {
      if (!q) return true;
      if (i.kind === "observation") {
        const o = i.data;
        return [
          o.title,
          o.subtitle,
          o.narrative,
          o.type,
          ...o.facts,
          ...o.concepts,
          ...o.filesModified,
          ...o.filesRead,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);
      }
      if (i.kind === "summary") {
        const s = i.data;
        return [s.request, s.investigated, s.learned, s.completed, s.nextSteps, s.notes]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);
      }
      return i.data.text.toLowerCase().includes(q);
    };
    return items
      .filter((i) => projectFilter === "all" || projectOf(i.sessionId) === projectFilter)
      .filter(matches)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [observations, summaries, prompts, projectFilter, projectOf, query]);

  const storedCount =
    observations.filter((o) => o.blobId).length + summaries.filter((s) => s.blobId).length;

  return (
    <div className="mem-feed">
      <header className="mem-feed-head">
        <div>
          <h2>Memory</h2>
          <p className="mem-feed-sub">
            Readable memory your coding agents capture, compressed on-device and stored on Walrus.
          </p>
        </div>
        <div className="mem-feed-actions">
          <input
            className="mem-search"
            type="search"
            placeholder="Search memory…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search memory"
          />
          <span className={`badge ${state === "connected" ? "badge-live" : "badge-grey"}`}>
            {processing.isProcessing && <Icon name="memory" size={14} className="om-spin" />}
            <span className="dot" />
            {state !== "connected"
              ? state
              : processing.isProcessing
                ? `compressing ${processing.queueDepth}…`
                : "live"}
          </span>
        </div>
      </header>

      <div className="mem-stats">
        <span>{plural(observations.length, "observation")}</span>
        <span>{plural(summaries.length, "summary", "summaries")}</span>
        <span>{storedCount} stored on Walrus</span>
        <span>{plural(sessions.length, "session")}</span>
      </div>

      {feed.length === 0 ? (
        <EmptyState state={state} error={error} hasSessions={sessions.length > 0} />
      ) : (
        <div className="mem-cards">
          {feed.map((item) =>
            item.kind === "observation" ? (
              <ObservationCard
                key={item.key}
                obs={item.data}
                runtime={sessionsById.get(item.sessionId)?.runtime ?? "worker"}
                project={projectOf(item.sessionId)}
                durableActive={durableActive}
              />
            ) : item.kind === "summary" ? (
              <SummaryCard
                key={item.key}
                summary={item.data}
                project={projectOf(item.sessionId)}
                durableActive={durableActive}
              />
            ) : (
              <PromptCard key={item.key} prompt={item.data} />
            ),
          )}
        </div>
      )}
    </div>
  );
}

/** Honest durable-storage state: real explorer link, in-flight upload, or nothing. */
function WalrusBadge({ blobId, durableActive }: { blobId: string | null; durableActive: boolean }) {
  if (blobId) {
    return (
      <a
        className="mem-stored"
        href={walrusExplorerUrl(blobId)}
        target="_blank"
        rel="noreferrer"
        title="View this memory on the Walrus explorer"
      >
        ◆ Walrus ↗
      </a>
    );
  }
  if (durableActive) {
    return (
      <span className="mem-saving" title="Uploading to Walrus…">
        ⋯ saving to Walrus
      </span>
    );
  }
  return null;
}

function ObservationCard({
  obs,
  runtime,
  project,
  durableActive,
}: {
  obs: LocalObservation;
  runtime: string;
  project: string;
  durableActive: boolean;
}) {
  const meta = typeMeta(obs.type);
  const [showFacts, setShowFacts] = useState(false);
  const hasFacts = obs.facts.length > 0;
  const files = [
    ...obs.filesModified,
    ...obs.filesRead.filter((f) => !obs.filesModified.includes(f)),
  ];

  return (
    <article className={`mem-card mem-obs ${meta.cls}`}>
      <div className="mem-card-top">
        <span className={`mem-type ${meta.cls}`}>
          <span aria-hidden>{meta.emoji}</span> {meta.label}
        </span>
        <span className="mem-meta mono">
          <RuntimeLogo id={runtime} name={runtimeLabel(runtime)} icon="memory" size={14} />
          {runtimeLabel(runtime)} · {project} · {formatTime(obs.createdAt)}
          <WalrusBadge blobId={obs.blobId} durableActive={durableActive} />
        </span>
      </div>
      <h3 className="mem-title">{obs.title}</h3>
      {obs.subtitle && <p className="mem-subtitle">{obs.subtitle}</p>}

      {hasFacts && (
        <div className="mem-toggle">
          <button
            type="button"
            className={showFacts ? "on" : ""}
            onClick={() => setShowFacts(true)}
          >
            Facts
          </button>
          <button
            type="button"
            className={!showFacts ? "on" : ""}
            onClick={() => setShowFacts(false)}
          >
            Narrative
          </button>
        </div>
      )}
      {showFacts && hasFacts ? (
        <ul className="mem-facts">
          {obs.facts.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      ) : (
        obs.narrative && <p className="mem-narrative">{obs.narrative}</p>
      )}

      {(files.length > 0 || obs.concepts.length > 0) && (
        <div className="mem-card-foot">
          {files.length > 0 && (
            <div className="mem-files">
              <Icon name="memory" size={14} />
              {files.map((f) => (
                <code key={f} className={obs.filesModified.includes(f) ? "modified" : "read"}>
                  {f}
                </code>
              ))}
            </div>
          )}
          {obs.concepts.length > 0 && (
            <div className="mem-concepts">
              {obs.concepts.map((c) => (
                <span key={c}>{c}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function SummaryCard({
  summary,
  project,
  durableActive,
}: {
  summary: LocalSummary;
  project: string;
  durableActive: boolean;
}) {
  const sections: Array<[string, string | null]> = [
    ["Request", summary.request],
    ["Investigated", summary.investigated],
    ["Learned", summary.learned],
    ["Completed", summary.completed],
    ["Next steps", summary.nextSteps],
  ];
  return (
    <article className="mem-card mem-summary">
      <div className="mem-card-top">
        <span className="mem-type t-summary">
          <span aria-hidden>📋</span> Session summary
        </span>
        <span className="mem-meta mono">
          {project} · {formatTime(summary.createdAt)}
          <WalrusBadge blobId={summary.blobId} durableActive={durableActive} />
        </span>
      </div>
      <dl className="mem-summary-sections">
        {sections
          .filter(([, v]) => v)
          .map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
      </dl>
    </article>
  );
}

function PromptCard({ prompt }: { prompt: LocalPrompt }) {
  return (
    <article className="mem-card mem-prompt">
      <div className="mem-card-top">
        <span className="mem-type t-prompt">
          <span aria-hidden>💬</span> Prompt
        </span>
        <span className="mem-meta mono">{formatTime(prompt.createdAt)}</span>
      </div>
      <p className="mem-prompt-text">{prompt.text}</p>
    </article>
  );
}

function EmptyState({
  state,
  error,
  hasSessions,
}: {
  state: WorkerState;
  error: string | null;
  hasSessions: boolean;
}) {
  return (
    <div className="empty mem-empty">
      <div className="em-ic">
        <Icon name={state === "offline" ? "info" : "memory"} size={20} />
      </div>
      <h3>
        {state === "offline"
          ? "Local worker not connected"
          : hasSessions
            ? "Sessions connected — capturing"
            : "Waiting for your first memory"}
      </h3>
      <p>
        {state === "offline"
          ? `Start a coding session with OneMem installed to stream memory here. ${error ?? ""}`
          : "As your agent works, tool calls are compressed into readable memories and appear here live."}
      </p>
    </div>
  );
}

function upsertSession(items: LocalSession[], next: LocalSession): LocalSession[] {
  const rest = items.filter((s) => s.id !== next.id);
  return [next, ...rest].sort((a, b) => b.startedAt - a.startedAt);
}
