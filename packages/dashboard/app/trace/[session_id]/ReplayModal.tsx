"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import type { TraceSessionExport } from "@/lib/session-export";
import type { ViewCall } from "./types";

// Steps through the session's calls reconstructed from on-chain metadata.
// Full content replay (Walrus + Seal decrypt) lands with the SessionKey flow.

type ExportState =
  | { kind: "loading" }
  | { kind: "done"; traceExport: TraceSessionExport }
  | { kind: "error"; error: string };

type ExportResponse = { ok: true; export: TraceSessionExport } | { ok: false; error?: string };

export function ReplayModal({
  sessionId,
  calls,
  onClose,
}: {
  sessionId: string;
  calls: ViewCall[];
  onClose: () => void;
}) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [exportState, setExportState] = useState<ExportState>({ kind: "loading" });
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const total = calls.length;
  const cur = calls[i];

  // `i` is a dependency on purpose: each advance re-runs the effect to schedule
  // the next frame.
  // biome-ignore lint/correctness/useExhaustiveDependencies: i drives re-scheduling
  useEffect(() => {
    if (!playing) return;
    timer.current = setTimeout(() => {
      setI((prev) => {
        if (prev < total - 1) return prev + 1;
        setPlaying(false);
        return prev;
      });
    }, 1400 / speed);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [playing, i, speed, total]);

  useEffect(() => {
    const controller = new AbortController();
    setCopied(false);
    setExportState({ kind: "loading" });
    fetch(`/api/trace/${encodeURIComponent(sessionId)}/export`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        const body = (await res.json()) as ExportResponse;
        if (!res.ok || !body.ok) {
          throw new Error(body.ok ? `HTTP ${res.status}` : (body.error ?? `HTTP ${res.status}`));
        }
        return body.export;
      })
      .then((traceExport) => setExportState({ kind: "done", traceExport }))
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setExportState({ kind: "error", error: err instanceof Error ? err.message : String(err) });
      });
    return () => controller.abort();
  }, [sessionId]);

  if (!cur) return null;
  const pct = total > 1 ? (i / (total - 1)) * 100 : 100;

  async function copyJson() {
    if (exportState.kind !== "done") return;
    await navigator.clipboard.writeText(JSON.stringify(exportState.traceExport, null, 2));
    setCopied(true);
  }

  function downloadJson() {
    if (exportState.kind !== "done") return;
    const text = JSON.stringify(exportState.traceExport, null, 2);
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `onemem-${sessionId.slice(0, 10)}-trace-session.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="replay show" role="dialog" aria-label="Replay session">
      <div className="rp-head">
        <div className="rt">
          <Icon name="play" size={18} />
          <span style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: "1.1rem" }}>
            Replay
          </span>
          <span className="tag mono">{total} calls</span>
        </div>
        <button type="button" className="btn-icon" onClick={onClose}>
          <Icon name="x" size={18} />
        </button>
      </div>
      <div className="rp-stage">
        <div className="rp-stage-inner">
          <div className="rp-frame-head">
            <div className="fno">{i + 1}</div>
            <div>
              <div className="fname">{cur.toolName}</div>
              <div className="fmeta">
                {cur.toolNamespace} · +{(cur.startMs / 1000).toFixed(2)}s ·{" "}
                {cur.durationMs ? `${cur.durationMs}ms` : "open"}
              </div>
            </div>
          </div>
          <div className="receipt" style={{ marginTop: 14 }}>
            <div className="rcp-row">
              <span className="rk">Export schema</span>
              <span className="rv mono">
                {exportState.kind === "done"
                  ? exportState.traceExport.schema
                  : exportState.kind === "loading"
                    ? "loading..."
                    : "unavailable"}
              </span>
            </div>
            <div className="rcp-row">
              <span className="rk">Content hash</span>
              <span className="rv mono">{cur.contentHash.slice(0, 20)}…</span>
            </div>
            <div className="rcp-row">
              <span className="rk">Walrus input</span>
              <span className="rv mono">
                {cur.walrusInputBlob ? `${cur.walrusInputBlob.slice(0, 18)}…` : "—"}
              </span>
            </div>
            <div className="rcp-row">
              <span className="rk">Status</span>
              <span className="rv">
                {cur.status === 2 ? "failed" : cur.status === 1 ? "success" : "open"}
              </span>
            </div>
            {exportState.kind === "error" ? (
              <div className="rcp-row">
                <span className="rk">Export error</span>
                <span className="rv">{exportState.error}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <div className="rp-foot-note">
        <Icon name="cube" size={14} />
        {exportState.kind === "done"
          ? exportState.traceExport.proofBoundary
          : "Reconstructed from on-chain commits. The export contains proof metadata only; no plaintext is included."}
      </div>
      <div className="rp-controls">
        <button
          type="button"
          className="btn btn-primary"
          onClick={downloadJson}
          disabled={exportState.kind !== "done"}
        >
          <Icon name="download" size={16} />
          Download JSON
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={copyJson}
          disabled={exportState.kind !== "done"}
        >
          <Icon name="copy" size={16} />
          {copied ? "Copied" : "Copy JSON"}
        </button>
        <div className="rp-transport">
          <button type="button" className="rp-tbtn" onClick={() => setI((p) => Math.max(0, p - 1))}>
            <Icon name="skipBack" size={18} />
          </button>
          <button type="button" className="rp-tbtn play" onClick={() => setPlaying((p) => !p)}>
            <Icon name={playing ? "pause" : "play"} size={18} />
          </button>
          <button
            type="button"
            className="rp-tbtn"
            onClick={() => setI((p) => Math.min(total - 1, p + 1))}
          >
            <Icon name="skipFwd" size={18} />
          </button>
        </div>
        <div className="rp-scrub">
          <span className="rp-time mono">{i + 1}</span>
          <div className="rp-bar">
            <div className="rp-bar-fill" style={{ width: `${pct}%` }} />
            <div className="rp-bar-knob" style={{ left: `${pct}%` }} />
          </div>
          <span className="rp-time mono">{total}</span>
        </div>
        <div className="rp-speed">
          {[0.5, 1, 2].map((s) => (
            <button
              key={s}
              type="button"
              className={speed === s ? "on" : ""}
              onClick={() => setSpeed(s)}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
