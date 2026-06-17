"use client";

import { ConnectButton, useCurrentAccount, useSignTransaction } from "@mysten/dapp-kit";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { loadHostedProvisioningState } from "@/lib/hosted-state";
import { ShareHistoryPanel } from "./ShareHistoryPanel";

type CapKind = "ReadOnly" | "ReadWrite";
type ShareAction = "ro-cap-share" | "rw-cap-share";
type ShareStatus = "idle" | "preparing" | "signing" | "executing" | "done";

interface PreparedResponse {
  readonly ok: true;
  readonly action: ShareAction;
  readonly network: string;
  readonly digest: string;
  readonly bytes: string;
  readonly recipient?: string;
  readonly capKind?: CapKind;
}

interface ExecutedResponse {
  readonly ok: true;
  readonly action: ShareAction;
  readonly network: string;
  readonly txDigest: string;
  readonly sharedCapId?: string;
  readonly roCapId?: string;
  readonly rwCapId?: string;
  readonly capKind?: CapKind;
}

interface ApiError {
  readonly ok: false;
  readonly code?: string;
  readonly error?: string;
}

function shortId(value: string | null | undefined): string {
  if (!value) return "none";
  return value.length > 22 ? `${value.slice(0, 12)}...${value.slice(-8)}` : value;
}

function actionFor(kind: CapKind): ShareAction {
  return kind === "ReadOnly" ? "ro-cap-share" : "rw-cap-share";
}

async function postJson<T extends { readonly ok: true }>(
  url: string,
  body: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as T | ApiError;
  if (!res.ok || data.ok !== true) {
    throw new Error((data as ApiError).error ?? `request failed with ${res.status}`);
  }
  return data as T;
}

function InfoRow({ k, v }: { readonly k: string; readonly v: string }) {
  return (
    <div className="vault-row" style={{ marginTop: 8 }}>
      <span className="k">{k}</span>
      <span className="v mono" title={v}>
        {v}
      </span>
    </div>
  );
}

export function HostedShareView({ network }: { readonly network: string }) {
  const account = useCurrentAccount();
  const { mutateAsync: signTransaction } = useSignTransaction();
  const [sessionId, setSessionId] = useState("");
  const [namespaceId, setNamespaceId] = useState("");
  const [adminCapId, setAdminCapId] = useState("");
  const [recipient, setRecipient] = useState("");
  const [capKind, setCapKind] = useState<CapKind>("ReadOnly");
  const [status, setStatus] = useState<ShareStatus>("idle");
  const [message, setMessage] = useState("Ready to mint a sponsored capability.");
  const [error, setError] = useState<string | null>(null);
  const [sharedCapId, setSharedCapId] = useState<string | null>(null);
  const [shareDigest, setShareDigest] = useState<string | null>(null);
  const [usedStoredState, setUsedStoredState] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  useEffect(() => {
    if (!account?.address) {
      setUsedStoredState(false);
      return;
    }
    const stored = loadHostedProvisioningState(account.address, network);
    if (!stored) {
      setUsedStoredState(false);
      return;
    }
    setNamespaceId(stored.namespaceId);
    setAdminCapId(stored.adminCapId);
    setUsedStoredState(true);
  }, [account?.address, network]);

  const running = status === "preparing" || status === "signing" || status === "executing";
  const verifyLink = sessionId.trim()
    ? `https://app.onemem.ai/verify/${sessionId.trim()}`
    : "https://app.onemem.ai/verify/<session-id>";
  const recipientShareLink = sharedCapId ? `https://app.onemem.ai/share/${sharedCapId}` : null;

  async function share() {
    if (!account?.address) return;
    setError(null);
    setSharedCapId(null);
    setShareDigest(null);
    try {
      setStatus("preparing");
      setMessage("Preparing sponsored capability mint.");
      const prepared = await postJson<PreparedResponse>("/api/share/sponsored/prepare", {
        action: actionFor(capKind),
        sender: account.address,
        recipient,
        namespaceId,
        adminCapId,
        network,
      });

      setStatus("signing");
      setMessage(`Sign ${capKind} capability mint in your wallet.`);
      const signed = await signTransaction({ transaction: prepared.bytes });
      if (!signed.signature) throw new Error("Wallet did not return a signature.");

      setStatus("executing");
      setMessage("Executing sponsored share transaction.");
      const executed = await postJson<ExecutedResponse>("/api/share/sponsored/execute", {
        action: prepared.action,
        digest: prepared.digest,
        signature: signed.signature,
        network: prepared.network,
      });
      const capId = executed.sharedCapId ?? executed.roCapId ?? executed.rwCapId;
      if (!capId) throw new Error("Share transaction did not return a capability ID.");
      setSharedCapId(capId);
      setShareDigest(executed.txDigest);
      setStatus("done");
      setMessage(`${executed.capKind ?? capKind} capability minted to recipient.`);
      setHistoryRefreshKey((key) => key + 1);
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : String(err));
      setMessage("Share transaction stopped before completion.");
    }
  }

  return (
    <main className="container" style={{ maxWidth: 980, padding: "48px 24px" }}>
      <div className="page-head">
        <div>
          <div className="page-title">Share</div>
          <div className="page-sub">
            Create Sui namespace capabilities or send public trace verifier links.
          </div>
        </div>
      </div>

      <div className="share-grid">
        <div className="card panel">
          <div className="panel-head">
            <h3>Public verification link</h3>
          </div>
          <div style={{ padding: 18 }}>
            <div className="dsearch" style={{ marginBottom: 12 }}>
              <Icon name="trace" size={16} />
              <input
                placeholder="0x... session id"
                value={sessionId}
                onChange={(event) => setSessionId(event.target.value)}
              />
            </div>
            <div className="copyline">
              <span className="cmd mono" style={{ overflowWrap: "anywhere" }}>
                {verifyLink}
              </span>
            </div>
          </div>
        </div>

        <div className="card panel">
          <div className="panel-head">
            <h3>Sponsored capability mint</h3>
          </div>
          <div style={{ padding: 18 }}>
            {!account ? (
              <div className="verify-mini" style={{ marginBottom: 14 }}>
                <span className="vm-ic">
                  <Icon name="lock" size={16} />
                </span>
                <span>Connect an account before minting a namespace capability.</span>
              </div>
            ) : (
              <div className="verify-mini ok" style={{ marginBottom: 14 }}>
                <span className="vm-ic">
                  <Icon name="check" size={16} />
                </span>
                <span>
                  Sharing as <span className="mono">{shortId(account.address)}</span>.
                </span>
              </div>
            )}

            <div style={{ display: "grid", gap: 10 }}>
              <label className="muted" style={{ display: "grid", gap: 6, fontSize: ".82rem" }}>
                Namespace ID
                <input
                  className="cmd mono"
                  value={namespaceId}
                  onChange={(event) => setNamespaceId(event.target.value.trim())}
                  placeholder="0x..."
                  style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 10 }}
                />
              </label>
              <label className="muted" style={{ display: "grid", gap: 6, fontSize: ".82rem" }}>
                Admin cap ID
                <input
                  className="cmd mono"
                  value={adminCapId}
                  onChange={(event) => setAdminCapId(event.target.value.trim())}
                  placeholder="0x..."
                  style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 10 }}
                />
              </label>
              <label className="muted" style={{ display: "grid", gap: 6, fontSize: ".82rem" }}>
                Recipient address
                <input
                  className="cmd mono"
                  value={recipient}
                  onChange={(event) => setRecipient(event.target.value.trim())}
                  placeholder="0x..."
                  style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 10 }}
                />
              </label>
              <label className="muted" style={{ display: "grid", gap: 6, fontSize: ".82rem" }}>
                Capability
                <select
                  value={capKind}
                  onChange={(event) => setCapKind(event.target.value as CapKind)}
                  style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 10 }}
                >
                  <option value="ReadOnly">ReadOnly</option>
                  <option value="ReadWrite">ReadWrite</option>
                </select>
              </label>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              disabled={!account || running}
              onClick={share}
              style={{ justifyContent: "center", marginTop: 14, width: "100%" }}
            >
              <Icon name={running ? "spinner" : "share"} size={16} />
              {running ? "Sharing..." : "Mint sponsored capability"}
            </button>
            <div
              className={`verify-mini ${status === "done" ? "ok" : ""}`}
              style={{ marginTop: 12 }}
            >
              <span className="vm-ic">
                <Icon name={status === "done" ? "check" : "info"} size={16} />
              </span>
              <span>{message}</span>
            </div>
            {error ? (
              <p style={{ color: "var(--danger, #e5484d)", fontSize: ".82rem" }}>{error}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="share-grid share-grid-spaced">
        <div className="card cap-card">
          <div className="cap-head">
            <div className="cap-title">
              <Icon name="shield" size={18} /> Share source
            </div>
            <span className="cap-status mono">{usedStoredState ? "stored" : "manual"}</span>
          </div>
          <InfoRow k="Network" v={network} />
          <InfoRow k="Namespace" v={shortId(namespaceId)} />
          <InfoRow k="Admin cap" v={shortId(adminCapId)} />
          <p className="muted" style={{ fontSize: ".86rem", marginTop: 12 }}>
            Hosted onboarding saves namespace/Admin cap IDs in this browser for the connected
            account. Manual IDs are accepted for recovery and live demos.
          </p>
        </div>

        <div className="card cap-card">
          <div className="cap-head">
            <div className="cap-title">
              <Icon name="key" size={18} /> Last minted capability
            </div>
            <span className="cap-status mono">{status === "done" ? "created" : "pending"}</span>
          </div>
          <InfoRow k="Recipient" v={shortId(recipient)} />
          <InfoRow k="Kind" v={capKind} />
          <InfoRow k="Capability" v={shortId(sharedCapId)} />
          <InfoRow k="Transaction" v={shortId(shareDigest)} />
          <InfoRow
            k="Recipient link"
            v={recipientShareLink ? shortId(recipientShareLink) : "none"}
          />
          {sharedCapId ? (
            <a
              className="btn btn-ghost btn-sm"
              href={`/share/${sharedCapId}`}
              style={{ justifyContent: "center", marginTop: 12, width: "100%" }}
            >
              <Icon name="external" size={14} />
              Open recipient view
            </a>
          ) : null}
        </div>
      </div>

      <ShareHistoryPanel
        namespaceId={namespaceId}
        network={network}
        refreshKey={historyRefreshKey}
      />

      <div className="card cap-card" style={{ marginTop: 20 }}>
        <div className="cap-head">
          <div className="cap-title">
            <Icon name="info" size={18} /> Boundary
          </div>
          <span className="cap-status mono">contract v0.1</span>
        </div>
        <p className="muted" style={{ fontSize: ".9rem", maxWidth: 900 }}>
          This page mints a capability directly to a recipient wallet. Recipient capability links
          are read-only object views; there is no separate claim transaction in contract v0.1.
          Owner-driven revocation remains separate protocol/UI work. The current contract supports
          holder self-revoke through the CLI when the holder owns the capability object.
        </p>
        <div style={{ marginTop: 14 }}>
          <ConnectButton className="btn btn-ghost btn-sm" connectText="Connect account" />
        </div>
      </div>
    </main>
  );
}
