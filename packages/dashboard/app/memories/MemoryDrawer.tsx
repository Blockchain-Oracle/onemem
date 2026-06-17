"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import type { MemoryRef } from "@/lib/memory";
import { verifyMemoryOrigin } from "@/lib/memory-origin-verify";
import { formatTime, type RelatedMemory, shortId } from "@/lib/memory-view";
import type { VerifySessionsResponse } from "@/lib/sessions";

type VerifyState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "done"; response: VerifySessionsResponse }
  | { kind: "error"; error: string };

export function MemoryDrawer({
  memory,
  network,
  related,
  onClose,
  onSelect,
}: {
  memory: MemoryRef;
  network: string;
  related: RelatedMemory[];
  onClose: () => void;
  onSelect: (memory: MemoryRef) => void;
}) {
  const [verify, setVerify] = useState<VerifyState>({ kind: "idle" });

  async function verifyOrigin() {
    setVerify({ kind: "loading" });
    try {
      setVerify({ kind: "done", response: await verifyMemoryOrigin(memory.sessionId) });
    } catch (err) {
      setVerify({ kind: "error", error: err instanceof Error ? err.message : String(err) });
    }
  }

  return (
    <>
      <button type="button" className="dr-scrim show" aria-label="Close" onClick={onClose} />
      <div className="drawer-r show" role="dialog" aria-label="Memory provenance">
        <div className="dr-head">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span className="badge badge-verify">
                <span className="dot" />
                chain event
              </span>
              <span className="cls-pill">{memory.toolNamespace || "unknown runtime"}</span>
            </div>
            <div className="mono" style={{ fontSize: ".78rem", color: "var(--ink-3)" }}>
              {shortId(memory.callId)}
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={onClose}>
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="dr-body">
          <section className="dr-sec">
            <div className="dl">Encrypted memory</div>
            <div className="cv">
              <div className="cv-locked">
                <div className="lk">
                  <Icon name="lock" size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 3 }}>
                    {memory.label ?? "Seal-encrypted memory write"}
                  </div>
                  <div className="muted" style={{ fontSize: ".85rem" }}>
                    Plaintext is not returned by the dashboard. This view shows the chain receipt
                    for the encrypted write.
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="dr-sec">
            <div className="dl">Provenance</div>
            <div className="kv">
              <Row k="Runtime" v={memory.toolNamespace || "unknown"} />
              <Row k="Tool" v={memory.toolName || "memwal_write"} />
              <Row k="Captured" v={formatTime(memory.capturedAt || memory.eventTimestampMs)} />
              <Row k="Captured by" v={memory.capturedByAddress || "-"} />
              <Row k="Parent call" v={memory.parentCallId ?? "-"} />
              <div className="row">
                <span className="k">Trace session</span>
                <span className="v">
                  <Link className="xlink" href={`/trace/${memory.sessionId}`}>
                    {shortId(memory.sessionId)} <Icon name="external" size={14} />
                  </Link>
                </span>
              </div>
            </div>
          </section>

          <section className="dr-sec">
            <div className="dl">On-chain receipt</div>
            <div className="kv">
              <Row k="Walrus blob" v={memory.walrusBlobId ?? "-"} />
              <ExternalRow k="Sui tx" v={memory.txDigest || "-"} href={txUrl(network, memory)} />
              <ExternalRow
                k="Session object"
                v={memory.sessionId}
                href={objectUrl(network, memory.sessionId)}
              />
              <Row k="Namespace" v={memory.namespaceId} />
              <Row k="Call id" v={memory.callId} />
              <Row k="Input hash" v={memory.inputHash || "-"} />
              <Row k="Content hash" v={memory.contentHash || "-"} />
              <Row k="Prev hash" v={memory.prevHash || "-"} />
              <Row k="Session root" v={memory.sessionMerkleRoot || "-"} />
            </div>
          </section>

          <section className="dr-sec">
            <div className="dl">Proof boundary</div>
            <div className="checklist-cap">
              <span className="ci yes">
                <Icon name="check" size={16} /> Proves a memwal_write event was anchored into this
                TraceSession chain.
              </span>
              <span className="ci yes">
                <Icon name="check" size={16} /> Preserves the hash links needed for Merkle
                verification.
              </span>
              <span className="ci no">
                <Icon name="x" size={16} /> Does not prove plaintext, semantic correctness, or
                access history.
              </span>
            </div>
            <button
              type="button"
              className="btn btn-verify"
              disabled={verify.kind === "loading"}
              onClick={verifyOrigin}
              style={{ marginTop: 14 }}
            >
              <Icon name={verify.kind === "loading" ? "spinner" : "shield"} size={16} />
              {verify.kind === "loading" ? "Verifying..." : "Verify originating trace"}
            </button>
            <VerifyOriginResult state={verify} sessionId={memory.sessionId} />
          </section>

          <section className="dr-sec">
            <div className="dl">Related metadata</div>
            {related.length === 0 ? (
              <div className="muted" style={{ fontSize: ".86rem" }}>
                No same-session or same-namespace memory events in the loaded page.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {related.map(({ memory: item, reason }) => (
                  <button
                    type="button"
                    className="rel-mem"
                    key={item.callId}
                    onClick={() => onSelect(item)}
                  >
                    <Icon name="memory" size={16} className="faint" />
                    <span style={{ flex: 1 }}>{item.label ?? shortId(item.walrusBlobId)}</span>
                    <span className="mono faint" style={{ fontSize: ".72rem" }}>
                      {reason}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

function VerifyOriginResult({ state, sessionId }: { state: VerifyState; sessionId: string }) {
  if (state.kind === "idle") {
    return (
      <p className="muted" style={{ fontSize: ".84rem", marginTop: 10 }}>
        Runs the existing TraceSession verifier for {shortId(sessionId)}.
      </p>
    );
  }

  if (state.kind === "loading") {
    return (
      <div className="verify-mini">
        <span className="vm-ic">
          <Icon name="spinner" size={16} />
        </span>
        <span>Walking TraceSession Merkle chain...</span>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="verify-mini bad">
        <span className="vm-ic">
          <Icon name="xCircle" size={16} />
        </span>
        <span>{state.error}</span>
      </div>
    );
  }

  const result = state.response.results[0];
  if (!result) {
    return (
      <div className="verify-mini bad">
        <span className="vm-ic">
          <Icon name="xCircle" size={16} />
        </span>
        <span>No verification result returned.</span>
      </div>
    );
  }

  return (
    <div className={`verify-mini ${result.ok ? "ok" : "bad"}`}>
      <span className="vm-ic">
        <Icon name={result.ok ? "checkCircle" : "xCircle"} size={16} />
      </span>
      <span>
        <strong>{result.ok ? "Trace verified" : "Trace verification failed"}</strong>
        <span className="mono">
          {" "}
          {result.shortId} - {result.callCount} calls - {result.statusLabel}
          {result.brokenAt != null ? ` - broken at #${result.brokenAt}` : ""}
          {result.error ? ` - ${result.error}` : ""}
        </span>
      </span>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="row">
      <span className="k">{k}</span>
      <span className="v">{shortDisplay(v)}</span>
    </div>
  );
}

function ExternalRow({ k, v, href }: { k: string; v: string; href: string | null }) {
  return (
    <div className="row">
      <span className="k">{k}</span>
      <span className="v">
        {href ? (
          <a className="xlink" href={href} target="_blank" rel="noreferrer">
            {shortDisplay(v)} <Icon name="external" size={14} />
          </a>
        ) : (
          shortDisplay(v)
        )}
      </span>
    </div>
  );
}

function shortDisplay(value: string): string {
  return value.length > 30 ? shortId(value, 14, 8) : value;
}

function txUrl(network: string, memory: MemoryRef): string | null {
  return memory.txDigest ? `https://suiscan.xyz/${network}/tx/${memory.txDigest}` : null;
}

function objectUrl(network: string, id: string): string {
  return `https://suiscan.xyz/${network}/object/${id}`;
}
