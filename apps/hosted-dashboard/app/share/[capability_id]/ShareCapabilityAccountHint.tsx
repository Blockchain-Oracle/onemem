"use client";

import { ConnectButton, useCurrentAccount, useSignTransaction } from "@mysten/dapp-kit";
import { useState } from "react";
import { Icon } from "@/components/Icon";

type CapabilityKind = "ReadOnly" | "ReadWrite" | "Admin";
type RevokeStatus = "idle" | "preparing" | "signing" | "executing" | "done";

interface PreparedRevokeResponse {
  readonly ok: true;
  readonly action: "cap-self-revoke";
  readonly network: string;
  readonly digest: string;
  readonly bytes: string;
  readonly capId?: string;
  readonly capKind?: CapabilityKind;
}

interface ExecutedRevokeResponse {
  readonly ok: true;
  readonly action: "cap-self-revoke";
  readonly network: string;
  readonly txDigest: string;
  readonly revokedCapId?: string;
  readonly capKind?: CapabilityKind;
}

interface ApiError {
  readonly ok: false;
  readonly error?: string;
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

export function ShareCapabilityAccountHint({
  capabilityId,
  capabilityKind,
  network,
  ownerAddress,
}: {
  readonly capabilityId: string;
  readonly capabilityKind: CapabilityKind;
  readonly network: string;
  readonly ownerAddress: string | null;
}) {
  const account = useCurrentAccount();
  const { mutateAsync: signTransaction } = useSignTransaction();
  const [adminAck, setAdminAck] = useState(false);
  const [status, setStatus] = useState<RevokeStatus>("idle");
  const [message, setMessage] = useState("Ready for holder self-revoke.");
  const [error, setError] = useState<string | null>(null);
  const [txDigest, setTxDigest] = useState<string | null>(null);

  const connected = account?.address ?? null;
  const matches =
    !!connected && !!ownerAddress && connected.toLowerCase() === ownerAddress.toLowerCase();
  const isAdmin = capabilityKind === "Admin";
  const running = status === "preparing" || status === "signing" || status === "executing";
  const canRevoke = matches && !running && (!isAdmin || adminAck);

  async function revoke() {
    if (!account?.address || !canRevoke) return;
    setError(null);
    setTxDigest(null);
    try {
      setStatus("preparing");
      setMessage("Preparing sponsored self-revoke.");
      const prepared = await postJson<PreparedRevokeResponse>("/api/share/sponsored/prepare", {
        action: "cap-self-revoke",
        sender: account.address,
        capId: capabilityId,
        capKind: capabilityKind,
        network,
      });

      setStatus("signing");
      setMessage("Sign holder self-revoke in your wallet.");
      const signed = await signTransaction({ transaction: prepared.bytes });
      if (!signed.signature) throw new Error("Wallet did not return a signature.");

      setStatus("executing");
      setMessage("Executing sponsored self-revoke.");
      const executed = await postJson<ExecutedRevokeResponse>("/api/share/sponsored/execute", {
        action: prepared.action,
        digest: prepared.digest,
        signature: signed.signature,
        capId: prepared.capId ?? capabilityId,
        capKind: prepared.capKind ?? capabilityKind,
        network: prepared.network,
      });

      setTxDigest(executed.txDigest);
      setStatus("done");
      setMessage("Capability self-revoked. Refreshing this page should now show it unavailable.");
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : String(err));
      setMessage("Self-revoke stopped before completion.");
    }
  }

  return (
    <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
      <div className={`verify-mini ${matches ? "ok" : ""}`}>
        <span className="vm-ic">
          <Icon name={matches ? "check" : "wallet"} size={16} />
        </span>
        <span>
          {connected ? (
            <>
              Connected as <span className="mono">{shortId(connected)}</span>
              {ownerAddress ? (
                matches ? (
                  <>. This wallet owns the capability object.</>
                ) : (
                  <>
                    . The capability owner is <span className="mono">{shortId(ownerAddress)}</span>.
                  </>
                )
              ) : (
                <>. This object is not address-owned.</>
              )}
            </>
          ) : (
            <>
              Connect the recipient wallet to compare it with the on-chain capability owner. No
              claim transaction is required by the current contract.
            </>
          )}
        </span>
        <span style={{ marginLeft: "auto" }}>
          <ConnectButton className="btn btn-ghost btn-sm" connectText="Connect" />
        </span>
      </div>

      {isAdmin ? (
        <label
          className="verify-mini"
          style={{ alignItems: "center", cursor: matches ? "pointer" : "default" }}
        >
          <input
            type="checkbox"
            checked={adminAck}
            disabled={!matches || running}
            onChange={(event) => setAdminAck(event.target.checked)}
          />
          <span>Admin cap self-revoke can remove namespace administration access.</span>
        </label>
      ) : null}

      <button
        type="button"
        className="btn btn-primary"
        disabled={!canRevoke}
        onClick={revoke}
        style={{ justifyContent: "center", width: "100%" }}
      >
        <Icon name={running ? "spinner" : "revoke"} size={16} />
        {running ? "Revoking..." : "Self-revoke capability"}
      </button>

      <div className={`verify-mini ${status === "done" ? "ok" : ""}`}>
        <span className="vm-ic">
          <Icon name={status === "done" ? "check" : "info"} size={16} />
        </span>
        <span>
          {message}
          {txDigest ? (
            <>
              {" "}
              Transaction <span className="mono">{shortId(txDigest)}</span>.
            </>
          ) : null}
        </span>
      </div>
      {error ? (
        <p style={{ color: "var(--danger, #e5484d)", fontSize: ".82rem", margin: 0 }}>{error}</p>
      ) : null}
    </div>
  );
}
