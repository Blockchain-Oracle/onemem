"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import type { ViewCall, ViewVerify } from "./types";

// Walks the REAL verifyTraceChain result one call at a time for the demo
// narrative, then locks in the real verdict. The "simulate tampered blob"
// toggle is an explicit DEMO affordance (clearly labelled) that forces the
// broken-chain display so viewers can see what a failed verification looks like.

export function VerifyDrawer({
  calls,
  verify,
  onClose,
  onResult,
}: {
  calls: ViewCall[];
  verify: ViewVerify;
  onClose: () => void;
  onResult: (ok: boolean) => void;
}) {
  const [tamper, setTamper] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState<null | { ok: boolean; brokenAt: number | null }>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = calls.length || verify.callCount;
  // Real verdict; tamper sim forces a broken chain at a fixed call for the demo.
  const simBreakAt = tamper ? Math.min(2, total - 1) : null;
  const effectiveOk = tamper ? false : verify.ok;
  const breakAt = tamper ? simBreakAt : verify.brokenAt;

  const start = () => {
    setProgress(0);
    setDone(null);
    let i = 0;
    timer.current = setInterval(() => {
      i += 1;
      setProgress(i);
      if (breakAt != null && i - 1 === breakAt) {
        if (timer.current) clearInterval(timer.current);
        setDone({ ok: false, brokenAt: breakAt });
        onResult(false);
        return;
      }
      if (i >= total) {
        if (timer.current) clearInterval(timer.current);
        setDone({ ok: effectiveOk, brokenAt: breakAt });
        onResult(effectiveOk);
      }
    }, 240);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run only when tamper flips
  useEffect(() => {
    const t = setTimeout(start, 300);
    return () => {
      clearTimeout(t);
      if (timer.current) clearInterval(timer.current);
    };
  }, [tamper]);

  const pct = total ? (progress / total) * 100 : 100;

  return (
    <>
      <button
        type="button"
        className="vd-scrim show"
        aria-label="Close verify drawer"
        onClick={onClose}
      />
      <div className="verify-drawer show drawer-up" role="dialog" aria-label="Verify chain">
        <div className="vd-grip" />
        <div className="vd-head">
          <div>
            <h3>
              <Icon name="shield" size={20} />
              {done ? (done.ok ? "Verified" : "Verification failed") : "Verifying chain"}
            </h3>
            <div className="sub">
              Re-deriving every call's hash from Sui — independent of the agent
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <label className="vd-demo">
              <input
                type="checkbox"
                checked={tamper}
                onChange={(e) => setTamper(e.target.checked)}
              />
              Simulate tampered blob (demo)
            </label>
            <button type="button" className="btn-icon" onClick={onClose}>
              <Icon name="x" size={18} />
            </button>
          </div>
        </div>
        <div className="vd-body">
          {!done && (
            <div className="vd-progress">
              <div className="pct">
                <span className="big">
                  {progress} / {total}
                </span>
                <span className="small">calls verified</span>
              </div>
              <div className="vd-track">
                <div
                  className={`vd-fill${effectiveOk ? "" : " broken"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}

          <div className="vd-checklist">
            {calls.slice(0, progress).map((c, i) => {
              const bad = breakAt != null && i === breakAt;
              return (
                <div className="vchk" key={c.callId}>
                  <span className={`ci ${bad ? "bad" : "ok"}`}>
                    <Icon name={bad ? "xCircle" : "check"} size={14} />
                  </span>
                  <span className="cn">
                    {i + 1}. {c.toolNamespace}/{c.toolName}
                  </span>
                  <span className="ch mono">{c.contentHash.slice(0, 12)}…</span>
                </div>
              );
            })}
          </div>

          {done?.ok && (
            <div className="vd-result on">
              <div className="vd-big ok">
                <span className="vc">
                  <Icon name="check" size={20} />
                </span>
                VERIFIED
              </div>
              <p className="vd-line">
                These actions are cryptographically proven — intact, in order, and anchored on Sui.
                Computed root matches the on-chain root.
              </p>
              <div className="vd-summary">
                {[
                  `All ${total} calls verified`,
                  "Merkle chain integrity intact",
                  "On-chain root matches computed root",
                  `Computed root ${verify.merkleRoot.slice(0, 18)}…`,
                ].map((s) => (
                  <div className="si" key={s}>
                    <Icon name="checkCircle" size={14} />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {done && !done.ok && (
            <div className="vd-result on">
              <div className="vd-big bad">
                <span className="vc">
                  <Icon name="x" size={20} />
                </span>
                VERIFICATION FAILED
              </div>
              <p className="vd-line">
                Chain broken at call {(done.brokenAt ?? 0) + 1}/{total}
                {tamper ? " (simulated tamper)" : ""}: the recomputed content hash does not match
                what was anchored on-chain.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
