"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { ReplayModal } from "./ReplayModal";
import { rtClass, type TraceViewProps, type ViewCall } from "./types";
import { VerifyDrawer } from "./VerifyDrawer";

function fmtMs(ms: number) {
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`;
}

export function TraceView({ meta, verify, totalMs, calls, suiscanHref }: TraceViewProps) {
  const [selected, setSelected] = useState<ViewCall | null>(calls[0] ?? null);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [showVerify, setShowVerify] = useState(false);
  const [showReplay, setShowReplay] = useState(false);

  const ticks = useMemo(() => {
    // Aim for ~6 evenly-spaced labels regardless of window length.
    const raw = totalMs / 6;
    const mag = 10 ** Math.floor(Math.log10(Math.max(raw, 1)));
    const step = Math.max(Math.round(raw / mag) * mag, 100);
    const out: number[] = [];
    for (let t = 0; t <= totalMs; t += step) out.push(t);
    return out;
  }, [totalMs]);

  const vbadge =
    verified === true
      ? { cls: "vbadge is-verified pulse", icon: "shield", label: "Verified" }
      : verified === false
        ? { cls: "vbadge is-broken", icon: "xCircle", label: "Broken" }
        : { cls: "vbadge", icon: "shield", label: "Unverified" };

  return (
    <>
      <div className={`card trace-shell${verified ? " verified-glow" : ""}`} id="trace-shell">
        {/* session header */}
        <div className="sess-head">
          <div className="sess-top">
            <div>
              <div className="sess-id">
                <span className="lab">TraceSession</span>
                <span className="val mono">{`${meta.sessionId.slice(0, 10)}…${meta.sessionId.slice(-4)}`}</span>
                <a className="xlink" href={suiscanHref} target="_blank" rel="noreferrer">
                  <Icon name="external" size={14} />
                </a>
              </div>
              <div className="sess-title">
                {meta.agentId} · {meta.environment}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="badge badge-grey">
                <span className="dot" style={{ background: "var(--verify)" }} />
                {meta.statusLabel}
              </span>
              <span className={vbadge.cls}>
                <Icon name={vbadge.icon} size={14} />
                {vbadge.label}
              </span>
            </div>
          </div>
          <div className="sess-meta">
            <div className="m">
              <span className="mk">Calls</span>
              <span className="mv mono">{meta.callCount}</span>
            </div>
            <div className="m">
              <span className="mk">Merkle root</span>
              <span className="mv mono">{`${verify.merkleRoot.slice(0, 14)}…`}</span>
            </div>
            <div className="m">
              <span className="mk">Namespace</span>
              <span className="mv mono">{`${meta.namespaceId.slice(0, 10)}…`}</span>
            </div>
            <div className="m">
              <span className="mk">Window</span>
              <span className="mv mono">{fmtMs(totalMs)}</span>
            </div>
          </div>
        </div>

        {/* actions */}
        <div className="actions-bar">
          <button type="button" className="btn btn-verify" onClick={() => setShowVerify(true)}>
            <Icon name="shield" size={16} />
            Verify chain
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setShowReplay(true)}>
            <Icon name="play" size={16} />
            Replay session
          </button>
          <div className="spacer" />
          <span className="faint mono" style={{ fontSize: ".72rem" }}>
            Sui testnet · on-chain verified read
          </span>
        </div>

        {/* gantt */}
        <div className="gantt">
          <div className="gantt-head">
            <span className="t">Timeline · {fmtMs(totalMs)}</span>
            <span className="faint mono" style={{ fontSize: ".7rem" }}>
              click a row to inspect
            </span>
          </div>
          <div className="gantt-axis">
            {ticks.map((t) => (
              <div key={t} className="tick" style={{ left: `${(t / totalMs) * 100}%` }}>
                {(t / 1000).toFixed(t % 1000 === 0 ? 0 : 1)}s
              </div>
            ))}
          </div>
          <div className="gantt-rows">
            {calls.map((c) => (
              <button
                type="button"
                key={c.callId}
                className={`g-row${selected?.callId === c.callId ? " sel" : ""}`}
                onClick={() => setSelected(c)}
              >
                <div className="g-label" style={{ paddingLeft: c.linked ? 14 : 0 }}>
                  <span className="tn-kind">{c.toolNamespace}</span>
                  {c.toolName}
                </div>
                <div className="g-track">
                  <div
                    className={`g-bar ${c.status === 2 ? "fail" : rtClass(c.toolNamespace)}`}
                    style={{
                      left: `${(c.startMs / totalMs) * 100}%`,
                      width: `${Math.max((c.durationMs / totalMs) * 100, 1.2)}%`,
                    }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* two-pane: tree + detail */}
        <div className="trace-body">
          <div className="tree-pane">
            <div className="tree-scroll">
              {calls.map((c) => (
                <button
                  type="button"
                  key={c.callId}
                  className={`tnode-self${selected?.callId === c.callId ? " sel" : ""}`}
                  style={{ paddingLeft: c.linked ? 26 : 10 }}
                  onClick={() => setSelected(c)}
                >
                  <span className={`tn-status ${c.status === 2 ? "st-fail" : "st-ok"}`}>
                    <Icon name={c.status === 2 ? "xCircle" : "checkCircle"} size={14} />
                  </span>
                  <span className="tn-kind">{c.toolNamespace}</span>
                  <span className="tn-name">{c.toolName}</span>
                  <span className="tn-dur">{c.durationMs ? `${c.durationMs}ms` : "open"}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="detail-pane">
            {selected ? (
              <Detail call={selected} suiscanHref={suiscanHref} namespaceId={meta.namespaceId} />
            ) : null}
          </div>
        </div>
      </div>

      {showVerify && (
        <VerifyDrawer
          calls={calls}
          verify={verify}
          onClose={() => setShowVerify(false)}
          onResult={setVerified}
        />
      )}
      {showReplay && (
        <ReplayModal
          sessionId={meta.sessionId}
          calls={calls}
          onClose={() => setShowReplay(false)}
        />
      )}
    </>
  );
}

function Detail({
  call,
  suiscanHref,
  namespaceId,
}: {
  call: ViewCall;
  suiscanHref: string;
  namespaceId: string;
}) {
  const [tab, setTab] = useState<"metadata" | "verify" | "content">("metadata");
  const [reveal, setReveal] = useState<{
    state: "idle" | "loading" | "done" | "error";
    text: string;
  }>({ state: "idle", text: "" });

  async function decrypt() {
    if (!call.walrusInputBlob) return;
    setReveal({ state: "loading", text: "" });
    try {
      const res = await fetch("/api/decrypt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walrusBlobId: call.walrusInputBlob, namespaceId }),
      });
      const j = (await res.json()) as { ok: boolean; plaintext?: string; error?: string };
      if (j.ok && j.plaintext !== undefined) setReveal({ state: "done", text: j.plaintext });
      else setReveal({ state: "error", text: j.error ?? "decrypt failed" });
    } catch (e) {
      setReveal({ state: "error", text: e instanceof Error ? e.message : String(e) });
    }
  }
  return (
    <>
      <div className="detail-head">
        <div className="dh-name">
          <Icon name="bolt" size={18} />
          {call.toolName}
        </div>
        <div className="dh-path mono">{call.toolNamespace}</div>
        <div className="dh-meta">
          <div className="x">
            <span className="xk">Status</span>
            <span className="xv">
              {call.status === 2 ? "failed" : call.status === 1 ? "success" : "open"}
            </span>
          </div>
          <div className="x">
            <span className="xk">Start</span>
            <span className="xv">+{(call.startMs / 1000).toFixed(2)}s</span>
          </div>
          <div className="x">
            <span className="xk">Duration</span>
            <span className="xv">{call.durationMs ? `${call.durationMs}ms` : "—"}</span>
          </div>
          <div className="x">
            <span className="xk">Chain</span>
            <span className="xv">{call.linked ? "linked" : "root"}</span>
          </div>
        </div>
      </div>
      <div className="dtabs">
        {(["metadata", "verify", "content"] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={`dtab${tab === t ? " on" : ""}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <div className="dpanes">
        {tab === "content" ? (
          <div className="cv">
            {reveal.state === "done" ? (
              <div>
                <div className="eyebrow" style={{ marginBottom: 6 }}>
                  Decrypted input <span style={{ color: "var(--verify)" }}>✓ Seal</span>
                </div>
                <pre
                  className="mono"
                  style={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    fontSize: ".82rem",
                    margin: 0,
                  }}
                >
                  {reveal.text || "(empty)"}
                </pre>
              </div>
            ) : (
              <div className="cv-locked">
                <div className="lk">
                  <Icon name="lock" size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: 3 }}>Content is Seal-encrypted</div>
                  <div className="muted" style={{ fontSize: ".85rem", marginBottom: 10 }}>
                    Threshold-encrypted on Walrus (
                    {call.walrusInputBlob ? `${call.walrusInputBlob.slice(0, 14)}…` : "no blob"}).
                    Decrypts with your namespace capability (local: on your machine).
                  </div>
                  {call.walrusInputBlob ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={decrypt}
                      disabled={reveal.state === "loading"}
                    >
                      <Icon name={reveal.state === "loading" ? "spinner" : "unlock"} size={16} />
                      {reveal.state === "loading" ? "Decrypting…" : "Reveal plaintext"}
                    </button>
                  ) : null}
                  {reveal.state === "error" ? (
                    <div style={{ color: "var(--danger)", fontSize: ".8rem", marginTop: 8 }}>
                      {reveal.text}
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="receipt">
            {(tab === "verify"
              ? ([
                  ["Content hash", call.contentHash],
                  ["Prev hash", call.prevHash],
                  ["Walrus input", call.walrusInputBlob ?? "—"],
                  ["Walrus output", call.walrusOutputBlob ?? "—"],
                ] as const)
              : ([
                  ["Call id", `${call.callId.slice(0, 14)}…`],
                  ["Namespace", call.toolNamespace],
                  ["Sequence", String(call.sequence)],
                  ["Parent", call.parentCallId ? `${call.parentCallId.slice(0, 12)}…` : "—"],
                ] as const)
            ).map(([k, v]) => (
              <div className="rcp-row" key={k}>
                <span className="rk">{k}</span>
                <span className="rv mono">{v}</span>
              </div>
            ))}
            {tab === "verify" && (
              <a
                className="xlink"
                href={suiscanHref}
                target="_blank"
                rel="noreferrer"
                style={{ marginTop: 8 }}
              >
                view on Suiscan <Icon name="external" size={14} />
              </a>
            )}
          </div>
        )}
      </div>
    </>
  );
}
