"use client";

import { ConnectButton, useCurrentAccount, useCurrentWallet } from "@mysten/dapp-kit";
import { useHostedAuthConfig } from "@/components/HostedProviders";
import { Icon } from "@/components/Icon";

function shortAddress(address: string): string {
  return `${address.slice(0, 10)}...${address.slice(-6)}`;
}

export default function LoginPage() {
  const account = useCurrentAccount();
  const wallet = useCurrentWallet();
  const authConfig = useHostedAuthConfig();

  return (
    <div className="auth-wrap">
      <div className="auth-bg grid-bg grid-fade" />
      <div className="auth-card">
        <div className="auth-brand">
          <Icon name="cube" size={26} />
          OneMem
        </div>
        <p className="muted" style={{ textAlign: "center", marginBottom: 24 }}>
          Verifiable agent memory + trace.
        </p>
        <div className="card" style={{ padding: 26 }}>
          <h2 style={{ fontSize: "1.3rem", marginBottom: 6 }}>Sign in</h2>
          <p className="muted" style={{ fontSize: ".9rem", marginBottom: 20 }}>
            Connect your Sui wallet to continue. New here? We'll set you up after a real account is
            connected.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <ConnectButton
              className="auth-btn"
              connectText={
                authConfig.googleLoginEnabled ? "Connect wallet or Google" : "Connect Sui wallet"
              }
            />
            {account ? (
              <a
                className="btn btn-primary"
                href="/onboarding"
                style={{ justifyContent: "center" }}
              >
                <Icon name="arrowRight" size={16} />
                Continue to onboarding
              </a>
            ) : null}
          </div>
          <div
            className={`verify-mini ${account ? "ok" : ""}`}
            style={{ marginTop: 16, textAlign: "left" }}
          >
            <span className="vm-ic">
              <Icon name={account ? "check" : "info"} size={16} />
            </span>
            <span>
              {account ? (
                <>
                  Connected as <span className="mono">{shortAddress(account.address)}</span>
                  {wallet.currentWallet ? ` via ${wallet.currentWallet.name}` : ""}
                </>
              ) : (
                "No account connected yet."
              )}
            </span>
          </div>
          {authConfig.googleLoginEnabled ? (
            <div className="verify-mini ok" style={{ textAlign: "left" }}>
              <span className="vm-ic">
                <Icon name="check" size={16} />
              </span>
              <span>Enoki Google wallets are registered for {authConfig.defaultNetwork}.</span>
            </div>
          ) : (
            <div className="verify-mini" style={{ textAlign: "left" }}>
              <span className="vm-ic">
                <Icon name="info" size={16} />
              </span>
              <span>
                Wallet connect is the supported sign-in. Google zkLogin is disabled on this
                deployment.
              </span>
            </div>
          )}
          <p className="faint" style={{ fontSize: ".78rem", textAlign: "center", marginTop: 18 }}>
            Google sign-in uses Enoki zkLogin when configured. Wallet connect uses dApp Kit. No
            MemWal account or namespace is minted until onboarding runs a real sponsored
            transaction.
          </p>
        </div>
      </div>
    </div>
  );
}
