// /verify/[session_id] — PUBLIC chain verifier (no login, no signer).
// Anyone can paste a session id and independently verify the Merkle chain.
// Spec: docs/05-our-architecture/06-dashboard/route-verify-public.md

import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { addressesFor, type VerifyResult, verifyTraceChain } from "@onemem/sdk-ts";

export const dynamic = "force-dynamic";

type Params = { session_id: string };

const C = {
  cream: "#faf8f5",
  ink: "#1a1a1a",
  fog: "#6b7280",
  lavender: "#b08fff",
  chartreuse: "#d4ff5e",
  sui: "#0090ff",
  mono: '"JetBrains Mono", ui-monospace, "SF Mono", monospace',
  body: '"Inter", system-ui, -apple-system, sans-serif',
};

function hex(bytes: Uint8Array): string {
  return `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

async function verify(sessionId: string): Promise<VerifyResult | { error: string }> {
  try {
    const addr = addressesFor("testnet");
    const client = new SuiJsonRpcClient({ network: "testnet", url: addr.rpcUrl });
    return await verifyTraceChain(client, addr.packageId, sessionId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 16,
        padding: "10px 0",
        borderBottom: "1px solid #eee",
      }}
    >
      <span style={{ color: C.fog, fontSize: 14 }}>{label}</span>
      <span
        style={{
          fontFamily: mono ? C.mono : C.body,
          fontSize: 13,
          color: C.ink,
          wordBreak: "break-all",
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default async function PublicVerifyPage({ params }: { params: Promise<Params> }) {
  const { session_id } = await params;
  const result = await verify(session_id);
  const ok = "ok" in result && result.ok;
  const errored = "error" in result;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: C.cream,
        color: C.ink,
        fontFamily: C.body,
        padding: "48px 20px",
      }}
    >
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <p style={{ color: C.lavender, fontWeight: 700, letterSpacing: 1, margin: 0 }}>OneMem</p>
        <h1 style={{ fontSize: 30, margin: "6px 0 4px" }}>Trace verification</h1>
        <p style={{ color: C.fog, marginTop: 0 }}>
          Independent, on-chain Merkle verification — no account, no trust in us.
        </p>

        <div
          style={{
            marginTop: 28,
            borderRadius: 20,
            padding: 28,
            background: "#fff",
            border: `2px solid ${ok ? C.chartreuse : errored ? "#f3f4f6" : "#ffd5d5"}`,
            boxShadow: ok ? `0 0 0 6px ${C.chartreuse}33` : "none",
          }}
        >
          {errored ? (
            <p style={{ margin: 0, color: C.fog }}>
              Could not verify: {(result as { error: string }).error}
            </p>
          ) : (
            <>
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: ok ? C.ink : "#b00020",
                  background: ok ? C.chartreuse : "transparent",
                  padding: ok ? "4px 14px" : 0,
                  borderRadius: 9999,
                }}
              >
                {ok ? "Verified ✓" : "Verification failed ✗"}
              </span>
              <div style={{ marginTop: 20 }}>
                <Row label="Session" value={session_id} mono />
                <Row label="Calls in chain" value={String((result as VerifyResult).callCount)} />
                <Row
                  label="On-chain Merkle root"
                  value={hex((result as VerifyResult).expectedMerkleRoot)}
                  mono
                />
                <Row
                  label="Recomputed root"
                  value={hex((result as VerifyResult).computedMerkleRoot)}
                  mono
                />
                {!ok && (result as VerifyResult).brokenAt !== null && (
                  <Row
                    label="Chain breaks at call #"
                    value={String((result as VerifyResult).brokenAt)}
                  />
                )}
              </div>
            </>
          )}
        </div>

        <p style={{ marginTop: 18 }}>
          <a
            href={`https://suiscan.xyz/testnet/object/${session_id}`}
            style={{ color: C.sui, fontSize: 14 }}
            target="_blank"
            rel="noreferrer"
          >
            View on Suiscan →
          </a>
        </p>
      </div>
    </main>
  );
}
