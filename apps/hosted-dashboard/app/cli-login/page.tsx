"use client";

import {
  ConnectButton,
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import type { SuiTransactionBlockResponse } from "@mysten/sui/jsonRpc";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";
import { generateDelegateKey } from "@mysten-incubation/memwal/account";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useHostedAuthConfig } from "@/components/HostedProviders";
import { Icon } from "@/components/Icon";
import {
  bytesToHex,
  digestFromExecuteResult,
  fetchMemWalAccount,
  findCreatedObject,
  hexToBytes,
  type MemWalLookupResponse,
  shortId,
} from "@/lib/cli-login-client";
import { CliLoginFallback } from "./fallback";
import { isPairingRunning, type PairingStatus, pairingStatusMessage, TTL_OPTIONS } from "./model";

const textEncoder = new TextEncoder();

function CliLoginInner() {
  const params = useSearchParams();
  const nonce = params.get("nonce") ?? "";
  const port = params.get("port") ?? "";
  const account = useCurrentAccount();
  const authConfig = useHostedAuthConfig();
  const suiClient = useSuiClient();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const activeRunRef = useRef(0);
  const [status, setStatus] = useState<PairingStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [delegateLabel, setDelegateLabel] = useState("onemem-cli");
  const [delegateTtlSeconds, setDelegateTtlSeconds] = useState<number>(TTL_OPTIONS[1].seconds);
  const [lookup, setLookup] = useState<MemWalLookupResponse | null>(null);
  const [lastDelegateDigest, setLastDelegateDigest] = useState<string | null>(null);

  const canPair = Boolean(nonce && port && account && lookup?.accountId);
  const running = isPairingRunning(status);
  const connectText = authConfig.enokiConfigured
    ? "Connect wallet or Google"
    : "Connect Sui wallet";
  const pairingUrlValid = nonce.length > 0 && port.length > 0;

  const statusMessage = useMemo(
    () =>
      pairingStatusMessage({
        hasAccount: Boolean(account),
        hasMemWalAccount: Boolean(lookup?.accountId),
        pairingUrlValid,
        status,
      }),
    [account, lookup?.accountId, pairingUrlValid, status],
  );

  function assertActive(runId: number): void {
    if (activeRunRef.current !== runId) throw new Error("CLI pairing was cancelled.");
  }

  function cancelWalletRequest(): void {
    activeRunRef.current += 1;
    setStatus("idle");
    setError("Wallet request cancelled. Any later approval for the old prompt will be ignored.");
  }

  useEffect(() => {
    activeRunRef.current += 1;
    if (!account) {
      setLookup(null);
      return;
    }

    let cancelled = false;
    setStatus("loading-account");
    setError(null);

    fetchMemWalAccount(account.address)
      .then((next) => {
        if (cancelled) return;
        setLookup(next);
        setStatus("idle");
      })
      .catch((err) => {
        if (cancelled) return;
        setLookup(null);
        setStatus("idle");
        setError(err instanceof Error ? err.message : String(err));
      });

    return () => {
      cancelled = true;
    };
  }, [account]);

  async function waitForDigest(digest: string): Promise<SuiTransactionBlockResponse> {
    const tx = await suiClient.waitForTransaction({
      digest,
      options: { showEffects: true, showObjectChanges: true },
    });
    if (tx.effects?.status?.status !== "success") {
      throw new Error(tx.effects?.status?.error ?? "Sui transaction failed.");
    }
    return tx as SuiTransactionBlockResponse;
  }

  async function createMemWalAccount() {
    if (!account || !lookup) return;
    const runId = activeRunRef.current + 1;
    activeRunRef.current = runId;
    setError(null);
    setStatus("creating-account");
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${lookup.packageId}::account::create_account`,
        arguments: [tx.object(lookup.registryId), tx.object(SUI_CLOCK_OBJECT_ID)],
      });
      const executed = await signAndExecuteTransaction({
        transaction: tx as unknown as Parameters<
          typeof signAndExecuteTransaction
        >[0]["transaction"],
      });
      assertActive(runId);
      const digest = digestFromExecuteResult(executed);
      const confirmed = await waitForDigest(digest);
      assertActive(runId);
      const accountId = findCreatedObject(confirmed, "::account::MemWalAccount");
      setLookup({ ...lookup, accountId });
      setStatus("idle");
    } catch (err) {
      if (activeRunRef.current !== runId) return;
      setStatus("idle");
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function approve() {
    if (!account || !lookup?.accountId) return;
    const runId = activeRunRef.current + 1;
    activeRunRef.current = runId;
    setError(null);
    setLastDelegateDigest(null);
    const label = delegateLabel.trim() || "onemem-cli";

    try {
      setStatus("generating-delegate");
      const delegate = await generateDelegateKey();
      assertActive(runId);
      const delegatePublicKey = `0x${bytesToHex(delegate.publicKey)}`;

      setStatus("registering-delegate");
      const tx = new Transaction();
      tx.moveCall({
        target: `${lookup.packageId}::account::add_delegate_key`,
        arguments: [
          tx.object(lookup.accountId),
          tx.pure.vector("u8", Array.from(delegate.publicKey)),
          tx.pure.address(delegate.suiAddress),
          tx.pure.string(label),
          tx.object(SUI_CLOCK_OBJECT_ID),
        ],
      });
      const executed = await signAndExecuteTransaction({
        transaction: tx as unknown as Parameters<
          typeof signAndExecuteTransaction
        >[0]["transaction"],
      });
      assertActive(runId);
      const delegateDigest = digestFromExecuteResult(executed);
      await waitForDigest(delegateDigest);
      assertActive(runId);
      setLastDelegateDigest(delegateDigest);

      const keypair = Ed25519Keypair.fromSecretKey(hexToBytes(delegate.privateKey));
      const signature = (await keypair.signPersonalMessage(textEncoder.encode(nonce))).signature;
      const createdAt = new Date();
      const expiresAt = new Date(createdAt.getTime() + delegateTtlSeconds * 1000);

      setStatus("posting-callback");
      assertActive(runId);
      const res = await fetch(`http://127.0.0.1:${port}/callback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nonce,
          delegateKey: delegate.privateKey,
          delegatePublicKey,
          delegateSuiAddress: delegate.suiAddress,
          delegateLabel: label,
          delegateTtlSeconds,
          accountId: lookup.accountId,
          suiAddress: account.address,
          memwalPackageId: lookup.packageId,
          relayerUrl: lookup.relayerUrl,
          network: lookup.network,
          createdAt: createdAt.toISOString(),
          expiresAt: expiresAt.toISOString(),
          sdkVersion: "0.1.0",
          signature,
          delegateRegistrationDigest: delegateDigest,
        }),
      });
      assertActive(runId);
      if (!res.ok) throw new Error(`CLI callback returned ${res.status}`);
      setStatus("paired");
    } catch (err) {
      if (activeRunRef.current !== runId) return;
      setStatus("idle");
      setError(
        err instanceof Error
          ? err.message
          : "Could not reach the CLI — is `onemem login` still running?",
      );
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-bg grid-bg grid-fade" />
      <div className="auth-card" style={{ maxWidth: 540 }}>
        <div className="auth-brand">
          <Icon name="key" size={26} />
          OneMem CLI
        </div>
        <div className="card" style={{ padding: 26 }}>
          {status !== "paired" ? (
            <>
              <h2 style={{ fontSize: "1.3rem", marginBottom: 6 }}>Pair your terminal</h2>
              <p className="muted" style={{ fontSize: ".9rem", marginBottom: 16 }}>
                <span className="mono">onemem login</span> opened this page. Connect a wallet,
                register a MemWal delegate key, and send it back to your local CLI.
              </p>

              <div className={`verify-mini ${canPair ? "ok" : ""}`}>
                <span className="vm-ic">
                  <Icon name={canPair ? "check" : "info"} size={16} />
                </span>
                <span>{statusMessage}</span>
              </div>

              <div style={{ marginTop: 12 }}>
                <ConnectButton className="auth-btn" connectText={connectText} />
              </div>

              <div className="receipt" style={{ marginTop: 14 }}>
                <div className="rcp-row">
                  <span className="rk">Device nonce</span>
                  <span className="rv mono">{nonce || "missing"}</span>
                </div>
                <div className="rcp-row">
                  <span className="rk">Callback port</span>
                  <span className="rv mono">{port ? `localhost:${port}` : "missing"}</span>
                </div>
                <div className="rcp-row">
                  <span className="rk">Wallet</span>
                  <span className="rv mono">{shortId(account?.address)}</span>
                </div>
                <div className="rcp-row">
                  <span className="rk">MemWal account</span>
                  <span className="rv mono">{shortId(lookup?.accountId)}</span>
                </div>
                <div className="rcp-row">
                  <span className="rk">Delegate tx</span>
                  <span className="rv mono">{shortId(lastDelegateDigest)}</span>
                </div>
              </div>

              {account && lookup && !lookup.accountId ? (
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ marginTop: 14, width: "100%", justifyContent: "center" }}
                  onClick={createMemWalAccount}
                  disabled={running}
                >
                  <Icon name="cube" size={16} />
                  {status === "creating-account" ? "Creating account..." : "Create MemWal account"}
                </button>
              ) : null}

              <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                <div className="field">
                  <label htmlFor="delegate-label">Delegate label</label>
                  <input
                    id="delegate-label"
                    value={delegateLabel}
                    onChange={(event) => setDelegateLabel(event.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className="field">
                  <label htmlFor="delegate-ttl">Delegate TTL</label>
                  <select
                    id="delegate-ttl"
                    value={delegateTtlSeconds}
                    onChange={(event) => setDelegateTtlSeconds(Number(event.target.value))}
                  >
                    {TTL_OPTIONS.map((option) => (
                      <option key={option.seconds} value={option.seconds}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                style={{ marginTop: 18, width: "100%", justifyContent: "center" }}
                onClick={approve}
                disabled={!canPair || running}
              >
                <Icon name="shield" size={16} />
                {running ? "Pairing..." : "Approve & mint delegate key"}
              </button>
              {running ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ marginTop: 10, width: "100%", justifyContent: "center" }}
                  onClick={cancelWalletRequest}
                >
                  Cancel wallet request
                </button>
              ) : null}
              {error ? (
                <p
                  style={{
                    color: "var(--danger, #e5484d)",
                    fontSize: ".8rem",
                    textAlign: "center",
                    marginTop: 12,
                  }}
                >
                  {error}
                </p>
              ) : null}
              <p
                className="faint"
                style={{ fontSize: ".78rem", textAlign: "center", marginTop: 14 }}
              >
                The delegate private key is sent only to the local CLI callback and is not stored in
                this hosted app.
              </p>
            </>
          ) : (
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
              <h2 style={{ fontSize: "1.3rem" }}>Pairing complete</h2>
              <p className="muted" style={{ fontSize: ".9rem", marginTop: 6 }}>
                Delegate key sent to <span className="mono">localhost:{port}</span>. You can close
                this tab and return to your terminal.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CliLoginPage() {
  return (
    <Suspense fallback={<CliLoginFallback />}>
      <CliLoginInner />
    </Suspense>
  );
}
