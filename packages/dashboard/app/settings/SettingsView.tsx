"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import type { LocalCredentialSummary } from "@/lib/local-credentials";

const TABS = ["Account", "Delegate keys", "Runtimes", "Providers", "Advanced"] as const;
type Tab = (typeof TABS)[number];

const PROVIDERS: Array<[string, string]> = [
  ["Vercel AI SDK", "npm i @onemem/vercel-ai-provider"],
  ["OpenAI Agents", "npm i @onemem/openai-agents"],
  ["CrewAI", "pip install onemem-crewai"],
  ["LiveKit", "pip install onemem-livekit"],
  ["ElevenLabs", "pip install onemem-elevenlabs"],
  ["Hermes", "pip install hermes-onemem"],
];

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="vault-row" style={{ marginTop: 8 }}>
      <span className="k">{k}</span>
      <span className="v mono">{v}</span>
    </div>
  );
}

function shortId(value: string | null, head = 18, tail = 6): string {
  if (!value) return "none";
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

function formatOptionalDate(value: string | null): string {
  if (!value) return "unknown";
  const time = Date.parse(value);
  if (Number.isNaN(time)) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(time));
}

function formatTtl(seconds: number | null): string {
  if (seconds === null) return "unknown";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86_400) return `${Math.round(seconds / 3600)}h`;
  return `${Math.round(seconds / 86_400)}d`;
}

function lifecycleLabel(status: LocalCredentialSummary["delegateStatus"]): string {
  if (status === "active") return "active";
  if (status === "expiring-soon") return "expiring soon";
  if (status === "expired") return "expired";
  if (status === "error") return "needs attention";
  if (status === "not-found") return "not found";
  return "unknown expiry";
}

function formatExpiresIn(
  status: LocalCredentialSummary["delegateStatus"],
  days: number | null,
): string {
  if (days === null) return "unknown";
  if (status === "expired") {
    const elapsed = Math.abs(days);
    if (elapsed <= 0) return "expired today";
    return `expired ${elapsed} day${elapsed === 1 ? "" : "s"} ago`;
  }
  if (days <= 0) return "today";
  return `${days} day${days === 1 ? "" : "s"}`;
}

function credentialStatusLabel(status: LocalCredentialSummary["status"]): string {
  if (status === "configured") return "configured";
  if (status === "partial") return "missing fields";
  if (status === "expired") return "expired credentials";
  if (status === "error") return "needs attention";
  return "not found";
}

export function SettingsView({
  address,
  credentials,
  network,
  namespaceId,
}: {
  address: string | null;
  credentials: LocalCredentialSummary;
  network: string;
  namespaceId: string | null;
}) {
  const [tab, setTab] = useState<Tab>("Account");
  const credentialProblem = credentials.status === "error" || credentials.status === "expired";
  const credentialOk =
    credentials.status === "configured" &&
    credentials.delegateStatus !== "expired" &&
    credentials.delegateStatus !== "error";

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Settings</div>
          <div className="page-sub">Account, delegate keys, runtimes, and providers.</div>
        </div>
      </div>

      <div className="dtabs" style={{ marginBottom: 18 }}>
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            className={`stab${tab === t ? " on" : ""}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 22, maxWidth: 720 }}>
        {tab === "Account" && (
          <div>
            <Row
              k="Sui address"
              v={address ? `${address.slice(0, 18)}…${address.slice(-6)}` : "no signer resolved"}
            />
            <Row k="Network" v={network} />
            <Row
              k="Active namespace"
              v={namespaceId ? `${namespaceId.slice(0, 18)}…` : "none — run `onemem init`"}
            />
            <Row k="Trust model" v="Seal /manual — relayer never sees plaintext" />
          </div>
        )}

        {tab === "Delegate keys" && (
          <div>
            <p className="muted" style={{ fontSize: ".9rem", marginBottom: 12 }}>
              Local credentials come from <span className="mono">onemem login</span> or env
              overrides. Secret values stay server-side and are never rendered here.
            </p>
            <div className={`verify-mini ${credentialOk ? "ok" : credentialProblem ? "bad" : ""}`}>
              <span className="vm-ic">
                <Icon name={credentialOk ? "check" : credentialProblem ? "x" : "info"} size={16} />
              </span>
              <span>
                <strong>{credentialStatusLabel(credentials.status)}</strong>
                {credentials.error ? ` — ${credentials.error}` : ""}
                {credentials.missing.length > 0
                  ? ` — missing ${credentials.missing.join(", ")}`
                  : ""}
              </span>
            </div>
            <Row k="Credentials file" v={credentials.credentialsFile} />
            <Row k="Delegate label" v={credentials.delegateLabel ?? "default"} />
            <Row k="Requested TTL" v={formatTtl(credentials.delegateTtlSeconds)} />
            <Row k="Lifecycle" v={lifecycleLabel(credentials.delegateStatus)} />
            <Row k="Account ID" v={shortId(credentials.accountId)} />
            <Row k="Sui address" v={shortId(credentials.suiAddress ?? address)} />
            <Row k="Delegate public key" v={shortId(credentials.delegatePublicKey)} />
            <Row
              k="Active namespace"
              v={shortId(credentials.activeNamespaceId ?? namespaceId, 18, 8)}
            />
            <Row k="MemWal package" v={shortId(credentials.memwalPackageId, 18, 8)} />
            <Row k="MemWal namespace" v={credentials.namespace ?? "none"} />
            <Row k="Relayer" v={credentials.relayerUrl ?? "default pending required fields"} />
            <Row k="Created" v={formatOptionalDate(credentials.createdAt)} />
            <Row k="Expires" v={formatOptionalDate(credentials.expiresAt)} />
            <Row
              k="Expires in"
              v={formatExpiresIn(credentials.delegateStatus, credentials.expiresInDays)}
            />
            <Row k="SDK version" v={credentials.sdkVersion ?? "unknown"} />
            {credentials.delegateStatus === "expired" ? (
              <div className="verify-mini bad">
                <span className="vm-ic">
                  <Icon name="x" size={16} />
                </span>
                <span>
                  File-backed delegate credentials are expired. Run{" "}
                  <span className="mono">onemem login</span> to mint a fresh local credential, or
                  provide env credentials explicitly.
                </span>
              </div>
            ) : null}
            <div className="copyline">
              <span className="cmd mono">onemem login</span>
            </div>
          </div>
        )}

        {tab === "Runtimes" && (
          <p className="muted" style={{ fontSize: ".9rem" }}>
            Manage connected runtimes on the{" "}
            <a className="xlink" href="/apps">
              Apps
            </a>{" "}
            page.
          </p>
        )}

        {tab === "Providers" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {PROVIDERS.map(([name, cmd]) => (
              <div key={name}>
                <div className="eyebrow" style={{ marginBottom: 6 }}>
                  {name}
                </div>
                <div className="copyline">
                  <span className="cmd mono">{cmd}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "Advanced" && (
          <div>
            <Row k="Auto-capture" v="on (plugins record automatically)" />
            <Row k="Auto-trace" v="on" />
            <Row k="Decrypt" v="client-side (Seal SessionKey)" />
            <p className="muted" style={{ fontSize: ".85rem", marginTop: 14 }}>
              <Icon name="info" size={14} /> These reflect the SDK defaults; per-runtime trace
              policy is managed on the{" "}
              <a className="xlink" href="/apps">
                Apps
              </a>{" "}
              page.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
