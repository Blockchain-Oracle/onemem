"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import type { GroupedSessionExport } from "@/lib/session-export";
import type { UnifiedSessionGroup } from "@/lib/sessions";

type State =
  | { kind: "loading" }
  | { kind: "done"; groupedExport: GroupedSessionExport }
  | { kind: "error"; error: string };

type ExportResponse = { ok: true; export: GroupedSessionExport } | { ok: false; error?: string };

export function GroupedReplayModal({
  group,
  onClose,
}: {
  group: UnifiedSessionGroup;
  onClose: () => void;
}) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setCopied(false);
    setState({ kind: "loading" });
    fetch("/api/sessions/export", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionIds: group.sessions.map((session) => session.sessionId) }),
      signal: controller.signal,
    })
      .then(async (res) => {
        const body = (await res.json()) as ExportResponse;
        if (!res.ok || !body.ok) {
          throw new Error(body.ok ? `HTTP ${res.status}` : (body.error ?? `HTTP ${res.status}`));
        }
        return body.export;
      })
      .then((groupedExport) => setState({ kind: "done", groupedExport }))
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setState({ kind: "error", error: err instanceof Error ? err.message : String(err) });
      });
    return () => controller.abort();
  }, [group]);

  const calls = useMemo(() => {
    if (state.kind !== "done") return [];
    return state.groupedExport.sessions
      .flatMap((session) =>
        session.available
          ? session.calls.map((call) => ({
              ...call,
              sessionId: session.sessionId,
              shortId: session.shortId,
              runtime: session.runtime,
            }))
          : [],
      )
      .sort(
        (a, b) =>
          a.capturedAt - b.capturedAt ||
          a.sessionId.localeCompare(b.sessionId) ||
          a.sequence - b.sequence,
      );
  }, [state]);

  async function copyJson() {
    if (state.kind !== "done") return;
    await navigator.clipboard.writeText(JSON.stringify(state.groupedExport, null, 2));
    setCopied(true);
  }

  function downloadJson() {
    if (state.kind !== "done") return;
    const text = JSON.stringify(state.groupedExport, null, 2);
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `onemem-${group.dayKey}-grouped-session.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="replay show" role="dialog" aria-label="Grouped session replay">
      <div className="rp-head">
        <div className="rt">
          <Icon name="replay" size={18} />
          <span style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: "1.1rem" }}>
            Grouped replay
          </span>
          <span className="tag mono">{group.sessionCount} sub-sessions</span>
        </div>
        <button type="button" className="btn-icon" onClick={onClose}>
          <Icon name="x" size={18} />
        </button>
      </div>

      <div className="rp-stage">
        <div className="rp-stage-inner">
          <div className="rp-frame-head">
            <div className="fno">{group.runtimeCount}</div>
            <div>
              <div className="fname">{group.title}</div>
              <div className="fmeta">
                {group.windowLabel} · dashboard-derived group · TraceSession events
              </div>
            </div>
          </div>

          {state.kind === "loading" && (
            <div className="receipt">
              <div className="rcp-row">
                <span className="rk">Status</span>
                <span className="rv mono">loading grouped replay...</span>
              </div>
            </div>
          )}

          {state.kind === "error" && (
            <div className="vd-result on">
              <div className="vd-big bad">
                <span className="vc">
                  <Icon name="x" size={20} />
                </span>
                EXPORT FAILED
              </div>
              <p className="vd-line">{state.error}</p>
            </div>
          )}

          {state.kind === "done" && (
            <>
              <div className="receipt" style={{ marginBottom: 18 }}>
                <div className="rcp-row">
                  <span className="rk">Schema</span>
                  <span className="rv mono">{state.groupedExport.schema}</span>
                </div>
                <div className="rcp-row">
                  <span className="rk">Verified sessions</span>
                  <span className="rv mono">
                    {state.groupedExport.summary.verifiedSessionCount} /{" "}
                    {state.groupedExport.summary.availableSessionCount}
                  </span>
                </div>
                <div className="rcp-row">
                  <span className="rk">Calls</span>
                  <span className="rv mono">{state.groupedExport.summary.callCount}</span>
                </div>
                <div className="rcp-row">
                  <span className="rk">Generated</span>
                  <span className="rv mono">{state.groupedExport.generatedAt}</span>
                </div>
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                {state.groupedExport.sessions.map((session) => (
                  <div className="receipt" key={session.sessionId}>
                    <div className="rcp-row">
                      <span className="rk">Session</span>
                      <span className="rv mono">{session.shortId}</span>
                    </div>
                    {session.available ? (
                      <>
                        <div className="rcp-row">
                          <span className="rk">Runtime</span>
                          <span className="rv">{session.runtime}</span>
                        </div>
                        <div className="rcp-row">
                          <span className="rk">Verify</span>
                          <span className="rv">
                            {session.verify.ok ? "Merkle verified" : "Check failed"} ·{" "}
                            {session.calls.length} calls
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="rcp-row">
                        <span className="rk">Error</span>
                        <span className="rv">{session.error}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
                {calls.length === 0 ? (
                  <div className="card empty" style={{ padding: 18 }}>
                    <h3>No decoded calls</h3>
                    <p>Included sessions loaded, but no ActionCall events were decoded.</p>
                  </div>
                ) : (
                  calls.map((call, index) => (
                    <div className="receipt" key={`${call.sessionId}:${call.callId}`}>
                      <div className="rp-frame-head" style={{ marginBottom: 8 }}>
                        <div className="fno">{index + 1}</div>
                        <div>
                          <div className="fname" style={{ fontSize: "1rem" }}>
                            {call.toolName}
                          </div>
                          <div className="fmeta">
                            {call.runtime} · {call.shortId} · {call.toolNamespace}
                          </div>
                        </div>
                      </div>
                      <div className="rcp-row">
                        <span className="rk">Status</span>
                        <span className="rv">{call.statusLabel}</span>
                      </div>
                      <div className="rcp-row">
                        <span className="rk">Content hash</span>
                        <span className="rv mono">{call.contentHash.slice(0, 22)}...</span>
                      </div>
                      <div className="rcp-row">
                        <span className="rk">Walrus input</span>
                        <span className="rv mono">
                          {call.walrusInputBlob ? `${call.walrusInputBlob.slice(0, 24)}...` : "-"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="rp-foot-note">
        <Icon name="cube" size={14} />
        {state.kind === "done"
          ? state.groupedExport.proofBoundary
          : "Grouped replay is reconstructed from underlying TraceSession metadata."}
      </div>

      <div className="rp-controls">
        <button
          type="button"
          className="btn btn-primary"
          onClick={downloadJson}
          disabled={state.kind !== "done"}
        >
          <Icon name="download" size={16} />
          Download JSON
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={copyJson}
          disabled={state.kind !== "done"}
        >
          <Icon name="copy" size={16} />
          {copied ? "Copied" : "Copy JSON"}
        </button>
        <div className="spacer" />
        <span className="rp-time mono">no plaintext in export</span>
      </div>
    </div>
  );
}
