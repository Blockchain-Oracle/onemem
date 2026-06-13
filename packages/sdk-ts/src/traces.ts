// Trace operations module — TraceSession + ActionCall PTBs + off-chain
// Merkle chain verifier.
//
// Methods mirror onemem::trace entry functions 1:1:
//   openSession(args)   → trace::open_session   (returns shared TraceSession)
//   emitCall(args)      → trace::emit_call      (returns minted call ID)
//   closeCall(args)     → trace::close_call     (records output + status)
//   closeSession(args)  → trace::close_session  (locks merkle root + status)
//   verifySession(id)   → off-chain chain walk; reads chain, recomputes
//                         every content_hash, asserts session.merkle_root
//                         equals the running root. Powers the
//                         `/verify/[session_id]` public dashboard page.

import { Transaction } from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";
import { sha256 } from "@noble/hashes/sha2.js";

import type { OneMem } from "./client.js";
import type { CallStatus, SessionStatus } from "./types/move.js";

export interface OpenSessionArgs {
  readonly namespaceId: string;
  readonly rwCapId: string;
  readonly agentId: string;
  readonly environment: string;
  readonly sdkVersion: string;
}

export interface EmitCallArgs {
  readonly sessionId: string;
  readonly namespaceId: string;
  readonly rwCapId: string;
  readonly parentCallId?: string | null;
  readonly toolName: string;
  readonly toolNamespace: string;
  /** Raw tool input. If given, it's uploaded to Walrus and its blob ID stored on-chain; `inputHash` defaults to sha256(content). Requires Walrus configured. */
  readonly inputContent?: Uint8Array;
  /** Pre-uploaded Walrus blob ID. Provide this OR `inputContent`. */
  readonly walrusInputBlob?: string;
  /** On-chain integrity hash. Required if passing `walrusInputBlob`; auto-derived from `inputContent` otherwise. */
  readonly inputHash?: Uint8Array;
  /** Encrypt `inputContent` with Seal (for this namespace) before Walrus upload. Requires Seal configured. */
  readonly encrypt?: boolean;
  readonly label?: string | null;
}

export interface CloseCallArgs {
  readonly sessionId: string;
  readonly rwCapId: string;
  readonly callId: string;
  /** Raw tool output. If given, uploaded to Walrus; `outputHash` defaults to sha256(content). */
  readonly outputContent?: Uint8Array;
  /** Pre-uploaded Walrus blob ID. Provide this OR `outputContent`. */
  readonly walrusOutputBlob?: string;
  /** On-chain integrity hash. Required if passing `walrusOutputBlob`; auto-derived from `outputContent` otherwise. */
  readonly outputHash?: Uint8Array;
  /** Encrypt `outputContent` with Seal before upload. Requires `namespaceId` + Seal configured. */
  readonly encrypt?: boolean;
  /** Namespace for Seal encryption — required when `encrypt` is set on closeCall. */
  readonly namespaceId?: string;
  readonly status: CallStatus;
}

export interface CloseSessionArgs {
  readonly sessionId: string;
  readonly rwCapId: string;
  readonly status: SessionStatus;
}

/** Thrown when an emit/close call is given neither raw content nor a blob+hash pair. */
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
  readonly expectedMerkleRoot: Uint8Array;
  readonly computedMerkleRoot: Uint8Array;
  readonly callCount: number;
  readonly sessionStatus: SessionStatus;
}

export class TracesAPI {
  constructor(private readonly client: OneMem) {}

  /**
   * Resolve a call payload to (blobId, hash). If raw `content` is given it's
   * uploaded to Walrus and the hash defaults to sha256(content) — tying the
   * on-chain integrity hash to the exact stored bytes. Otherwise a
   * pre-uploaded blob ID + explicit hash must be supplied.
   */
  private async resolveBlob(
    content: Uint8Array | undefined,
    blobId: string | undefined,
    hash: Uint8Array | undefined,
    which: "input" | "output",
    encryptForNamespace?: string,
  ): Promise<{ blob: string; hash: Uint8Array }> {
    if (content !== undefined) {
      // Hash the PLAINTEXT (so a cap holder can decrypt the blob + re-hash to
      // verify); store ciphertext when encryption is requested.
      const plaintextHash = hash ?? sha256(content);
      const toStore = encryptForNamespace
        ? await this.client.requireSeal().encrypt(content, encryptForNamespace)
        : content;
      const uploadedId = await this.client.requireWalrus().uploadBlob(toStore);
      return { blob: uploadedId, hash: plaintextHash };
    }
    if (blobId === undefined || hash === undefined) {
      const field = which === "input" ? "walrusInputBlob" : "walrusOutputBlob";
      throw new TracePayloadError(
        `${which} payload missing: pass ${which}Content (uploaded to Walrus) or both ${field} + ${which}Hash`,
      );
    }
    return { blob: blobId, hash };
  }

  async openSession(args: OpenSessionArgs): Promise<{ sessionId: string; txDigest: string }> {
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

    const result = await this.client.client.signAndExecuteTransaction({
      signer: this.client.signer,
      transaction: tx,
      options: { showObjectChanges: true },
    });

    const sessionType = `${packageId}::trace::TraceSession`;
    // biome-ignore lint/suspicious/noExplicitAny: SuiObjectChange typing
    const session = (result.objectChanges as any[] | undefined)?.find(
      (c: any) => c.type === "created" && c.objectType === sessionType,
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

  async emitCall(args: EmitCallArgs): Promise<{ callId: string; txDigest: string }> {
    const { packageId } = this.client.addresses;
    const { blob, hash } = await this.resolveBlob(
      args.inputContent,
      args.walrusInputBlob,
      args.inputHash,
      "input",
      args.encrypt ? args.namespaceId : undefined,
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

    const result = await this.client.client.signAndExecuteTransaction({
      signer: this.client.signer,
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
    if (args.encrypt && !args.namespaceId) {
      throw new TracePayloadError("closeCall with encrypt=true requires namespaceId");
    }
    const { blob, hash } = await this.resolveBlob(
      args.outputContent,
      args.walrusOutputBlob,
      args.outputHash,
      "output",
      args.encrypt ? args.namespaceId : undefined,
    );
    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::trace::close_call`,
      arguments: [
        tx.object(args.sessionId),
        tx.object(args.rwCapId),
        tx.pure.id(args.callId),
        tx.pure.string(blob),
        tx.pure.vector("u8", Array.from(hash)),
        tx.pure.u8(args.status),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });
    const result = await this.client.client.signAndExecuteTransaction({
      signer: this.client.signer,
      transaction: tx,
    });
    return { txDigest: result.digest };
  }

  async closeSession(args: CloseSessionArgs): Promise<{ txDigest: string }> {
    const { packageId } = this.client.addresses;
    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::trace::close_session`,
      arguments: [
        tx.object(args.sessionId),
        tx.object(args.rwCapId),
        tx.pure.u8(args.status),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });
    const result = await this.client.client.signAndExecuteTransaction({
      signer: this.client.signer,
      transaction: tx,
    });
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
    const session = await this.fetchSession(sessionId);
    const events = await this.fetchEmittedEvents(sessionId);

    // Sort events by their on-chain order (the events come back in tx-order;
    // within a single tx the order is preserved by the validator).
    events.sort((a, b) => Number(a.timestampMs - b.timestampMs));

    // TWO chains to verify (per docs/05-our-architecture/01-protocol/
    // events-and-attestation.md + trace.move):
    //
    //   1. prev_hash chain: each call's prev_hash == previous call's
    //      content_hash (or ZERO_HASH for the first call). Confirms no
    //      call was inserted/dropped in the middle.
    //
    //   2. merkle_root chain: session.merkle_root is the result of
    //      chain_hash(running, content) applied for each call. Confirms
    //      no call's content_hash was forged.
    //
    // Both must hold for ok = true.
    // Typed as the general Uint8Array (not the ArrayBuffer-narrowed inference
    // from ZERO_HASH) so on-chain hashes (ArrayBufferLike) assign cleanly.
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

    const ok = brokenAt === null && u8eq(runningMerkle, session.merkleRoot);
    return {
      ok,
      brokenAt,
      expectedMerkleRoot: session.merkleRoot,
      computedMerkleRoot: runningMerkle,
      callCount: events.length,
      sessionStatus: session.status,
    };
  }

  /** Fetch + decode a TraceSession object. Implementation lives in fetchers/ to keep this file under the 400-line cap. */
  private async fetchSession(sessionId: string) {
    const { fetchTraceSession } = await import("./fetchers/trace.js");
    return fetchTraceSession(this.client.client, sessionId);
  }

  private async fetchEmittedEvents(sessionId: string) {
    const { fetchActionCallEmittedEvents } = await import("./fetchers/trace.js");
    return fetchActionCallEmittedEvents(
      this.client.client,
      this.client.addresses.packageId,
      sessionId,
    );
  }
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
