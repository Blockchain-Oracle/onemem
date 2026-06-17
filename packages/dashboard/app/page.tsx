import Link from "next/link";
import { Icon } from "@/components/Icon";
import { fetchRecentSessions, NETWORK } from "@/lib/trace";

export const dynamic = "force-dynamic";

const RT_ICON: Record<string, string> = {
  hermes: "cube",
  "openai-agents": "bolt",
  crewai: "branch",
  livekit: "apps",
  elevenlabs: "apps",
  "vercel-ai": "bolt",
  openclaw: "branch",
  "claude-code": "bolt",
};

export default async function OverviewPage() {
  let sessions: Awaited<ReturnType<typeof fetchRecentSessions>> = [];
  let error: string | null = null;
  try {
    sessions = await fetchRecentSessions(50);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  // Real breakdown: distinct runtimes (environments) + per-runtime session count.
  const byRuntime = new Map<string, number>();
  for (const s of sessions) {
    const key = s.environment || s.agentId || "unknown";
    byRuntime.set(key, (byRuntime.get(key) ?? 0) + 1);
  }
  const runtimes = [...byRuntime.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Overview</div>
          <div className="page-sub">
            Everything your agents did — encrypted, chained, and verifiable on{" "}
            <span className="mono">{NETWORK}</span>.
          </div>
        </div>
        <Link className="btn btn-primary" href="/apps">
          <Icon name="plus" size={16} />
          Add runtime
        </Link>
      </div>

      <div className="stat-grid" style={{ marginBottom: 22 }}>
        <div className="card stat-card">
          <div className="k">
            <Icon name="trace" />
            Sessions
          </div>
          <div className="v">{sessions.length}</div>
          <div className="sub">recent on-chain</div>
        </div>
        <div className="card stat-card">
          <div className="k">
            <Icon name="apps" />
            Runtimes
          </div>
          <div className="v">{runtimes.length}</div>
          <div className="sub">distinct environments</div>
        </div>
        <div className="card stat-card">
          <div className="k" style={{ color: "var(--verify)" }}>
            <Icon name="shield" />
            Verifiable
          </div>
          <div className="v" style={{ color: "var(--verify)" }}>
            {sessions.length}
          </div>
          <div className="sub">Merkle-chained</div>
        </div>
        <div className="card stat-card">
          <div className="k">
            <Icon name="cube" />
            Network
          </div>
          <div className="v mono" style={{ fontSize: "1.5rem" }}>
            {NETWORK}
          </div>
          <div className="sub">Sui + Walrus + Seal</div>
        </div>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20, alignItems: "start" }}
      >
        <div className="card panel">
          <div className="panel-head">
            <h3>Recent sessions</h3>
            <span className="badge badge-live">
              <span className="dot" />
              live
            </span>
          </div>
          <div>
            {error ? (
              <div style={{ padding: 18, color: "var(--danger)" }}>{error}</div>
            ) : sessions.length === 0 ? (
              <div style={{ padding: 18 }} className="muted">
                No sessions yet.
              </div>
            ) : (
              sessions.slice(0, 10).map((s) => (
                <Link key={s.sessionId} className="act-row" href={`/trace/${s.sessionId}`}>
                  <span className="t mono">{`${s.sessionId.slice(0, 8)}…`}</span>
                  <div className="a">
                    <span className="ic-st st-ok">
                      <Icon name="checkCircle" size={16} />
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span className="nm">{s.agentId || "agent"}</span>
                      <div className="rt">{s.environment}</div>
                    </span>
                  </div>
                  <Icon name="chevRight" size={16} className="faint" />
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="card panel">
          <div className="panel-head">
            <h3>Connected runtimes</h3>
          </div>
          <div style={{ padding: 14 }}>
            {runtimes.length === 0 ? (
              <div className="muted">None seen yet.</div>
            ) : (
              runtimes.map(([name, count]) => (
                <div
                  key={name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 0",
                  }}
                >
                  <span className="rt-logo">
                    <Icon name={RT_ICON[name] ?? "cube"} size={16} />
                  </span>
                  <span style={{ flex: 1 }} className="nm">
                    {name}
                  </span>
                  <span className="rt-meta mono">{count} sessions</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
