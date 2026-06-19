"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { RuntimeLogo } from "@/components/RuntimeLogo";
import type { LocalObservation, LocalSession } from "@/lib/local-worker";
import { formatTime, shortId } from "@/lib/memory-view";

type WorkerState = "connecting" | "connected" | "offline";

function upsertObservation(items: LocalObservation[], next: LocalObservation): LocalObservation[] {
  const idx = items.findIndex((item) => item.id === next.id);
  if (idx === -1) return [next, ...items].sort((a, b) => b.createdAt - a.createdAt);
  const copy = [...items];
  copy[idx] = next;
  return copy.sort((a, b) => b.createdAt - a.createdAt);
}

export function LocalMemoryFeed() {
  const [observations, setObservations] = useState<LocalObservation[]>([]);
  const [sessions, setSessions] = useState<LocalSession[]>([]);
  const [projectFilter, setProjectFilter] = useState("all");
  const [state, setState] = useState<WorkerState>("connecting");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/worker/observations", { cache: "no-store" }).then((res) => res.json()),
      fetch("/api/worker/sessions", { cache: "no-store" }).then((res) => res.json()),
    ])
      .then(
        ([observationsData, sessionsData]: [
          { ok?: boolean; observations?: LocalObservation[]; error?: string },
          { ok?: boolean; sessions?: LocalSession[]; error?: string },
        ]) => {
          if (cancelled) return;
          if (!observationsData.ok || !sessionsData.ok) {
            setState("offline");
            setError(observationsData.error ?? sessionsData.error ?? "worker unavailable");
            return;
          }
          setState("connected");
          setObservations(observationsData.observations ?? []);
          setSessions(sessionsData.sessions ?? []);
        },
      )
      .catch((err) => {
        if (cancelled) return;
        setState("offline");
        setError(err instanceof Error ? err.message : String(err));
      });

    const events = new EventSource("/api/worker/stream");
    events.addEventListener("connected", () => {
      setState("connected");
      setError(null);
    });
    events.addEventListener("worker_unavailable", (event) => {
      setState("offline");
      try {
        const data = JSON.parse((event as MessageEvent).data) as { error?: string };
        setError(data.error ?? "worker unavailable");
      } catch {
        setError("worker unavailable");
      }
    });
    events.addEventListener("new_observation", (event) => {
      setState("connected");
      const observation = JSON.parse((event as MessageEvent).data) as LocalObservation;
      setObservations((current) => upsertObservation(current, observation));
    });
    events.addEventListener("session", (event) => {
      setState("connected");
      const session = JSON.parse((event as MessageEvent).data) as LocalSession;
      setSessions((current) => upsertSession(current, session));
    });
    events.addEventListener("session_ended", (event) => {
      const session = JSON.parse((event as MessageEvent).data) as LocalSession;
      setSessions((current) => upsertSession(current, session));
    });
    events.addEventListener("proof_update", (event) => {
      const observation = JSON.parse((event as MessageEvent).data) as LocalObservation;
      setObservations((current) => upsertObservation(current, observation));
    });
    events.onerror = () => {
      setState((current) => (current === "connected" ? current : "offline"));
    };
    return () => {
      cancelled = true;
      events.close();
    };
  }, []);

  const sessionsById = useMemo(
    () => new Map(sessions.map((session) => [session.id, session])),
    [sessions],
  );
  const projects = useMemo(() => {
    const names = new Set<string>();
    for (const session of sessions) names.add(projectName(session.projectPath));
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [sessions]);
  const latest = useMemo(() => {
    return observations
      .filter((observation) => {
        if (projectFilter === "all") return true;
        return projectName(sessionsById.get(observation.sessionId)?.projectPath) === projectFilter;
      })
      .slice(0, 8);
  }, [observations, projectFilter, sessionsById]);

  return (
    <div className="card panel" style={{ marginBottom: 16 }}>
      <div className="panel-head">
        <div>
          <h3>Readable local memories</h3>
          <div className="panel-sub">
            Worker-first view of captured tool observations, before decentralized proof settles.
          </div>
        </div>
        <div className="local-feed-actions">
          {projects.length > 1 && (
            <select
              aria-label="Filter local memories by project"
              className="local-project-select"
              value={projectFilter}
              onChange={(event) => setProjectFilter(event.target.value)}
            >
              <option value="all">All projects</option>
              {projects.map((project) => (
                <option value={project} key={project}>
                  {project}
                </option>
              ))}
            </select>
          )}
          <span className={`badge ${state === "connected" ? "badge-live" : "badge-grey"}`}>
            <span className="dot" />
            {state === "connected" ? "worker connected" : state}
          </span>
        </div>
      </div>
      <div className="local-feed-stats">
        <span>{observations.length} observations</span>
        <span>{sessions.length} local sessions</span>
        <span>{projects.length || 0} projects</span>
      </div>
      {latest.length === 0 ? (
        <div className="empty local-feed-empty">
          <div className="em-ic">
            <Icon name={state === "offline" ? "info" : "memory"} size={20} />
          </div>
          <h3>
            {state === "offline"
              ? "Local worker is not connected"
              : sessions.length > 0
                ? "Sessions are connected; no observations captured yet"
                : "Waiting for local observations"}
          </h3>
          <p>
            {state === "offline"
              ? `The on-chain receipt table below still works. Worker detail: ${error ?? "not available"}.`
              : "Agent hooks will stream readable tool input/output here before on-chain proof settles."}
          </p>
        </div>
      ) : (
        <div className="local-feed-list">
          {latest.map((observation) => (
            <MemoryObservation
              key={observation.id}
              observation={observation}
              session={sessionsById.get(observation.sessionId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MemoryObservation({
  observation,
  session,
}: {
  observation: LocalObservation;
  session?: LocalSession;
}) {
  const runtimeId = session?.runtime ?? observation.toolNamespace ?? "worker";
  const runtimeLabel = labelForRuntime(runtimeId);
  const project = projectName(session?.projectPath);
  return (
    <div className="local-feed-row">
      <span className="rt-logo">
        <RuntimeLogo id={runtimeId} name={runtimeLabel} icon="memory" size={18} />
      </span>
      <div className="local-feed-main">
        <div className="local-feed-title">
          <div>
            <span>{runtimeLabel} observation</span>
            <div className="mt-sub mono">
              {project} · {formatTime(observation.createdAt)} · {shortId(observation.sessionId)}
            </div>
          </div>
          <span className="badge badge-grey">{observation.proofStatus}</span>
        </div>
        <div className="local-feed-tags">
          <span>{observation.toolName ?? observation.type}</span>
          <span>{observation.type.replaceAll("_", " ")}</span>
          {session?.status && <span>{session.status}</span>}
        </div>
        <Preview label="Output" value={observation.outputPreview} />
        <Preview label="Input" value={observation.inputPreview} />
      </div>
    </div>
  );
}

function upsertSession(items: LocalSession[], next: LocalSession): LocalSession[] {
  const idx = items.findIndex((item) => item.id === next.id);
  if (idx === -1) return [next, ...items].sort((a, b) => b.startedAt - a.startedAt);
  const copy = [...items];
  copy[idx] = next;
  return copy.sort((a, b) => b.startedAt - a.startedAt);
}

function projectName(path: string | null | undefined): string {
  if (!path) return "unknown project";
  const clean = path.replace(/\/+$/, "");
  return clean.split("/").pop() || clean;
}

function labelForRuntime(id: string): string {
  const key = id.toLowerCase();
  if (key === "claude-code") return "Claude Code";
  if (key === "codex") return "Codex";
  if (key === "openclaw") return "OpenClaw";
  if (key === "windsurf") return "Windsurf";
  if (key === "cursor") return "Cursor";
  return id;
}

function Preview({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="local-preview">
      <span>{label}</span>
      <code>{value}</code>
    </div>
  );
}
