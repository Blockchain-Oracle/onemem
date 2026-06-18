"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import type { CapabilityRow } from "@/lib/namespaces";

type ShareMode = "Owner" | "Recipient";

interface NamespaceState {
  id: string;
  owner: string;
  name: string;
  kind: number;
  active: boolean;
}

function shortId(id: string): string {
  return id.length > 22 ? `${id.slice(0, 12)}...${id.slice(-8)}` : id;
}

function kindLabel(kind: number): string {
  if (kind === 0) return "ReadOnly";
  if (kind === 1) return "ReadWrite";
  if (kind === 2) return "Admin";
  return `Unknown(${kind})`;
}

function namespaceKind(kind: number): string {
  if (kind === 0) return "Personal";
  if (kind === 1) return "Team";
  return `Kind ${kind}`;
}

function InfoRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="vault-row" style={{ marginTop: 8 }}>
      <span className="k">{k}</span>
      <span className="v mono" title={v}>
        {v}
      </span>
    </div>
  );
}

export function ShareView({
  adminCapId,
  capabilities,
  loadError,
  namespace,
  network,
  namespaceId,
}: {
  adminCapId: string | null;
  capabilities: CapabilityRow[];
  loadError: string | null;
  namespace: NamespaceState | null;
  network: string;
  namespaceId: string | null;
}) {
  const [sessionId, setSessionId] = useState("");
  const [mode, setMode] = useState<ShareMode>("Owner");
  const link = sessionId.trim()
    ? `https://app.onemem.ai/verify/${sessionId.trim()}`
    : "https://app.onemem.ai/verify/<session-id>";
  const commandNamespace = namespaceId ?? "<namespace-id>";
  const commandAdminCap = adminCapId ?? "<admin-cap-id>";
  const shareCommand = `onemem namespace share ${commandNamespace} <recipient-address> --cap ReadOnly --admin-cap ${commandAdminCap}`;
  const capabilitiesCommand = `onemem namespace capabilities ${commandNamespace}`;
  const revokeCommand = "onemem namespace revoke <capability-id>";
  const adminRevokeCommand = `onemem namespace admin-revoke ${commandNamespace} <capability-id> --admin-cap ${commandAdminCap}`;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Share</div>
          <div className="page-sub">
            Share a public verification link, or grant namespace access via a Sui capability.
          </div>
        </div>
      </div>

      <div className="mode-switch">
        {(["Owner", "Recipient"] as const).map((m) => (
          <button
            className={mode === m ? "on" : ""}
            key={m}
            onClick={() => setMode(m)}
            type="button"
          >
            {m}
          </button>
        ))}
      </div>

      <div className="share-grid">
        <div className="card panel">
          <div className="panel-head">
            <h3>Public verification link</h3>
          </div>
          <div style={{ padding: 18 }}>
            <p className="muted" style={{ fontSize: ".9rem", marginBottom: 12 }}>
              Anyone can verify a session's Merkle chain — no login, no signer. Paste a session id:
            </p>
            <div className="dsearch" style={{ marginBottom: 12 }}>
              <Icon name="trace" size={16} />
              <input
                placeholder="0x… session id"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
              />
            </div>
            <div className="copyline">
              <span className="cmd mono" style={{ overflowWrap: "anywhere" }}>
                {link}
              </span>
            </div>
          </div>
        </div>

        <div className="card panel">
          <div className="panel-head">
            <h3>{mode === "Owner" ? "Grant namespace access" : "Use received access"}</h3>
          </div>
          <div style={{ padding: 18 }}>
            {mode === "Owner" ? (
              <>
                <InfoRow
                  k="Active namespace"
                  v={namespaceId ? shortId(namespaceId) : "none - set ONEMEM_NAMESPACE_ID"}
                />
                <InfoRow k="Network" v={network} />
                <InfoRow
                  k="Admin cap"
                  v={adminCapId ? shortId(adminCapId) : "required - pass --admin-cap"}
                />
                <p className="muted" style={{ fontSize: ".88rem", margin: "14px 0 10px" }}>
                  Minting a Sui <span className="mono">NamespaceCapability</span> requires the
                  owner's signer and Admin cap, so this runs from the CLI or SDK.
                </p>
                <div className="copyline">
                  <span className="cmd mono" style={{ overflowWrap: "anywhere" }}>
                    {shareCommand}
                  </span>
                </div>
              </>
            ) : (
              <>
                <InfoRow k="Namespace" v={namespaceId ? shortId(namespaceId) : "<namespace-id>"} />
                <InfoRow k="Network" v={network} />
                <p className="muted" style={{ fontSize: ".88rem", margin: "14px 0 10px" }}>
                  A ReadOnly cap can read and decrypt namespace content. A ReadWrite cap can also
                  write traces and memories. Active capabilities are inspectable without signing.
                </p>
                <div className="copyline">
                  <span className="cmd mono" style={{ overflowWrap: "anywhere" }}>
                    {capabilitiesCommand}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="share-grid share-grid-spaced">
        <div className="card cap-card">
          <div className="cap-head">
            <div className="cap-title">
              <Icon name="shield" size={18} /> Namespace readiness
            </div>
            <span className="cap-status mono">
              {namespace ? (namespace.active ? "active" : "inactive") : "not configured"}
            </span>
          </div>

          {loadError ? (
            <p className="muted" style={{ fontSize: ".9rem" }}>
              Could not load namespace state: {loadError}
            </p>
          ) : namespace ? (
            <>
              <InfoRow k="Name" v={namespace.name} />
              <InfoRow k="Kind" v={namespaceKind(namespace.kind)} />
              <InfoRow k="Owner" v={shortId(namespace.owner)} />
              <InfoRow k="Object" v={shortId(namespace.id)} />
            </>
          ) : (
            <>
              <p className="muted" style={{ fontSize: ".9rem", marginBottom: 12 }}>
                No namespace is configured for this dashboard process.
              </p>
              <div className="copyline">
                <span className="cmd mono" style={{ overflowWrap: "anywhere" }}>
                  onemem init
                </span>
              </div>
              <p className="muted" style={{ fontSize: ".86rem", marginTop: 12 }}>
                Then set <span className="mono">ONEMEM_NAMESPACE_ID</span> and{" "}
                <span className="mono">ONEMEM_ADMIN_CAP_ID</span> for operator share commands.
              </p>
            </>
          )}
        </div>

        <div className="card cap-card">
          <div className="cap-head">
            <div className="cap-title">
              <Icon name="key" size={18} /> Active capabilities
            </div>
            <span className="cap-status mono">{capabilities.length}</span>
          </div>

          {namespaceId && capabilities.length > 0 ? (
            <div className="feed">
              {capabilities.map((cap) => (
                <div className="fr" key={cap.capId}>
                  <span className="ft">{kindLabel(cap.kind)}</span>
                  <span className="mono" title={cap.recipient}>
                    {shortId(cap.recipient)}
                  </span>
                  <span className="ft" title={cap.capId}>
                    {shortId(cap.capId)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted" style={{ fontSize: ".9rem" }}>
              {namespaceId
                ? "No active shared capabilities were found for this namespace."
                : "Configure a namespace before capability state can be listed."}
            </p>
          )}
        </div>
      </div>

      <div className="card cap-card" style={{ marginTop: 20 }}>
        <div className="cap-head">
          <div className="cap-title">
            <Icon name="info" size={18} /> Revocation boundary
          </div>
          <span className="cap-status mono">contract v0.1</span>
        </div>
        <p className="muted" style={{ fontSize: ".9rem", maxWidth: 900 }}>
          Holders can self-revoke by consuming the capability object they own. Namespace admins can
          marker-revoke a capability by ID; the object remains, but OneMem gates reject it.
        </p>
        <div className="copyline" style={{ marginTop: 14, maxWidth: 560 }}>
          <span className="cmd mono" style={{ overflowWrap: "anywhere" }}>
            {revokeCommand}
          </span>
        </div>
        <div className="copyline" style={{ marginTop: 10, maxWidth: 760 }}>
          <span className="cmd mono" style={{ overflowWrap: "anywhere" }}>
            {adminRevokeCommand}
          </span>
        </div>
        <p className="muted" style={{ fontSize: ".86rem", marginTop: 10, maxWidth: 900 }}>
          Revoking an Admin cap requires the explicit CLI override{" "}
          <span className="mono">--allow-admin</span>.
        </p>
      </div>
    </>
  );
}
