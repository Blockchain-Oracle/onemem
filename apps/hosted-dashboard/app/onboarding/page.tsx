"use client";

import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { useState } from "react";
import { useHostedAuthConfig } from "@/components/HostedProviders";
import { Icon } from "@/components/Icon";
import { saveHostedProvisioningState } from "@/lib/hosted-state";
import { type ProvisioningResult, SponsoredProvisioning } from "./SponsoredProvisioning";

const RUNTIMES: Array<[string, string]> = [
  [
    "Claude Code",
    "claude plugin marketplace add Blockchain-Oracle/onemem && claude plugin install onemem@onemem",
  ],
  ["Hermes", "pip install hermes-onemem"],
  ["OpenClaw", "openclaw plugins install @onemem/oc-onemem && npx @onemem/oc-onemem init"],
  ["Cursor (MCP)", "npx -y @onemem/mcp@latest"],
];

function shortAddress(address: string): string {
  return `${address.slice(0, 10)}...${address.slice(-6)}`;
}

export default function OnboardingPage() {
  const account = useCurrentAccount();
  const authConfig = useHostedAuthConfig();
  const [step, setStep] = useState(0);
  const [runtime, setRuntime] = useState(0);
  const [provisioned, setProvisioned] = useState<ProvisioningResult | null>(null);
  const steps = ["Account", "Runtime", "Provision", "Verify", "Done"];
  const canAdvance = step !== 0 || account !== null;

  function rememberProvisioning(result: ProvisioningResult) {
    setProvisioned(result);
    if (!account) return;
    saveHostedProvisioningState({
      suiAddress: account.address,
      ...result,
    });
  }

  return (
    <div className="auth-wrap">
      <div className="auth-bg grid-bg grid-fade" />
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <div className="auth-brand">
          <Icon name="cube" size={26} />
          OneMem
        </div>

        <div style={{ display: "flex", gap: 6, justifyContent: "center", margin: "10px 0 18px" }}>
          {steps.map((s, i) => (
            <span
              key={s}
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: i <= step ? "var(--verify)" : "var(--line-2)",
              }}
            />
          ))}
        </div>

        <div className="card" style={{ padding: 26 }}>
          {step === 0 && (
            <>
              <h2 style={{ fontSize: "1.3rem", marginBottom: 6 }}>Connect an account</h2>
              <p className="muted" style={{ fontSize: ".92rem" }}>
                Hosted onboarding starts from a real Sui account. Use a browser wallet, or Enoki
                Google sign-in when this deployment has public Enoki config.
              </p>
              <div style={{ marginTop: 14 }}>
                <ConnectButton className="auth-btn" connectText="Connect wallet or Google" />
              </div>
              <div className={`verify-mini ${account ? "ok" : ""}`} style={{ marginTop: 14 }}>
                <span className="vm-ic">
                  <Icon name={account ? "check" : "info"} size={16} />
                </span>
                <span>
                  {account ? (
                    <>
                      Connected account{" "}
                      <span className="mono">{shortAddress(account.address)}</span>
                    </>
                  ) : (
                    "No account connected yet. Connect before continuing."
                  )}
                </span>
              </div>
              {!authConfig.enokiConfigured ? (
                <div className="verify-mini">
                  <span className="vm-ic">
                    <Icon name="info" size={16} />
                  </span>
                  <span>
                    Enoki Google sign-in is not configured in this build. Missing{" "}
                    <span className="mono">{authConfig.enokiMissing.join(", ")}</span>.
                  </span>
                </div>
              ) : null}
            </>
          )}
          {step === 1 && (
            <>
              <h2 style={{ fontSize: "1.3rem", marginBottom: 10 }}>Where does your agent run?</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {RUNTIMES.map(([name], i) => (
                  <button
                    key={name}
                    type="button"
                    className="auth-btn"
                    style={
                      runtime === i
                        ? { borderColor: "var(--primary)", color: "var(--primary)" }
                        : undefined
                    }
                    onClick={() => setRuntime(i)}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <div className="copyline" style={{ marginTop: 14 }}>
                <span className="cmd mono">{RUNTIMES[runtime]?.[1]}</span>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <h2 style={{ fontSize: "1.3rem", marginBottom: 6 }}>Provision namespace</h2>
              <p className="muted" style={{ fontSize: ".92rem" }}>
                Create a real OneMem namespace and ReadWrite capability for your connected account.
                The browser signs sponsored Sui transactions; the server keeps the Enoki private key
                off the client.
              </p>
              <SponsoredProvisioning
                sender={account?.address ?? null}
                onProvisioned={rememberProvisioning}
              />
            </>
          )}
          {step === 3 && (
            <>
              <h2 style={{ fontSize: "1.3rem", marginBottom: 6 }}>Verify it</h2>
              <p className="muted" style={{ fontSize: ".92rem" }}>
                Once your runtime records a TraceSession, open the dashboard or run{" "}
                <span className="mono">onemem verify &lt;id&gt;</span> and watch the chain turn
                green.
              </p>
              <div className="copyline" style={{ marginTop: 12 }}>
                <span className="cmd mono">onemem verify 0x7a3f…d201</span>
              </div>
            </>
          )}
          {step === 4 && (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  color: "var(--verify)",
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: 8,
                }}
              >
                <Icon name="checkCircle" size={20} />
              </div>
              <h2 style={{ fontSize: "1.3rem" }}>You're set.</h2>
              <p className="muted" style={{ fontSize: ".92rem", marginTop: 6 }}>
                {provisioned
                  ? "Your namespace and ReadWrite capability are live. Use these IDs when wiring hosted CLI pairing or runtime setup."
                  : "Your browser account is connected. Namespace provisioning was not completed in this session."}
              </p>
              {provisioned ? (
                <div className="receipt" style={{ marginTop: 14, textAlign: "left" }}>
                  <div className="rcp-row">
                    <span className="rk">Network</span>
                    <span className="rv mono">{provisioned.network}</span>
                  </div>
                  <div className="rcp-row">
                    <span className="rk">Namespace</span>
                    <span className="rv mono">{shortAddress(provisioned.namespaceId)}</span>
                  </div>
                  <div className="rcp-row">
                    <span className="rk">Admin cap</span>
                    <span className="rv mono">{shortAddress(provisioned.adminCapId)}</span>
                  </div>
                  <div className="rcp-row">
                    <span className="rk">ReadWrite cap</span>
                    <span className="rv mono">{shortAddress(provisioned.rwCapId)}</span>
                  </div>
                </div>
              ) : null}
              <a className="btn btn-primary" href="http://localhost:4040" style={{ marginTop: 16 }}>
                Open dashboard
              </a>
            </div>
          )}

          {step < 4 && (
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              {step > 0 && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setStep((s) => s - 1)}
                >
                  Back
                </button>
              )}
              <div style={{ flex: 1 }} />
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={!canAdvance}
                onClick={() => setStep((s) => s + 1)}
              >
                Continue <Icon name="arrowRight" size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
