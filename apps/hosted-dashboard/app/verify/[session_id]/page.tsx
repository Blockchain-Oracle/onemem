import { Icon } from "@/components/Icon";
import { loadPublicVerifySession, rootPreview, shortId } from "@/lib/public-verify";

export const dynamic = "force-dynamic";

type Params = Promise<{ session_id: string }>;

const PROVEN = [
  "The recorded call sequence is intact and unmodified.",
  "Each call's hash links to the previous call in the Merkle chain.",
  "The re-derived root matches the TraceSession root anchored on Sui.",
];

const NOT_PROVEN = [
  "Plaintext input or output contents; Walrus blobs can remain Seal-encrypted.",
  "That the agent really completed a real-world action outside the trace.",
  "Agent intent, business correctness, or whether the chosen tool was appropriate.",
];

export default async function PublicVerifyPage({ params }: { params: Params }) {
  const { session_id } = await params;
  let data: Awaited<ReturnType<typeof loadPublicVerifySession>> | null = null;
  let error: string | null = null;

  try {
    data = await loadPublicVerifySession(session_id);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const ok = data?.verify.ok ?? false;

  return (
    <main className="container" style={{ maxWidth: 920, padding: "44px 24px 80px" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
        <Icon name="cube" size={20} />
        <span style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: "1.2rem" }}>
          OneMem
        </span>
        <span className="badge badge-chain" style={{ marginLeft: 6 }}>
          <span className="dot" />
          public verifier
        </span>
      </header>

      {error || !data ? (
        <div className="card" style={{ padding: 28 }}>
          <span className="badge badge-grey">
            <Icon name="xCircle" size={14} />
            Unavailable
          </span>
          <h1 style={{ fontSize: 24, marginTop: 14 }}>Session not found</h1>
          <p style={{ color: "var(--danger)", marginTop: 8 }}>{error}</p>
          <p className="muted" style={{ marginTop: 12, fontSize: ".92rem" }}>
            This public page only verifies an existing on-chain TraceSession. It does not require
            login or wallet access.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 18 }}>
          <section
            className={`card trace-shell${ok ? " verified-glow" : ""}`}
            style={{ padding: 28 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 18,
              }}
            >
              <div>
                <span className="eyebrow">
                  <span className="tick">✦</span>
                  Trace verification
                </span>
                <h1 style={{ fontSize: 30, marginTop: 10 }}>
                  {ok ? "This trace is verified." : "Verification failed."}
                </h1>
                <p className="mono" style={{ color: "var(--ink-2)", marginTop: 6, fontSize: 13 }}>
                  {shortId(data.sessionId, 16, 10)}
                </p>
              </div>
              <span
                className={`badge ${ok ? "badge-verify" : "badge-grey"}`}
                style={ok ? { animation: "verify-pulse 1.4s ease-out 2" } : undefined}
              >
                <Icon name={ok ? "shield" : "xCircle"} size={14} />
                {ok ? "Verified" : "Broken"}
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: 14,
                marginTop: 22,
              }}
            >
              <Meta label="Agent" value={data.agentId || "unknown"} />
              <Meta label="Environment" value={data.environment || "unknown"} />
              <Meta label="Status" value={data.statusLabel} />
              <Meta label="Calls verified" value={String(data.verify.callCount)} />
            </div>

            <div className="receipt" style={{ marginTop: 22 }}>
              <ReceiptRow label="Expected root (on-chain)" value={rootPreview(data.expectedRoot)} />
              <ReceiptRow
                label="Computed root (re-derived)"
                value={rootPreview(data.computedRoot)}
              />
              <ReceiptRow label="Root match" value={ok ? "yes" : "no"} tone={ok ? "ok" : "bad"} />
              <ReceiptRow
                label="Evidence rows displayed"
                value={`${data.calls.length} / ${data.verify.callCount}`}
                tone={data.callEvidenceMatchesVerifier ? "ok" : "warn"}
              />
            </div>

            {!data.callEvidenceMatchesVerifier ? (
              <div className="verify-mini" style={{ marginTop: 14 }}>
                <span className="vm-ic">
                  <Icon name="info" size={16} />
                </span>
                <span>
                  Verification used the full chain result, but this page displayed{" "}
                  {data.calls.length} matching event rows for {data.verify.callCount} verified
                  calls. The trace integrity result above remains the source of truth.
                </span>
              </div>
            ) : null}

            <a
              className="xlink"
              href={data.suiscan}
              target="_blank"
              rel="noreferrer"
              style={{ marginTop: 14, display: "inline-flex" }}
            >
              View TraceSession on Suiscan <Icon name="external" size={14} />
            </a>
          </section>

          <section className="card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 20, display: "flex", alignItems: "center", gap: 9 }}>
              <Icon name="info" size={18} />
              What this proves, and what it does not
            </h2>
            <p className="muted" style={{ fontSize: ".92rem", marginTop: 8 }}>
              Credibility comes from a narrow claim: this page checks chain integrity only.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 14,
                marginTop: 16,
              }}
            >
              <ProofList title="Proven" icon="checkCircle" items={PROVEN} tone="ok" />
              <ProofList title="Not proven" icon="xCircle" items={NOT_PROVEN} tone="muted" />
            </div>
          </section>

          <section className="card" style={{ padding: 24 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              <h2 style={{ fontSize: 20 }}>Call Evidence</h2>
              <span className="badge badge-grey">{data.calls.length} rows</span>
            </div>
            <div style={{ display: "grid", gap: 1, marginTop: 14 }}>
              {data.calls.length > 0 ? (
                data.calls.map((call) => (
                  <div
                    key={`${call.sequence}-${call.callId}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "44px minmax(0, 1fr) minmax(140px, auto)",
                      gap: 12,
                      alignItems: "center",
                      padding: "10px 12px",
                      border: "1px solid var(--line)",
                      background: "var(--card)",
                    }}
                  >
                    <span style={{ color: ok ? "var(--verify)" : "var(--ink-3)" }}>
                      <Icon name={ok ? "checkCircle" : "xCircle"} size={16} />
                    </span>
                    <span className="mono" style={{ fontSize: ".85rem", minWidth: 0 }}>
                      {call.sequence}. {call.label}
                    </span>
                    <span className="mono faint" style={{ fontSize: ".76rem", textAlign: "right" }}>
                      {shortId(call.callId, 10, 6)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="muted" style={{ fontSize: ".9rem" }}>
                  No emitted call rows were available for display. The verifier result above is
                  still computed from the SDK verifier, not from this empty UI list.
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function ReceiptRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "ok" | "warn" | "bad";
}) {
  const color =
    tone === "ok"
      ? "var(--verify)"
      : tone === "warn"
        ? "var(--warn)"
        : tone === "bad"
          ? "var(--danger)"
          : "var(--ink)";
  return (
    <div className="rcp-row">
      <span className="rk">{label}</span>
      <span className="rv mono" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

function ProofList({
  title,
  icon,
  items,
  tone,
}: {
  title: string;
  icon: string;
  items: readonly string[];
  tone: "ok" | "muted";
}) {
  const color = tone === "ok" ? "var(--verify)" : "var(--ink-3)";
  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: 16 }}>
      <h3
        style={{
          color,
          fontSize: 14,
          textTransform: "uppercase",
          letterSpacing: ".06em",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Icon name={icon} size={16} />
        {title}
      </h3>
      <div style={{ display: "grid", gap: 9, marginTop: 12 }}>
        {items.map((item) => (
          <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <span style={{ color, marginTop: 2 }}>
              <Icon name={tone === "ok" ? "check" : "x"} size={14} />
            </span>
            <span className="muted" style={{ fontSize: ".9rem" }}>
              {item}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
