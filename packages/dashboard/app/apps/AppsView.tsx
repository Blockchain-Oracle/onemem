"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import type { RuntimeInventory, RuntimeRow } from "@/lib/runtimes";

type Patch = {
  paused?: boolean;
  permissions?: { traceCapture?: boolean };
};

function coverageLabel(row: RuntimeRow): string {
  return row.coverage === "enforced" ? "Enforced" : "Stored";
}

function traceBadge(row: RuntimeRow): { cls: string; label: string } {
  if (row.paused) return { cls: "cov-paused", label: "Paused" };
  if (!row.traceCapture) return { cls: "cov-paused", label: "Trace off" };
  return { cls: "cov-full", label: "Tracing" };
}

export function AppsView({
  controlsFile,
  initialRows,
  traceError,
}: {
  controlsFile: string;
  initialRows: RuntimeInventory["runtimes"];
  traceError: string | null;
}) {
  const [rows, setRows] = useState(initialRows);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(traceError);

  const sortedRows = useMemo(() => rows, [rows]);

  async function patchRuntime(id: string, patch: Patch) {
    setSaving(id);
    setError(null);
    try {
      const res = await fetch(`/api/runtimes/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        control?: { paused: boolean; permissions: { traceCapture: boolean } };
      };
      if (!res.ok || !data.ok || !data.control) {
        throw new Error(data.error || `request failed (${res.status})`);
      }
      setRows((current) =>
        current.map((row) =>
          row.id === id
            ? {
                ...row,
                paused: data.control?.paused ?? row.paused,
                traceCapture: data.control?.permissions.traceCapture ?? row.traceCapture,
                statusClass:
                  data.control?.paused || data.control?.permissions.traceCapture === false
                    ? "sdot-offline"
                    : row.lastMs
                      ? row.statusClass
                      : "sdot-offline",
                statusLabel: data.control?.paused
                  ? "paused"
                  : data.control?.permissions.traceCapture === false
                    ? "trace off"
                    : row.lastMs
                      ? row.statusLabel
                      : "no sessions",
              }
            : row,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(null);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Apps</div>
          <div className="page-sub">
            Runtime trace policy and verifiable activity from your local OneMem setup.
          </div>
        </div>
      </div>

      {error && (
        <div className="card" style={{ padding: 18, color: "var(--danger)", marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div className="card" style={{ padding: 14, marginBottom: 16 }}>
        <div className="rt-meta">
          Policy file <span className="mono">{controlsFile}</span>
        </div>
      </div>

      <div className="rt-grid">
        {sortedRows.map((row) => {
          const badge = traceBadge(row);
          const busy = saving === row.id;
          return (
            <div
              className={`card rt-card${row.paused ? " paused" : ""}`}
              data-testid={`runtime-card-${row.id}`}
              key={row.id}
            >
              <div className="rt-top">
                <div className="rt-logo">
                  <Icon name={row.icon} size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="rt-name">{row.name}</div>
                  <div className="rt-meta">
                    {row.id} · {row.statusLabel}
                  </div>
                </div>
                <span className={`sdot ${row.statusClass}`} title={row.statusLabel} />
              </div>

              <div
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
              >
                <span className={`cov ${badge.cls}`}>
                  <span className="dot" />
                  {badge.label}
                </span>
                <span className="rt-meta mono">{row.sessions} sessions</span>
              </div>

              <div
                className="vault-row"
                style={{ alignItems: "center", gap: 12, padding: 0, borderBottom: 0 }}
              >
                <span className="k">Pause</span>
                <button
                  aria-label={`${row.paused ? "Resume" : "Pause"} ${row.name}`}
                  className={`toggle${!row.paused ? " on" : ""}`}
                  data-testid={`runtime-pause-${row.id}`}
                  disabled={busy}
                  onClick={() => patchRuntime(row.id, { paused: !row.paused })}
                  type="button"
                />
              </div>

              <button
                aria-pressed={row.traceCapture}
                className={`perm${row.paused ? " disabled" : ""}`}
                data-testid={`runtime-trace-${row.id}`}
                disabled={busy || row.paused}
                onClick={() =>
                  patchRuntime(row.id, { permissions: { traceCapture: !row.traceCapture } })
                }
                style={{
                  background: "none",
                  border: 0,
                  cursor: busy || row.paused ? "not-allowed" : "pointer",
                  paddingLeft: 0,
                  paddingRight: 0,
                  textAlign: "left",
                  width: "100%",
                }}
                type="button"
              >
                <span className={`pc${row.traceCapture ? " on" : ""}`}>
                  {row.traceCapture ? <Icon name="check" size={14} /> : null}
                </span>
                Trace capture
                <span className="rt-meta mono" style={{ marginLeft: "auto" }}>
                  {coverageLabel(row)}
                </span>
              </button>

              {row.installCommand && (
                <div className="copyline">
                  <span className="cmd mono">{row.installCommand}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
