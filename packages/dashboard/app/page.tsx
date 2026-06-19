import Link from "next/link";
import { Icon } from "@/components/Icon";
import { RuntimeLogo } from "@/components/RuntimeLogo";
import { fetchLocalWorker, type LocalSession } from "@/lib/local-worker";
import { NETWORK } from "@/lib/network";

export const dynamic = "force-dynamic";

async function recentSessions(): Promise<{ sessions: LocalSession[]; error: string | null }> {
  try {
    const res = await fetchLocalWorker("/api/sessions");
    if (!res.ok) return { sessions: [], error: `worker responded ${res.status}` };
    const data = (await res.json()) as { sessions?: LocalSession[] };
    return { sessions: data.sessions ?? [], error: null };
  } catch (e) {
    return { sessions: [], error: e instanceof Error ? e.message : String(e) };
  }
}

export default async function OverviewPage() {
  const { sessions, error } = await recentSessions();

  // Breakdown: distinct runtimes + per-runtime session count (from the local feed).
  const byRuntime = new Map<string, number>();
  for (const s of sessions) {
    const key = s.runtime || "unknown";
    byRuntime.set(key, (byRuntime.get(key) ?? 0) + 1);
  }
  const runtimes = [...byRuntime.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Overview</div>
          <div className="page-sub">
            Your agents' memory, captured live and stored on MemWal (
            <span className="mono">{NETWORK}</span>).
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
            <Icon name="memory" />
            Sessions
          </div>
          <div className="v">{sessions.length}</div>
          <div className="sub">captured locally</div>
        </div>
        <div className="card stat-card">
          <div className="k">
            <Icon name="apps" />
            Runtimes
          </div>
          <div className="v">{runtimes.length}</div>
          <div className="sub">distinct runtimes</div>
        </div>
        <div className="card stat-card">
          <div className="k">
            <Icon name="cube" />
            Network
          </div>
          <div className="v mono" style={{ fontSize: "1.5rem" }}>
            {NETWORK}
          </div>
          <div className="sub">MemWal · Walrus · Seal</div>
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
                No sessions yet. Start a coding session to capture memory.
              </div>
            ) : (
              sessions.slice(0, 10).map((s) => (
                <Link key={s.id} className="act-row" href="/memories">
                  <span className="t mono">{`${s.id.slice(0, 8)}…`}</span>
                  <div className="a">
                    <span className="ic-st">
                      <RuntimeLogo id={s.runtime || "unknown"} icon="memory" size={16} />
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span className="nm">{s.runtime || "runtime"}</span>
                      <div className="rt">{s.status}</div>
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
                    <RuntimeLogo id={name} name={name} icon="cube" size={16} />
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
