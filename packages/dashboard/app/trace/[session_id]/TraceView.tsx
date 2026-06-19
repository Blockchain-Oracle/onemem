"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

type RevealState = { state: "idle" | "loading" | "done" | "error" | "empty"; text: string };

async function decryptBlob(
  blobId: string,
  namespaceId: string,
): Promise<{ ok: boolean; text: string }> {
  try {
    const res = await fetch("/api/decrypt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walrusBlobId: blobId, namespaceId }),
    });
    const j = (await res.json()) as { ok: boolean; plaintext?: string; error?: string };
    if (j.ok && j.plaintext !== undefined) return { ok: true, text: j.plaintext };
    return { ok: false, text: j.error ?? "decrypt failed" };
  } catch (e) {
    return { ok: false, text: e instanceof Error ? e.message : String(e) };
  }
}

function ContentBlock({
  title,
  reveal,
  blob,
  onReveal,
}: {
  title: string;
  reveal: RevealState;
  blob: string | null;
  onReveal: () => void;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        className="eyebrow"
        style={{ marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}
      >
        {title}
        {reveal.state === "done" ? (
          <span style={{ color: "var(--verify)" }}>✓ Seal-decrypted on your machine</span>
        ) : null}
      </div>
      {reveal.state === "done" ? (
        <pre
          className="mono"
          style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontSize: ".82rem",
            margin: 0,
            background: "var(--paper-2)",
            border: "1px solid var(--line)",
            borderRadius: 8,
            padding: 10,
            maxHeight: 280,
            overflow: "auto",
          }}
        >
          {reveal.text || "(empty)"}
        </pre>
      ) : reveal.state === "loading" ? (
        <div className="muted" style={{ fontSize: ".85rem" }}>
          <Icon name="spinner" size={14} /> Decrypting…
        </div>
      ) : reveal.state === "empty" ? (
        <div className="muted" style={{ fontSize: ".82rem" }}>
          No {title.toLowerCase()} recorded for this call.
        </div>
      ) : (
        <div className="cv-locked">
          <div className="lk">
            <Icon name="lock" size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="muted" style={{ fontSize: ".82rem", marginBottom: 8 }}>
              Seal-encrypted{blob ? ` (${blob.slice(0, 12)}…)` : ""} — decrypts with your namespace
              capability on your machine.
              {reveal.state === "error" && reveal.text ? ` (${reveal.text})` : ""}
            </div>
            {blob ? (
              <button type="button" className="btn btn-ghost" onClick={onReveal}>
                <Icon name="unlock" size={14} /> Reveal
              </button>
            ) : null}
          </div>
        </div>
      )}
    </div>
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
  // Content first — opening a call shows what the agent actually did, in plain
  // text, auto-decrypted on the local dashboard (you hold the keys). Proof/verify
  // are secondary tabs. This is the legible "trace + replay" the product is for.
  const [tab, setTab] = useState<"content" | "metadata" | "verify">("content");
  const [input, setInput] = useState<RevealState>({ state: "idle", text: "" });
  const [output, setOutput] = useState<RevealState>({ state: "idle", text: "" });

  const reveal = useCallback(
    async (blobId: string | null, set: (s: RevealState) => void) => {
      if (!blobId) {
        set({ state: "empty", text: "" });
        return;
      }
      set({ state: "loading", text: "" });
      const r = await decryptBlob(blobId, namespaceId);
      set(r.ok ? { state: "done", text: r.text } : { state: "error", text: r.text });
    },
    [namespaceId],
  );

  // Auto-reveal input + output whenever the selected call changes.
  useEffect(() => {
    let cancelled = false;
    const guard = (set: (s: RevealState) => void) => (s: RevealState) => {
      if (!cancelled) set(s);
    };
    reveal(call.walrusInputBlob, guard(setInput));
    reveal(call.walrusOutputBlob, guard(setOutput));
    return () => {
      cancelled = true;
    };
  }, [call.walrusInputBlob, call.walrusOutputBlob, reveal]);

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
        {(["content", "metadata", "verify"] as const).map((t) => (
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
            <ContentBlock
              title="Input"
              reveal={input}
              blob={call.walrusInputBlob}
              onReveal={() => reveal(call.walrusInputBlob, setInput)}
            />
            <ContentBlock
              title="Output"
              reveal={output}
              blob={call.walrusOutputBlob}
              onReveal={() => reveal(call.walrusOutputBlob, setOutput)}
            />
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
