"use client";

// /dashboard — the hosted hub. Public verify remains accountless; account-owned
// actions are gated on the real wallet/Enoki account exposed by dApp Kit.

import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { useHostedAuthConfig } from "@/components/HostedProviders";
import { Icon } from "@/components/Icon";

const DASH = (process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "").replace(/\/$/, "");

const SURFACES: { href: string; icon: string; title: string; blurb: string }[] = [
  {
    href: "/",
    icon: "overview",
    title: "Overview",
    blurb: "Memories, sessions, capabilities, verify rate",
  },
  {
    href: "/memories",
    icon: "memory",
    title: "Memories",
    blurb: "Browse + semantic-search your memory",
  },
  { href: "/sessions", icon: "sessions", title: "Sessions", blurb: "Cross-runtime trace sessions" },
  { href: "/apps", icon: "apps", title: "Apps", blurb: "Connected runtimes + coverage" },
  { href: "/share", icon: "share", title: "Share", blurb: "Capabilities + share links" },
  {
    href: "/settings",
    icon: "settings",
    title: "Settings",
    blurb: "Account, delegate keys, providers",
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
            Connected account <span className="mono">{shortAddress(account.address)}</span>. Hosted
            provisioning is still pending; local dashboard remains the daily driver.
          </span>
        </div>
      )}

      {!authConfig.enokiConfigured ? (
        <div className="verify-mini" style={{ marginBottom: 24 }}>
          <span className="vm-ic">
            <Icon name="info" size={16} />
          </span>
          <span>
            Enoki Google sign-in is not configured in this build. Missing{" "}
            <span className="mono">{authConfig.enokiMissing.join(", ")}</span>.
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
            href={`${DASH}${s.href}`}
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
