"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";

interface HistoryRow {
  readonly capId: string;
  readonly kind: number;
  readonly recipient: string;
  readonly active: boolean;
  readonly status: "active" | "revoked";
  readonly mintedTxDigest: string | null;
  readonly mintedAtMs: number;
  readonly revokedTxDigest: string | null;
  readonly revokedAtMs: number | null;
}

type HistoryState =
  | { readonly status: "idle"; readonly rows: readonly HistoryRow[]; readonly error: null }
  | { readonly status: "loading"; readonly rows: readonly HistoryRow[]; readonly error: null }
  | { readonly status: "ready"; readonly rows: readonly HistoryRow[]; readonly error: null }
  | { readonly status: "error"; readonly rows: readonly HistoryRow[]; readonly error: string };

interface HistoryResponse {
  readonly ok: boolean;
  readonly rows?: readonly HistoryRow[];
  readonly error?: string;
}

function shortId(value: string | null | undefined): string {
  if (!value) return "none";
  return value.length > 22 ? `${value.slice(0, 12)}...${value.slice(-8)}` : value;
}

function kindLabel(kind: number): string {
  if (kind === 0) return "ReadOnly";
  if (kind === 1) return "ReadWrite";
  if (kind === 2) return "Admin";
  return `Unknown(${kind})`;
}

function timeLabel(value: number | null): string {
  if (!value) return "time unavailable";
  return new Date(value).toLocaleString();
}

export function ShareHistoryPanel({
  namespaceId,
  network,
  refreshKey,
}: {
  readonly namespaceId: string;
  readonly network: string;
  readonly refreshKey: number;
}) {
  const [state, setState] = useState<HistoryState>({
    status: "idle",
    rows: [],
    error: null,
  });
  const trimmedNamespace = namespaceId.trim();

  useEffect(() => {
    if (!trimmedNamespace) {
      setState({ status: "idle", rows: [], error: null });
      return;
    }

    const controller = new AbortController();
    setState((current) => ({ status: "loading", rows: current.rows, error: null }));
    const params = new URLSearchParams({
      namespaceId: trimmedNamespace,
      network,
      refreshKey: String(refreshKey),
    });
    fetch(`/api/share/history?${params.toString()}`, { signal: controller.signal })
      .then(async (res) => {
        const body = (await res.json()) as HistoryResponse;
        if (!res.ok || body.ok !== true) {
          throw new Error(body.error ?? `history request failed with ${res.status}`);
        }
        setState({ status: "ready", rows: body.rows ?? [], error: null });
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setState({
          status: "error",
          rows: [],
          error: err instanceof Error ? err.message : String(err),
        });
      });

    return () => controller.abort();
  }, [trimmedNamespace, network, refreshKey]);

  const activeCount = state.rows.filter((row) => row.active).length;
  return (
    <div className="card cap-card" style={{ marginTop: 20 }}>
      <div className="cap-head">
        <div className="cap-title">
          <Icon name="sessions" size={18} /> Capability history
        </div>
        <span className="cap-status mono">
          {state.status === "loading" ? "loading" : `${activeCount}/${state.rows.length} active`}
        </span>
      </div>

      {!trimmedNamespace ? (
        <p className="muted" style={{ fontSize: ".9rem" }}>
          Enter a namespace ID to load event-backed share history from Sui.
        </p>
      ) : state.status === "error" ? (
        <p style={{ color: "var(--danger, #e5484d)", fontSize: ".9rem" }}>{state.error}</p>
      ) : state.rows.length === 0 && state.status !== "loading" ? (
        <p className="muted" style={{ fontSize: ".9rem" }}>
          No event-backed capability history was found for this namespace.
        </p>
      ) : (
        <div className="feed">
          {state.rows.map((row) => (
            <div className="fr" key={row.capId}>
              <span className="ft">{kindLabel(row.kind)}</span>
              <span className="mono" title={row.recipient}>
                {shortId(row.recipient)}
              </span>
              <span className={row.active ? "ft" : "muted"}>{row.status}</span>
              <span className="ft" title={row.capId}>
                {shortId(row.capId)}
              </span>
              <span className="ft" title={row.mintedTxDigest ?? undefined}>
                mint {shortId(row.mintedTxDigest)}
              </span>
              <span className="ft">{timeLabel(row.mintedAtMs)}</span>
              {row.revokedTxDigest ? (
                <span className="ft" title={row.revokedTxDigest}>
                  revoke {shortId(row.revokedTxDigest)} · {timeLabel(row.revokedAtMs)}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
