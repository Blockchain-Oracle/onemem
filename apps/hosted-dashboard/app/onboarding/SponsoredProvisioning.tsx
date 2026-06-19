"use client";

import { useSignTransaction } from "@mysten/dapp-kit";
import { useRef, useState } from "react";
import { Icon } from "@/components/Icon";

type ProvisionAction = "namespace-create" | "rw-cap-mint";
type ProvisionStatus = "idle" | "preparing" | "signing" | "executing" | "done";

interface PreparedResponse {
  readonly ok: true;
  readonly action: ProvisionAction;
  readonly network: string;
  readonly digest: string;
  readonly bytes: string;
  readonly namespaceName?: string;
  readonly namespaceId?: string;
  readonly adminCapId?: string;
}

interface ExecutedResponse {
  readonly ok: true;
  readonly action: ProvisionAction;
  readonly network: string;
  readonly txDigest: string;
  readonly namespaceId?: string;
  readonly adminCapId?: string;
  readonly rwCapId?: string;
}

interface ApiError {
  readonly ok: false;
  readonly code?: string;
  readonly error?: string;
}

export interface ProvisioningResult {
  readonly network: string;
  readonly namespaceId: string;
  readonly adminCapId: string;
  readonly rwCapId: string;
  readonly namespaceDigest: string;
  readonly rwCapDigest: string;
}

interface SponsoredProvisioningProps {
  readonly sender: string | null;
  readonly onProvisioned: (result: ProvisioningResult) => void;
}

function shortId(value: string | null | undefined): string {
  if (!value) return "none";
  return value.length > 22 ? `${value.slice(0, 12)}...${value.slice(-8)}` : value;
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

export function SponsoredProvisioning({ sender, onProvisioned }: SponsoredProvisioningProps) {
  const { mutateAsync: signTransaction } = useSignTransaction();
  const activeRunRef = useRef(0);
  const [status, setStatus] = useState<ProvisionStatus>("idle");
  const [message, setMessage] = useState("Ready to sponsor namespace creation.");
  const [error, setError] = useState<string | null>(null);
  const [namespaceName, setNamespaceName] = useState<string | null>(null);
  const [namespaceId, setNamespaceId] = useState<string | null>(null);
  const [adminCapId, setAdminCapId] = useState<string | null>(null);
  const [rwCapId, setRwCapId] = useState<string | null>(null);
  const [namespaceDigest, setNamespaceDigest] = useState<string | null>(null);
  const [rwCapDigest, setRwCapDigest] = useState<string | null>(null);

  const running = status === "preparing" || status === "signing" || status === "executing";
  const done = status === "done";

  function assertActive(runId: number): void {
    if (activeRunRef.current !== runId) throw new Error("Provisioning was cancelled.");
  }

  function cancelProvisioning(): void {
    activeRunRef.current += 1;
    setStatus("idle");
    setMessage("Provisioning stopped before completion.");
    setError("Wallet request cancelled. Any later approval for the old prompt will be ignored.");
  }

  async function signAndExecute(
    prepared: PreparedResponse,
    runId: number,
  ): Promise<ExecutedResponse> {
    assertActive(runId);
    setStatus("signing");
    setMessage(`Sign ${prepared.action} in your wallet.`);
    const signed = await signTransaction({ transaction: prepared.bytes });
    assertActive(runId);
    if (!signed.signature) throw new Error("Wallet did not return a signature.");

    setStatus("executing");
    setMessage(`Executing sponsored ${prepared.action} transaction.`);
    const executed = await postJson<ExecutedResponse>("/api/onboarding/sponsored/execute", {
      action: prepared.action,
      digest: prepared.digest,
      signature: signed.signature,
      network: prepared.network,
    });
    assertActive(runId);
    return executed;
  }

  async function provision() {
    if (!sender) return;
    const runId = activeRunRef.current + 1;
    activeRunRef.current = runId;
    setError(null);
    setNamespaceId(null);
    setAdminCapId(null);
    setRwCapId(null);
    setNamespaceDigest(null);
    setRwCapDigest(null);

    try {
      setStatus("preparing");
      setMessage("Preparing sponsored namespace creation.");
      const preparedNamespace = await postJson<PreparedResponse>(
        "/api/onboarding/sponsored/prepare",
        {
          action: "namespace-create",
          sender,
          label: "hosted",
        },
      );
      assertActive(runId);
      setNamespaceName(preparedNamespace.namespaceName ?? null);
      const created = await signAndExecute(preparedNamespace, runId);
      if (!created.namespaceId || !created.adminCapId) {
        throw new Error("Namespace transaction did not return namespace and Admin capability IDs.");
      }
      assertActive(runId);
      setNamespaceId(created.namespaceId);
      setAdminCapId(created.adminCapId);
      setNamespaceDigest(created.txDigest);

      setStatus("preparing");
      setMessage("Preparing sponsored ReadWrite capability mint.");
      const preparedRw = await postJson<PreparedResponse>("/api/onboarding/sponsored/prepare", {
        action: "rw-cap-mint",
        sender,
        namespaceId: created.namespaceId,
        adminCapId: created.adminCapId,
      });
      assertActive(runId);
      const minted = await signAndExecute(preparedRw, runId);
      if (!minted.rwCapId) {
        throw new Error("ReadWrite capability transaction did not return a capability ID.");
      }
      assertActive(runId);
      setRwCapId(minted.rwCapId);
      setRwCapDigest(minted.txDigest);
      setStatus("done");
      setMessage("Namespace and ReadWrite capability are live on Sui.");
      onProvisioned({
        network: minted.network,
        namespaceId: created.namespaceId,
        adminCapId: created.adminCapId,
        rwCapId: minted.rwCapId,
        namespaceDigest: created.txDigest,
        rwCapDigest: minted.txDigest,
      });
    } catch (err) {
      if (activeRunRef.current !== runId) return;
      setStatus("idle");
      setError(err instanceof Error ? err.message : String(err));
      setMessage("Provisioning stopped before completion.");
    }
  }

  return (
    <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
      <div className={`verify-mini ${done ? "ok" : ""}`}>
        <span className="vm-ic">
          <Icon name={done ? "check" : "info"} size={16} />
        </span>
        <span>{message}</span>
      </div>

      <button
        type="button"
        className="btn btn-primary"
        disabled={!sender || running}
        onClick={provision}
        style={{ justifyContent: "center" }}
      >
        <Icon name="shield" size={16} />
        {running ? "Provisioning..." : done ? "Provision again" : "Provision namespace"}
      </button>
      {running ? (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={cancelProvisioning}
          style={{ justifyContent: "center" }}
        >
          Cancel wallet request
        </button>
      ) : null}

      {!sender ? (
        <p className="faint" style={{ fontSize: ".78rem", textAlign: "center" }}>
          Connect an account before provisioning.
        </p>
      ) : null}

      {error ? (
        <p style={{ color: "var(--danger, #e5484d)", fontSize: ".82rem", textAlign: "center" }}>
          {error}
        </p>
      ) : null}

      <div className="receipt">
        <div className="rcp-row">
          <span className="rk">Namespace name</span>
          <span className="rv mono">{namespaceName ?? "pending"}</span>
        </div>
        <div className="rcp-row">
          <span className="rk">Namespace</span>
          <span className="rv mono">{shortId(namespaceId)}</span>
        </div>
        <div className="rcp-row">
          <span className="rk">Admin cap</span>
          <span className="rv mono">{shortId(adminCapId)}</span>
        </div>
        <div className="rcp-row">
          <span className="rk">ReadWrite cap</span>
          <span className="rv mono">{shortId(rwCapId)}</span>
        </div>
        <div className="rcp-row">
          <span className="rk">Namespace tx</span>
          <span className="rv mono">{shortId(namespaceDigest)}</span>
        </div>
        <div className="rcp-row">
          <span className="rk">RW cap tx</span>
          <span className="rv mono">{shortId(rwCapDigest)}</span>
        </div>
      </div>

      <p className="faint" style={{ fontSize: ".78rem", textAlign: "center" }}>
        This runs two sponsored Sui transactions: namespace create, then ReadWrite capability mint.
      </p>
    </div>
  );
}
