"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Icon } from "@/components/Icon";
import type { UnifiedSessionGroup } from "@/lib/sessions";
import { GroupedReplayModal } from "./GroupedReplayModal";
import { VerifyAllDrawer } from "./VerifyAllDrawer";

export function SessionsView({
  groups,
  error,
}: {
  groups: UnifiedSessionGroup[];
  error: string | null;
}) {
  const [selected, setSelected] = useState<UnifiedSessionGroup | null>(null);
  const [replayGroup, setReplayGroup] = useState<UnifiedSessionGroup | null>(null);
  const [verified, setVerified] = useState<Record<string, boolean>>({});
  const onResult = useCallback((dayKey: string, ok: boolean) => {
    setVerified((prev) => ({ ...prev, [dayKey]: ok }));
  }, []);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Sessions</div>
          <div className="page-sub">Dashboard-derived day groups over on-chain TraceSessions.</div>
        </div>
      </div>

      {error ? (
        <div className="card" style={{ padding: 18, color: "var(--danger)" }}>
          {error}
        </div>
      ) : groups.length === 0 ? (
        <div className="card empty">
          <div className="em-ic">
            <Icon name="sessions" size={20} />
          </div>
          <h3>No sessions yet</h3>
          <p>
            Run an instrumented agent or use <span className="mono">onemem init</span> and your
            runtime provider to create the first verifiable TraceSession.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {groups.map((group) => (
            <section
              className={`card trace-shell${verified[group.dayKey] ? " verified-glow" : ""}`}
              key={group.dayKey}
            >
              <div className="sess-head">
                <div className="sess-top">
                  <div>
                    <div className="sess-id">
                      <span className="lab">Unified session</span>
                      <span className="val">{group.dayLabel}</span>
                    </div>
                    <div className="sess-title">{group.title}</div>
                  </div>
                  <span className={`vbadge${verified[group.dayKey] ? " is-verified pulse" : ""}`}>
                    <Icon name="shield" size={14} />
                    {verified[group.dayKey] ? "All verified" : "Unverified"}
                  </span>
                </div>
                <div className="sess-meta">
                  <Metric k="Runtimes" v={String(group.runtimeCount)} />
                  <Metric k="Sub-sessions" v={String(group.sessionCount)} mono />
                  <Metric k="Window" v={group.windowLabel} mono />
                  <Metric k="Source" v="TraceSession events" />
                </div>
              </div>

              <div className="actions-bar">
                <button type="button" className="btn btn-verify" onClick={() => setSelected(group)}>
                  <Icon name="shield" size={16} />
                  Verify all
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setReplayGroup(group)}
                >
                  <Icon name="replay" size={16} />
                  Replay/export
                </button>
                <span className="faint" style={{ fontSize: ".84rem" }}>
                  This is a dashboard grouping, not a new on-chain object.
                </span>
                <div className="spacer" />
                <span className="faint mono" style={{ fontSize: ".72rem" }}>
                  grouped by local day
                </span>
              </div>

              <div className="gantt">
                <div className="gantt-head">
                  <span className="t">Runtimes - {group.windowLabel}</span>
                </div>
                <div className="lane-gantt">
                  {group.lanes.map((lane) => (
                    <div className="lane" key={lane.runtime}>
                      <div className="lane-label">
                        <span className={`ld ${lane.className}`} />
                        {lane.runtime}
                      </div>
                      <div className="lane-track">
                        {lane.sessions.map((session) => (
                          <Link
                            key={session.sessionId}
                            href={session.href}
                            className={`lane-bar ${lane.className}`}
                            style={{
                              left: `${session.laneLeftPct}%`,
                              width: `${session.laneWidthPct}%`,
                            }}
                            title={`${session.startedLabel} ${session.shortId}`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="gantt-legend">
                  {group.lanes.map((lane) => (
                    <span className="lg" key={lane.runtime}>
                      <i className={lane.className} />
                      {lane.runtime}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--line)" }}>
                <div
                  style={{
                    padding: "14px 22px",
                    fontFamily: "var(--mono)",
                    fontSize: ".72rem",
                    textTransform: "uppercase",
                    letterSpacing: ".08em",
                    color: "var(--ink-3)",
                  }}
                >
                  Sub-sessions
                </div>
                {group.sessions.map((session) => (
                  <Link className="subsess-row" href={session.href} key={session.sessionId}>
                    <span className="mono faint" style={{ fontSize: ".78rem" }}>
                      {session.startedLabel}
                    </span>
                    <span style={{ fontWeight: 500 }}>{session.runtime}</span>
                    <span className="mono xlink">
                      {session.shortId} <Icon name="external" size={14} />
                    </span>
                    <span className="mono faint" style={{ fontSize: ".8rem" }}>
                      {session.agentId}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {selected && (
        <VerifyAllDrawer group={selected} onClose={() => setSelected(null)} onResult={onResult} />
      )}
      {replayGroup && (
        <GroupedReplayModal group={replayGroup} onClose={() => setReplayGroup(null)} />
      )}
    </>
  );
}

function Metric({ k, v, mono = false }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="m">
      <span className="mk">{k}</span>
      <span className={`mv${mono ? " mono" : ""}`}>{v}</span>
    </div>
  );
}
