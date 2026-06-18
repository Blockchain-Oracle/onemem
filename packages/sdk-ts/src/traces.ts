// Trace operations module — TraceSession + ActionCall PTBs + off-chain
// Merkle chain verifier.
//
// Methods mirror the shared SDK surface (docs/.../shared-api-surface.md):
//   startSession(args)  → trace::open_session   (returns shared TraceSession)
//   appendCall(args)    → trace::emit_call      (returns minted call ID)
//   closeCall(args)     → trace::close_call_with_namespace
//   endSession(args)    → trace::close_session_with_namespace
//   getCalls/getSession/listSessions/replaySession → read helpers
//   verifySession(id)   → off-chain chain walk; reads chain, recomputes
//                         every content_hash, asserts session.merkle_root
//                         equals the running root. Powers the
//                         `/verify/[session_id]` public dashboard page.

import type { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { Transaction } from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";
import { sha256 } from "@noble/hashes/sha2.js";

import type { OneMem } from "./client.js";
import type { CallStatus, SessionStatus } from "./types/move.js";

export interface StartSessionArgs {
  readonly namespaceId: string;
  readonly rwCapId: string;
  readonly agentId: string;
  readonly environment: string;
  readonly sdkVersion: string;
}

/**
 * A trace call's payload — raw content XOR a pre-uploaded blob. Modelled as a
 * discriminated union so illegal states (blob without hash, content + blob both
 * set) are unrepresentable rather than caught at runtime:
 *   - `{ content }`     → uploaded to Walrus; hash defaults to sha256(content).
 *                         Set `encrypt` to Seal-encrypt before upload (the hash
 *                         still covers the PLAINTEXT). Requires Walrus configured.
 *   - `{ walrusBlob, hash }` → already on Walrus; you supply the integrity hash.
 */
export type CallPayload =
  | { readonly content: Uint8Array; readonly hash?: Uint8Array; readonly encrypt?: boolean }
  | { readonly walrusBlob: string; readonly hash: Uint8Array };

export interface AppendCallArgs {
  readonly sessionId: string;
  readonly namespaceId: string;
  readonly rwCapId: string;
  readonly parentCallId?: string | null;
  readonly toolName: string;
  readonly toolNamespace: string;
  readonly input: CallPayload;
  readonly label?: string | null;
}

export interface CloseCallArgs {
  readonly sessionId: string;
  readonly namespaceId: string;
  readonly rwCapId: string;
  readonly callId: string;
  readonly output: CallPayload;
  readonly status: CallStatus;
}

export interface EndSessionArgs {
  readonly sessionId: string;
  readonly namespaceId: string;
  readonly rwCapId: string;
  readonly status: SessionStatus;
}

/** Thrown when a call requests `encrypt` but omits the `namespaceId` Seal needs. */
export class TracePayloadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TracePayloadError";
  }
}

export interface VerifyResult {
  readonly ok: boolean;
  /** Index of the first call whose computed content_hash doesn't match the on-chain stored hash. Null if ok. */
  readonly brokenAt: number | null;
  readonly rootMatches: boolean;
  readonly countMatches: boolean;
  readonly expectedMerkleRoot: Uint8Array;
  readonly computedMerkleRoot: Uint8Array;
  readonly callCount: number;
  readonly sessionCallCount: number;
  readonly sessionStatus: SessionStatus;
}

export class TracesAPI {
  constructor(private readonly client: OneMem) {}

  /**
   * Resolve a {@link CallPayload} to (blobId, hash). For the `content` variant
   * the bytes are uploaded to Walrus and the hash defaults to sha256(content) —
   * tying the on-chain integrity hash to the exact stored bytes; encryption (if
   * requested) stores ciphertext while the hash still covers the plaintext. For
   * the `walrusBlob` variant the caller-supplied blob ID + hash pass through.
   */
  private async resolvePayload(
    payload: CallPayload,
    encryptForNamespace: string | undefined,
  ): Promise<{ blob: string; hash: Uint8Array }> {
    if ("content" in payload) {
      const plaintextHash = payload.hash ?? sha256(payload.content);
      const toStore = encryptForNamespace
        ? await this.client.requireSeal().encrypt(payload.content, encryptForNamespace)
        : payload.content;
      const uploadedId = await this.client.requireWalrus().uploadBlob(toStore);
      return { blob: uploadedId, hash: plaintextHash };
    }
    return { blob: payload.walrusBlob, hash: payload.hash };
  }

  async startSession(args: StartSessionArgs): Promise<{ sessionId: string; txDigest: string }> {
    const { packageId } = this.client.addresses;
    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::trace::open_session`,
      arguments: [
        tx.object(args.namespaceId),
        tx.object(args.rwCapId),
        tx.pure.string(args.agentId),
        tx.pure.string(args.environment),
        tx.pure.string(args.sdkVersion),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });

    const result = await this.client.execute({
      transaction: tx,
      options: { showObjectChanges: true },
    });

    const sessionType = `${packageId}::trace::TraceSession`;
    const session = (
      result.objectChanges as
        | Array<{ type: string; objectType?: string; objectId?: string }>
        | undefined
    )?.find(
      (change): change is { type: "created"; objectType: string; objectId: string } =>
        change.type === "created" && change.objectType === sessionType,
    );
    if (!session || session.type !== "created") {
      throw new Error(
        `open_session did not return a TraceSession. objectChanges: ${JSON.stringify(
          result.objectChanges,
          null,
          2,
        )}`,
      );
    }
    return { sessionId: session.objectId, txDigest: result.digest };
  }

  async appendCall(args: AppendCallArgs): Promise<{ callId: string; txDigest: string }> {
    const { packageId } = this.client.addresses;
    const wantsEncrypt = "content" in args.input && args.input.encrypt === true;
    if (wantsEncrypt && !args.namespaceId) {
      throw new TracePayloadError("appendCall with input.encrypt=true requires namespaceId");
    }
    const { blob, hash } = await this.resolvePayload(
      args.input,
      wantsEncrypt ? args.namespaceId : undefined,
    );
    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::trace::emit_call`,
      arguments: [
        tx.object(args.sessionId),
        tx.object(args.namespaceId),
        tx.object(args.rwCapId),
        optionId(tx, args.parentCallId ?? null),
        tx.pure.string(args.toolName),
        tx.pure.string(args.toolNamespace),
        tx.pure.string(blob),
        tx.pure.vector("u8", Array.from(hash)),
        optionString(tx, args.label ?? null),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });

    const result = await this.client.execute({
      transaction: tx,
      options: { showObjectChanges: true, showEvents: true },
    });

    // emit_call returns the new call_id, but the simplest way to get it is to
    // look for the ActionCallEmittedEvent payload.
    const emittedType = `${packageId}::events::ActionCallEmittedEvent`;
    // biome-ignore lint/suspicious/noExplicitAny: SuiEvent typing
    const event = (result.events as any[] | undefined)?.find((e: any) => e.type === emittedType);
    if (!event) {
      throw new Error(
        `emit_call did not emit ActionCallEmittedEvent. events: ${JSON.stringify(result.events, null, 2)}`,
      );
    }
    const callId = (event.parsedJson as { call_id?: string } | undefined)?.call_id;
    if (!callId) {
      throw new Error(
        `ActionCallEmittedEvent missing call_id: ${JSON.stringify(event.parsedJson)}`,
      );
    }
    return { callId, txDigest: result.digest };
  }

  async closeCall(args: CloseCallArgs): Promise<{ txDigest: string }> {
    const { packageId } = this.client.addresses;
    const wantsEncrypt = "content" in args.output && args.output.encrypt === true;
    if (wantsEncrypt && !args.namespaceId) {
      throw new TracePayloadError("closeCall with output.encrypt=true requires namespaceId");
    }
    const { blob, hash } = await this.resolvePayload(
      args.output,
      wantsEncrypt ? args.namespaceId : undefined,
    );
    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::trace::close_call_with_namespace`,
      arguments: [
        tx.object(args.sessionId),
        tx.object(args.namespaceId),
        tx.object(args.rwCapId),
        tx.pure.id(args.callId),
        tx.pure.string(blob),
        tx.pure.vector("u8", Array.from(hash)),
        tx.pure.u8(args.status),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });
    const result = await this.client.execute({ transaction: tx });
    return { txDigest: result.digest };
  }

  async endSession(args: EndSessionArgs): Promise<{ txDigest: string }> {
    const { packageId } = this.client.addresses;
    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::trace::close_session_with_namespace`,
      arguments: [
        tx.object(args.sessionId),
        tx.object(args.namespaceId),
        tx.object(args.rwCapId),
        tx.pure.u8(args.status),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });
    const result = await this.client.execute({ transaction: tx });
    return { txDigest: result.digest };
  }

  /**
   * Off-chain verification of a TraceSession's Merkle chain. Reads the
   * session + its emitted events, walks the chain step by step in the
   * client, and asserts the recomputed root matches the on-chain
   * session.merkle_root. This is what `/verify/[session_id]` runs.
   *
   * The verification proves CHAIN INTEGRITY (no one tampered with the
   * recorded sequence). It does NOT prove the agent honestly recorded its
   * real activity — that requires either trusting the captured_by_address
   * delegate-key holder OR the v0.2 Nautilus TEE relayer.
   */
  async verifySession(sessionId: string): Promise<VerifyResult> {
    return verifyTraceChain(this.client.client, this.client.addresses.packageId, sessionId);
  }

  /** Fetch a TraceSession's on-chain metadata (decoded). */
  async getSession(sessionId: string) {
    return this.fetchSession(sessionId);
  }

  /** List a session's ActionCalls (from emitted events), ascending by time. */
  async getCalls(sessionId: string) {
    const events = await this.fetchEmittedEvents(sessionId);
    return events.sort((a, b) => Number(a.timestampMs - b.timestampMs));
  }

  /** List recent TraceSessions (from opened events), newest first. Optionally scope by namespace/agent. */
  async listSessions(opts: { namespaceId?: string; agentId?: string; limit?: number } = {}) {
    const { fetchOpenedSessions } = await import("./fetchers/trace.js");
    return fetchOpenedSessions(this.client.client, this.client.addresses.packageId, opts);
  }

  /**
   * Reconstruct a session from chain: the TraceSession object + its ActionCalls
   * in execution order. This is the metadata replay (verifiable from chain alone);
   * per-call plaintext is Seal-decrypted client-side with a SessionKey.
   */
  async replaySession(sessionId: string) {
    const [session, calls] = await Promise.all([
      this.getSession(sessionId),
      this.getCalls(sessionId),
    ]);
    return { session, calls };
  }

  /** Fetch + decode a TraceSession object. Implementation lives in fetchers/ to keep this file under the 400-line cap. */
  private async fetchSession(sessionId: string) {
    const { fetchTraceSession } = await import("./fetchers/trace.js");
    return fetchTraceSession(this.client.client, sessionId);
  }

  private async fetchEmittedEvents(sessionId: string) {
    const { fetchTraceSession, fetchActionCallEmittedEvents } = await import("./fetchers/trace.js");
    const session = await fetchTraceSession(this.client.client, sessionId);
    return fetchActionCallEmittedEvents(this.client.client, session.packageId, sessionId);
  }
}

// === Standalone verifier ===

/**
 * Off-chain Merkle verification of a TraceSession, using only a read-only
 * SuiJsonRpcClient + the package id. No signer, Walrus, or Seal needed — ideal
 * for the public dashboard verify page and any independent verifier.
 *
 * Verifies BOTH chains: (1) each call's prev_hash equals the predecessor's
 * content_hash (no insert/drop), and (2) the folded merkle_root matches the
 * on-chain session.merkle_root (no content forgery).
 */
export async function verifyTraceChain(
  client: SuiJsonRpcClient,
  packageId: string,
  sessionId: string,
): Promise<VerifyResult> {
  const { fetchTraceSession, fetchActionCallEmittedEvents } = await import("./fetchers/trace.js");
  const session = await fetchTraceSession(client, sessionId);
  const events = await fetchActionCallEmittedEvents(
    client,
    session.packageId || packageId,
    sessionId,
  );
  events.sort((a, b) => Number(a.timestampMs - b.timestampMs));

  let runningMerkle: Uint8Array = ZERO_HASH;
  let prevContent: Uint8Array = ZERO_HASH;
  let brokenAt: number | null = null;
  events.forEach((event, idx) => {
    if (brokenAt === null && !u8eq(event.prevHash, prevContent)) {
      brokenAt = idx;
    }
    runningMerkle = chainHash(runningMerkle, event.contentHash);
    prevContent = event.contentHash;
  });

  const rootMatches = u8eq(runningMerkle, session.merkleRoot);
  const sessionCallCount = Number(session.callCount);
  const countMatches = events.length === sessionCallCount;
  const ok = brokenAt === null && rootMatches && countMatches;
  return {
    ok,
    brokenAt,
    rootMatches,
    countMatches,
    expectedMerkleRoot: session.merkleRoot,
    computedMerkleRoot: runningMerkle,
    callCount: events.length,
    sessionCallCount,
    sessionStatus: session.status,
  };
}

// === Helpers ===

const ZERO_HASH = new Uint8Array(32);

// Return type narrowed to Uint8Array<ArrayBuffer> so callers that declared
// `running` from `new Uint8Array(N)` (also Uint8Array<ArrayBuffer>) can
// assign the result. TS 5.9 distinguishes the two generic narrowings.
function chainHash(running: Uint8Array, content: Uint8Array): Uint8Array<ArrayBuffer> {
  const buf = new Uint8Array(running.length + content.length);
  buf.set(running, 0);
  buf.set(content, running.length);
  return Uint8Array.from(sha256(buf));
}

function u8eq(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function optionId(tx: Transaction, id: string | null) {
  return id ? tx.pure.option("id", id) : tx.pure.option("id", null);
}

function optionString(tx: Transaction, s: string | null) {
  return s ? tx.pure.option("string", s) : tx.pure.option("string", null);
}
