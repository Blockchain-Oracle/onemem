"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import type { UnifiedSessionGroup, VerifySessionsResponse } from "@/lib/sessions";

type State =
  | { kind: "loading" }
  | { kind: "done"; response: VerifySessionsResponse }
  | { kind: "error"; error: string };

export function VerifyAllDrawer({
  group,
  onClose,
  onResult,
}: {
  group: UnifiedSessionGroup;
  onClose: () => void;
  onResult: (dayKey: string, ok: boolean) => void;
}) {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    setState({ kind: "loading" });
    fetch("/api/sessions/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionIds: group.sessions.map((s) => s.sessionId) }),
      signal: controller.signal,
    })
      .then(async (res) => {
        const body = (await res.json()) as unknown;
        if (!res.ok || !isVerifyResponse(body)) {
          const error = errorMessage(body) ?? `HTTP ${res.status}`;
          throw new Error(error);
        }
        return body;
      })
      .then((response) => {
        setState({ kind: "done", response });
        onResult(group.dayKey, response.ok);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setState({ kind: "error", error: err instanceof Error ? err.message : String(err) });
        onResult(group.dayKey, false);
      });
    return () => controller.abort();
  }, [group, onResult]);

  const progress =
    state.kind === "done" ? `${state.response.verifiedCount} / ${state.response.total}` : "0 / 0";

  return (
    <>
      <button
        type="button"
        className="vd-scrim show"
        aria-label="Close verify drawer"
        onClick={onClose}
      />
      <div className="verify-drawer show drawer-up" role="dialog" aria-label="Verify all sessions">
        <div className="vd-grip" />
        <div className="vd-head">
          <div>
            <h3>
              <Icon name="shield" size={20} />
              {state.kind === "loading"
                ? "Verifying all sub-sessions"
                : state.kind === "done" && state.response.ok
                  ? "All sub-sessions verified"
                  : "Verification failed"}
            </h3>
            <div className="sub">walking each TraceSession chain from Sui</div>
          </div>
          <button type="button" className="btn-icon" onClick={onClose}>
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="vd-body">
          {state.kind === "loading" && (
            <div className="vd-progress">
              <div className="pct">
                <span className="big mono">verifying...</span>
                <span className="small">{group.sessionCount} sub-sessions queued</span>
              </div>
              <div className="vd-track">
                <div className="vd-fill" style={{ width: "48%" }} />
              </div>
            </div>
          )}

          {state.kind === "error" && (
            <div className="vd-result on">
              <div className="vd-big bad">
                <span className="vc">
                  <Icon name="x" size={20} />
                </span>
                REQUEST FAILED
              </div>
              <p className="vd-line">{state.error}</p>
            </div>
          )}

          {state.kind === "done" && (
            <>
              <div className="vd-progress">
                <div className="pct">
                  <span className="big mono">{progress}</span>
                  <span className="small">sub-sessions verified</span>
                </div>
                <div className="vd-track">
                  <div
                    className={`vd-fill ${state.response.ok ? "done" : "broken"}`}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              <div className="vd-checklist">
                {state.response.results.map((result) => (
                  <div className="vchk" key={result.sessionId}>
                    <span className={`ci ${result.ok ? "ok" : "bad"}`}>
                      <Icon name={result.ok ? "check" : "xCircle"} size={14} />
                    </span>
                    <span className="cn mono">{result.shortId}</span>
                    <span className="ch">
                      {result.error
                        ? result.error
                        : `${result.callCount} calls - ${result.statusLabel}`}
                    </span>
                  </div>
                ))}
              </div>

              <div className="vd-result on">
                <div className={`vd-big ${state.response.ok ? "ok" : "bad"}`}>
                  <span className="vc">
                    <Icon name={state.response.ok ? "check" : "x"} size={20} />
                  </span>
                  {state.response.ok ? "ALL VERIFIED" : "CHECK FAILED"}
                </div>
                <p className="vd-line">
                  Verification proves the Merkle integrity of each underlying TraceSession. It does
                  not prove plaintext content or real-world correctness.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function isVerifyResponse(value: unknown): value is VerifySessionsResponse {
  return Boolean(value && typeof value === "object" && "results" in value);
}

function errorMessage(value: unknown): string | null {
  if (value && typeof value === "object" && "error" in value) {
    const error = (value as { error?: unknown }).error;
    return typeof error === "string" ? error : null;
  }
  return null;
}
