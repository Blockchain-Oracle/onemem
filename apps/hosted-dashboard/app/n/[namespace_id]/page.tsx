// /n/[namespace_id] — the hosted "watch my deployed app" view. Account-optional,
// link-shareable: lists a namespace's trace sessions by environment, straight
// from chain. This is the honest replacement for the deleted local /apps
// framework cards — a deployed adapter (Vercel AI, etc.) appears here only
// because it actually emitted traces, never as a fake "connected app".

import Link from "next/link";
import { Icon } from "@/components/Icon";
import {
  fetchNamespaceSessions,
  type NamespaceSession,
  NS_NETWORK,
} from "@/lib/namespace-sessions";

export const dynamic = "force-dynamic";

function short(id: string, h = 10, t = 6): string {
  return id.length > h + t + 3 ? `${id.slice(0, h)}…${id.slice(-t)}` : id;
}

function ago(ms: number): string {
  if (!ms) return "—";
  const s = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const chipStyle = (active: boolean) => ({
  padding: "5px 12px",
  borderRadius: 999,
  border: "1px solid var(--line)",
  fontSize: ".82rem",
  textDecoration: "none",
  background: active ? "var(--ink)" : "transparent",
  color: active ? "var(--paper)" : "inherit",
});

export default async function NamespacePage({
  params,
  searchParams,
}: {
  params: Promise<{ namespace_id: string }>;
  searchParams: Promise<{ env?: string }>;
}) {
  const { namespace_id } = await params;
  const { env } = await searchParams;

  let sessions: NamespaceSession[] = [];
  let error: string | null = null;
  try {
    sessions = await fetchNamespaceSessions(namespace_id, { limit: 200 });
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }
  const environments = [...new Set(sessions.map((s) => s.environment).filter(Boolean))].sort();
  const shown = env ? sessions.filter((s) => s.environment === env) : sessions;

  return (
    <main className="container" style={{ maxWidth: 940, padding: "48px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <Icon name="sessions" size={22} />
        <span style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: "1.3rem" }}>
          Namespace traces
        </span>
      </div>
      <p className="muted" style={{ marginBottom: 20 }}>
        Everything your agents and deployed apps recorded into namespace{" "}
        <span className="mono">{short(namespace_id)}</span> on {NS_NETWORK}. Read straight from
        chain — anyone with this link sees the same list; payloads stay Seal-encrypted.
      </p>

      {error && (
        <div className="card" style={{ padding: 16, color: "var(--danger)", marginBottom: 16 }}>
          {error}
        </div>
      )}

      {environments.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          <Link href={`/n/${namespace_id}`} style={chipStyle(!env)}>
            All ({sessions.length})
          </Link>
          {environments.map((e) => (
            <Link
              key={e}
              href={`/n/${namespace_id}?env=${encodeURIComponent(e)}`}
              style={chipStyle(env === e)}
            >
              {e} ({sessions.filter((s) => s.environment === e).length})
            </Link>
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <div className="card" style={{ padding: 22 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>No traces in this namespace yet</div>
          <p className="muted" style={{ fontSize: ".9rem", marginBottom: 12 }}>
            Drop your delegate credential into your deployed app and its traces appear here
            automatically — there is no "connect" step. Set these env vars in your app:
          </p>
          <pre
            className="mono"
            style={{
              background: "var(--paper-2)",
              border: "1px solid var(--line)",
              borderRadius: 8,
              padding: 12,
              fontSize: ".8rem",
              overflowX: "auto",
            }}
          >{`ONEMEM_NAMESPACE_ID=${namespace_id}
ONEMEM_RW_CAP_ID=0x…           # trace write authority (from onboarding)
ONEMEM_DELEGATE_KEY=0x…        # memory write authority
SUI_NETWORK=${NS_NETWORK}`}</pre>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {shown.map((s, i) => (
            <Link
              key={s.sessionId}
              href={`/verify/${s.sessionId}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "13px 18px",
                borderTop: i === 0 ? "none" : "1px solid var(--line)",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <span
                className="mono"
                style={{
                  minWidth: 92,
                  fontSize: ".72rem",
                  padding: "3px 8px",
                  borderRadius: 6,
                  border: "1px solid var(--line)",
                  textAlign: "center",
                }}
              >
                {s.environment || "unknown"}
              </span>
              <span className="mono" style={{ flex: 1, minWidth: 0, fontSize: ".82rem" }}>
                {short(s.sessionId)}
              </span>
              <span className="muted" style={{ fontSize: ".8rem" }}>
                {s.agentId}
              </span>
              <span
                className="muted"
                style={{ fontSize: ".8rem", minWidth: 64, textAlign: "right" }}
              >
                {ago(s.openedAtMs)}
              </span>
              <span
                className="verify-mini ok"
                style={{
                  padding: "4px 10px",
                  display: "inline-flex",
                  gap: 6,
                  alignItems: "center",
                }}
              >
                <Icon name="shield" size={14} /> Verify
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
