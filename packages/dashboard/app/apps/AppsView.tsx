"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { RuntimeLogo } from "@/components/RuntimeLogo";
import type { RuntimeInventory, RuntimeRow, RuntimeSection } from "@/lib/runtimes";

type Patch = {
  paused?: boolean;
  permissions?: { captureEnabled?: boolean };
};

function captureBadge(row: RuntimeRow): { cls: string; label: string } {
  if (row.paused) return { cls: "cov-paused", label: "Paused" };
  if (!row.captureEnabled) return { cls: "cov-paused", label: "Capture off" };
  return { cls: "cov-full", label: "Capturing" };
}

const SECTIONS: { key: RuntimeSection; title: string; blurb: string }[] = [
  {
    key: "local-runtimes",
    title: "Local runtimes",
    blurb:
      "Agents running on THIS machine. Shipped hook bridges can be controlled locally; pending ports stay read-only until wired.",
  },
  {
    key: "mcp-clients",
    title: "MCP clients",
    blurb:
      "Explicit OneMem tool calls only — no automatic capture or recall. Nothing to control locally.",
  },
  {
    key: "environments",
    title: "Deployed & other environments",
    blurb:
      "Seen on-chain, running off this machine (e.g. a deployed framework adapter). Read-only here — manage from the hosted dashboard.",
  },
];

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

  const grouped = useMemo(() => {
    const by = (s: RuntimeSection) => rows.filter((r) => r.section === s);
    return {
      "local-runtimes": by("local-runtimes"),
      "mcp-clients": by("mcp-clients"),
      environments: by("environments"),
    };
  }, [rows]);

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
        control?: { paused: boolean; permissions: { captureEnabled: boolean } };
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
                captureEnabled: data.control?.permissions.captureEnabled ?? row.captureEnabled,
                statusClass:
                  data.control?.paused || data.control?.permissions.captureEnabled === false
                    ? "sdot-offline"
                    : row.lastMs
                      ? row.statusClass
                      : "sdot-offline",
                statusLabel: data.control?.paused
                  ? "paused"
                  : data.control?.permissions.captureEnabled === false
                    ? "capture off"
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

  function controllableCard(row: RuntimeRow) {
    const badge = captureBadge(row);
    const busy = saving === row.id;
    return (
      <div
        className={`card rt-card${row.paused ? " paused" : ""}`}
        data-testid={`runtime-card-${row.id}`}
        key={row.id}
      >
        <div className="rt-top">
          <div className="rt-logo">
            <RuntimeLogo id={row.id} name={row.name} icon={row.icon} size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="rt-name">{row.name}</div>
            <div className="rt-meta">
              {row.id} · {row.statusLabel}
            </div>
          </div>
          <span className={`sdot ${row.statusClass}`} title={row.statusLabel} />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
          aria-pressed={row.captureEnabled}
          className={`perm${row.paused ? " disabled" : ""}`}
          data-testid={`runtime-capture-${row.id}`}
          disabled={busy || row.paused}
          onClick={() =>
            patchRuntime(row.id, { permissions: { captureEnabled: !row.captureEnabled } })
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
          <span className={`pc${row.captureEnabled ? " on" : ""}`}>
            {row.captureEnabled ? <Icon name="check" size={14} /> : null}
          </span>
          Memory capture
          <span className="rt-meta mono" style={{ marginLeft: "auto" }}>
            {row.tierLabel}
          </span>
        </button>

        {row.installCommand && (
          <div className="copyline">
            <span className="cmd mono">{row.installCommand}</span>
          </div>
        )}
      </div>
    );
  }

  function readonlyCard(row: RuntimeRow) {
    return (
      <div className="card rt-card" data-testid={`runtime-card-${row.id}`} key={row.id}>
        <div className="rt-top">
          <div className="rt-logo">
            <RuntimeLogo id={row.id} name={row.name} icon={row.icon} size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="rt-name">{row.name}</div>
            <div className="rt-meta">
              {row.id} · {row.statusLabel}
            </div>
          </div>
          <span className={`sdot ${row.statusClass}`} title={row.statusLabel} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span className="cov">
            <span className="dot" />
            {row.tierLabel}
          </span>
          <span className="rt-meta mono">{row.sessions} sessions</span>
        </div>
        {row.installCommand && (
          <div className="copyline">
            <span className="cmd mono">{row.installCommand}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Integrations</div>
          <div className="page-sub">
            What OneMem can see, grouped by where it runs. Only runtimes on this machine have local
            controls.
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

      {SECTIONS.map((section) => {
        const sectionRows = grouped[section.key];
        if (sectionRows.length === 0) return null;
        return (
          <section
            key={section.key}
            style={{ marginBottom: 24 }}
            data-testid={`section-${section.key}`}
          >
            <div className="page-title" style={{ fontSize: "1rem" }}>
              {section.title}
            </div>
            <div className="page-sub" style={{ marginBottom: 12 }}>
              {section.blurb}
            </div>
            <div className="rt-grid">
              {sectionRows.map((row) =>
                row.controllable ? controllableCard(row) : readonlyCard(row),
              )}
            </div>
          </section>
        );
      })}
    </>
  );
}
