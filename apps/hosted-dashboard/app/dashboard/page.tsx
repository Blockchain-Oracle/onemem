"use client";

// /dashboard — the hosted hub. Account-owned actions are gated on the real
// wallet/Enoki account exposed by dApp Kit.

import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { useHostedAuthConfig } from "@/components/HostedProviders";
import { Icon } from "@/components/Icon";

const SURFACES: { href: string; icon: string; title: string; blurb: string }[] = [
  {
    href: "/cli-login",
    icon: "key",
    title: "CLI pairing",
    blurb: "Pair a terminal with a MemWal delegate key",
  },
  {
    href: "/login",
    icon: "lock",
    title: "Sign in",
    blurb: "Connect wallet or Enoki when configured",
  },
];

function shortAddress(address: string): string {
  return `${address.slice(0, 10)}...${address.slice(-6)}`;
}

export default function HostedDashboardRoot() {
  const account = useCurrentAccount();
  const authConfig = useHostedAuthConfig();

  return (
    <main className="container" style={{ maxWidth: 920, padding: "56px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <Icon name="cube" size={26} />
        <span style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: "1.4rem" }}>
          OneMem Dashboard
        </span>
      </div>
      <p className="muted" style={{ marginBottom: 24 }}>
        Your decentralized memory account.
      </p>

      {!account ? (
        <div
          className="card"
          style={{
            padding: 18,
            marginBottom: 24,
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Icon name="lock" size={18} />
          <span className="muted" style={{ flex: 1 }}>
            Connect an account to manage your MemWal delegate keys.
          </span>
          <ConnectButton className="btn btn-primary" connectText="Connect" />
        </div>
      ) : (
        <div className="status-pill ok" style={{ marginBottom: 24 }}>
          <span className="sp-ic">
            <Icon name="check" size={16} />
          </span>
          <span>
            Connected account <span className="mono">{shortAddress(account.address)}</span>.
          </span>
        </div>
      )}

      {!authConfig.enokiConfigured ? (
        <div className="status-pill" style={{ marginBottom: 24 }}>
          <span className="sp-ic">
            <Icon name="info" size={16} />
          </span>
          <span>Google sign-in is not enabled yet. Wallet connect remains available.</span>
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 14,
        }}
      >
        {SURFACES.map((s) => (
          <a
            key={s.href}
            className="card"
            href={s.href}
            style={{ padding: 18, textDecoration: "none", display: "block" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Icon name={s.icon} size={18} />
              <span style={{ fontWeight: 700 }}>{s.title}</span>
              <span style={{ marginLeft: "auto", opacity: 0.5 }}>
                <Icon name="arrowRight" size={16} />
              </span>
            </div>
            <span className="muted" style={{ fontSize: ".9rem" }}>
              {s.blurb}
            </span>
          </a>
        ))}
      </div>
    </main>
  );
}
