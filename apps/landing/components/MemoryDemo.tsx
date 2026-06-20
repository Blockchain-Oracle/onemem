"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";

// A small store → search illustration of the OneMem memory surface. The memories
// are encrypted on Walrus with Seal via MemWal; this is a UI demo of the
// add/search flow, not a live network call.
const MEMORIES = [
  "Prefers the Move language on Sui",
  "Deploys at night, ships small PRs",
  "Walrus epoch budget: 30 days",
  "Reviewer: always run the structure tests",
  "Embeddings via OpenRouter, model fixed",
];

const QUERY = "what does the team prefer?";
// Indices of MEMORIES that the search "recalls", in rank order.
const RECALLED = [0, 3, 1];

export function MemoryDemo() {
  const [stored, setStored] = useState(0);
  const [phase, setPhase] = useState<"idle" | "storing" | "searching" | "done">("idle");

  const run = () => {
    if (phase === "storing" || phase === "searching") return;
    setPhase("storing");
    setStored(0);
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setStored(i);
      if (i >= MEMORIES.length) {
        clearInterval(t);
        setPhase("searching");
        setTimeout(() => setPhase("done"), 700);
      }
    }, 180);
  };

  const pct = (stored / MEMORIES.length) * 100;
  const showResults = phase === "done";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <div
        className={`hv-card card vault-card${showResults ? " mem-glow" : ""}`}
        style={{ width: "min(440px,92vw)" }}
      >
        <div className="hv-head">
          <div>
            <div className="hlab">Memory namespace</div>
            <div className="hid mono">user:team — Walrus / Seal</div>
          </div>
          <span
            className={`badge ${showResults ? "badge-ok" : "badge-grey"}`}
            style={showResults ? { animation: "mem-pulse 1.4s ease-out 2" } : undefined}
          >
            <span className="dot" />
            {phase === "done"
              ? `${RECALLED.length} recalled`
              : phase === "searching"
                ? "searching"
                : phase === "storing"
                  ? "storing"
                  : `${MEMORIES.length} memories`}
          </span>
        </div>
        <div className="hv-progress">
          <div className="f" style={{ width: `${pct}%`, background: "var(--verify)" }} />
        </div>
        <div className="hv-rows">
          {!showResults
            ? MEMORIES.slice(0, Math.max(stored, phase === "idle" ? 3 : stored)).map((m, i) => (
                <div
                  key={m}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: ".82rem",
                    padding: "3px 0",
                  }}
                >
                  <span style={{ color: i < stored ? "var(--verify)" : "var(--ink-3)" }}>
                    <Icon name={i < stored ? "lock" : "plus"} size={14} />
                  </span>
                  <span className={i < stored ? "" : "faint"}>{m}</span>
                </div>
              ))
            : RECALLED.map((idx) => (
                <div
                  key={MEMORIES[idx]}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: ".82rem",
                    padding: "3px 0",
                  }}
                >
                  <span style={{ color: "var(--verify)" }}>
                    <Icon name="checkCircle" size={14} />
                  </span>
                  <span>{MEMORIES[idx]}</span>
                </div>
              ))}
        </div>
        <div className="hv-foot">
          <span className="hv-status">
            <span className="hs-ic">
              <Icon name={showResults ? "search" : "lock"} size={14} />
            </span>
            {phase === "done"
              ? `Recalled for "${QUERY}"`
              : phase === "searching"
                ? "Searching memory…"
                : phase === "storing"
                  ? "Encrypting to Walrus…"
                  : "Ready to store + recall"}
          </span>
          <span className="faint mono" style={{ fontSize: ".68rem" }}>
            seal-encrypted
          </span>
        </div>
      </div>
      <button type="button" className="btn btn-recall" onClick={run}>
        <Icon name={showResults ? "search" : "memory"} size={16} />
        {phase === "done" ? "Recalled ✓" : "Store + recall"}
      </button>
    </div>
  );
}
