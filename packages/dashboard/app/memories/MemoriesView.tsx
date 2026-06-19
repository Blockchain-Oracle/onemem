"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import type { MemoryRef } from "@/lib/memory";
import {
  filterMemories,
  formatTime,
  type MemoryFilter,
  relatedMemories,
  shortId,
} from "@/lib/memory-view";
import { LocalMemoryFeed } from "./LocalMemoryFeed";
import { MemoryDrawer } from "./MemoryDrawer";

const FILTERS: Array<{ key: MemoryFilter; label: string; icon: string }> = [
  { key: "all", label: "All", icon: "memory" },
  { key: "with_blob", label: "With blob", icon: "lock" },
  { key: "without_blob", label: "No blob", icon: "filter" },
  { key: "recent", label: "Recent", icon: "clock" },
  { key: "active_namespace", label: "Active namespace", icon: "shield" },
];

export function MemoriesView({
  memories,
  error,
  network,
  activeNamespaceId,
}: {
  memories: MemoryRef[];
  error: string | null;
  network: string;
  activeNamespaceId: string | null;
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<MemoryFilter>("all");
  const [sel, setSel] = useState<MemoryRef | null>(null);

  const filtered = useMemo(() => {
    return filterMemories(memories, q, filter, activeNamespaceId);
  }, [q, memories, filter, activeNamespaceId]);
  const related = useMemo(() => (sel ? relatedMemories(sel, memories) : []), [sel, memories]);
  const hasQuery = q.trim().length > 0 || filter !== "all";

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Memories</div>
          <div className="page-sub">
            Encrypted memory writes, provenance metadata, and chain receipts.
          </div>
        </div>
      </div>

      <div className="dtoolbar">
        <div className="dsearch">
          <Icon name="search" size={16} />
          <input
            placeholder="Search metadata: session, blob, hash, runtime, tx…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>
      <div className="chips" style={{ marginBottom: 16 }}>
        {FILTERS.map((item) => {
          const disabled = item.key === "active_namespace" && !activeNamespaceId;
          return (
            <button
              key={item.key}
              type="button"
              className={`chip${filter === item.key ? " on" : ""}`}
              disabled={disabled}
              onClick={() => setFilter(item.key)}
              title={disabled ? "Set ONEMEM_NAMESPACE_ID to enable this filter" : undefined}
            >
              <Icon name={item.icon} size={14} />
              {item.label}
            </button>
          );
        })}
      </div>

      <LocalMemoryFeed />

      <div className="card panel">
        <div className="panel-head">
          <h3>{filtered.length} memory events</h3>
          <span className="faint mono" style={{ fontSize: ".72rem" }}>
            metadata-only · derived from on-chain memwal_write
          </span>
        </div>
        {error ? (
          <div style={{ padding: 18, color: "var(--danger)" }}>{error}</div>
        ) : filtered.length === 0 ? (
          <div className="empty" style={{ padding: 38 }}>
            <div className="em-ic">
              <Icon name={hasQuery ? "search" : "memory"} size={20} />
            </div>
            <h3>{hasQuery ? "No matching memory metadata" : "No memory events yet"}</h3>
            <p>
              {hasQuery ? (
                "Try another session, blob, hash, runtime, or transaction value."
              ) : (
                <>
                  Record one with <span className="mono">onemem add</span> or an instrumented SDK
                  runtime.
                </>
              )}
            </p>
          </div>
        ) : (
          <table className="dtable">
            <thead>
              <tr>
                <th>Memory event</th>
                <th className="hide-sm">Origin</th>
                <th className="hide-sm">Namespace</th>
                <th>Proof</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.callId} onClick={() => setSel(m)}>
                  <td>
                    <div className="mtext">
                      <Icon name="lock" size={14} /> {m.label ?? shortId(m.walrusBlobId)}
                      <div className="mt-sub mono">
                        {formatTime(m.capturedAt || m.eventTimestampMs)} · {shortId(m.callId)}
                      </div>
                    </div>
                  </td>
                  <td className="hide-sm">
                    <span className="cls-pill">{m.toolNamespace || "unknown"}</span>
                    <div className="mt-sub mono" style={{ marginTop: 4 }}>
                      {shortId(m.sessionId)}
                    </div>
                  </td>
                  <td className="hide-sm mono">{shortId(m.namespaceId)}</td>
                  <td>
                    <span className="badge badge-verify">
                      <span className="dot" />
                      anchored
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {sel && (
        <MemoryDrawer
          key={sel.callId}
          memory={sel}
          network={network}
          related={related}
          onClose={() => setSel(null)}
          onSelect={setSel}
        />
      )}
    </>
  );
}
