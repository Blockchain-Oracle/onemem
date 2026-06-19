"use client";

// /dashboard — the hosted hub. Public verify remains accountless; account-owned
// actions are gated on the real wallet/Enoki account exposed by dApp Kit.

import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { useEffect, useState } from "react";
import { useHostedAuthConfig } from "@/components/HostedProviders";
import { Icon } from "@/components/Icon";
import { type HostedProvisioningState, loadHostedProvisioningState } from "@/lib/hosted-state";

const SAMPLE_TRACE_SESSION_ID =
  "0x6ceaab0fe2961043d490326960dfd192e43c25ed655772d42c04c265ad3ec080";

const SURFACES: { href: string; icon: string; title: string; blurb: string }[] = [
  {
    href: "/dashboard",
    icon: "overview",
    title: "Overview",
    blurb: "Hosted account hub and route index",
  },
  {
    href: `/verify/${SAMPLE_TRACE_SESSION_ID}`,
    icon: "shield",
    title: "Public verifier",
    blurb: "No-login Merkle proof for a real testnet trace",
  },
  { href: "/share", icon: "share", title: "Share", blurb: "Capabilities + share links" },
  {
    href: "/onboarding",
    icon: "key",
    title: "Onboarding",
    blurb: "Provision hosted account state",
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
  const [provisioningState, setProvisioningState] = useState<HostedProvisioningState | null>(null);

  useEffect(() => {
    if (!account?.address) {
      setProvisioningState(null);
      return;
    }
    setProvisioningState(loadHostedProvisioningState(account.address, authConfig.defaultNetwork));
  }, [account?.address, authConfig.defaultNetwork]);

  return (
    <main className="container" style={{ maxWidth: 920, padding: "56px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <Icon name="cube" size={26} />
        <span style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: "1.4rem" }}>
          OneMem Dashboard
        </span>
      </div>
      <p className="muted" style={{ marginBottom: 24 }}>
        Your verifiable memory + trace surfaces.
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
            Connect an account to act on your own namespaces and delegate keys. Browsing and public
            verification work without an account.
          </span>
          <ConnectButton className="btn btn-primary" connectText="Connect" />
        </div>
      ) : (
        <div className="verify-mini ok" style={{ marginBottom: 24 }}>
          <span className="vm-ic">
            <Icon name="check" size={16} />
          </span>
          <span>
            Connected account <span className="mono">{shortAddress(account.address)}</span>.{" "}
            {provisioningState
              ? `Hosted namespace ${shortAddress(provisioningState.namespaceId)} is provisioned on ${provisioningState.network}.`
              : "Hosted provisioning is still pending; finish onboarding before minting capabilities."}
          </span>
        </div>
      )}

      {!authConfig.enokiConfigured ? (
        <div className="verify-mini" style={{ marginBottom: 24 }}>
          <span className="vm-ic">
            <Icon name="info" size={16} />
          </span>
          <span>
            Google sign-in is not enabled yet. Wallet connect and public verification remain
            available.
          </span>
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
