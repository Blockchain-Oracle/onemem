"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";

const CALLS = [
  "plan_payment",
  "coingecko.get_price",
  "wallet.resolve_recipient",
  "wallet.check_balance",
  "wallet.build_tx",
  "delegate → Hermes (sign)",
  "hermes.broadcast",
  "sui.confirm_tx",
  "notify_user",
  "settle",
];

export function VerifyDemo() {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");

  const run = () => {
    if (phase === "running") return;
    setPhase("running");
    setProgress(0);
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setProgress(i);
      if (i >= CALLS.length) {
        clearInterval(t);
        setPhase("done");
      }
    }, 200);
  };

  const pct = (progress / CALLS.length) * 100;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <div
        className={`hv-card card vault-card${phase === "done" ? " verified-glow" : ""}`}
        style={{ width: "min(440px,92vw)" }}
      >
        <div className="hv-head">
          <div>
            <div className="hlab">TraceSession</div>
            <div className="hid mono">0x7a3f9c2e…d201</div>
          </div>
          <span
            className={`badge ${phase === "done" ? "badge-verify" : "badge-grey"}`}
            style={phase === "done" ? { animation: "verify-pulse 1.4s ease-out 2" } : undefined}
          >
            <span className="dot" />
            {phase === "done" ? "verified" : phase === "running" ? "verifying" : "10 calls"}
          </span>
        </div>
        <div className="hv-progress">
          <div className="f" style={{ width: `${pct}%`, background: "var(--verify)" }} />
        </div>
        <div className="hv-rows">
          {CALLS.slice(0, Math.max(progress, phase === "idle" ? 4 : progress)).map((c, i) => (
            <div
              key={c}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: ".82rem",
                padding: "3px 0",
              }}
            >
              <span style={{ color: i < progress ? "var(--verify)" : "var(--ink-3)" }}>
                <Icon name={i < progress ? "checkCircle" : "dot"} size={14} />
              </span>
              <span className={i < progress ? "" : "faint"}>{c}</span>
            </div>
          ))}
        </div>
        <div className="hv-foot">
          <span className="hv-status">
            <span className="hs-ic">
              <Icon name="shield" size={14} />
            </span>
            {phase === "done"
              ? "Verified — chain intact"
              : phase === "running"
                ? "Walking the chain…"
                : "Ready to verify"}
          </span>
          <span className="faint mono" style={{ fontSize: ".68rem" }}>
            root 0xb91e…f7a3
          </span>
        </div>
      </div>
      <button type="button" className="btn btn-verify" onClick={run}>
        <Icon name="shield" size={16} />
        {phase === "done" ? "Verified ✓" : "Verify chain"}
      </button>
    </div>
  );
}
