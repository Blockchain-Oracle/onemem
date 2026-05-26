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
  readonly walrusInputBlob: string;
  readonly inputHash: Uint8Array;
  readonly label?: string | null;
}

export interface CloseCallArgs {
  readonly sessionId: string;
  readonly rwCapId: string;
  readonly callId: string;
  readonly walrusOutputBlob: string;
  readonly outputHash: Uint8Array;
  readonly status: CallStatus;
}

export interface CloseSessionArgs {
  readonly sessionId: string;
  readonly rwCapId: string;
  readonly status: SessionStatus;
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
        tx.pure.string(args.walrusInputBlob),
        tx.pure.vector("u8", Array.from(args.inputHash)),
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
    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::trace::close_call`,
      arguments: [
        tx.object(args.sessionId),
        tx.object(args.rwCapId),
        tx.pure.id(args.callId),
        tx.pure.string(args.walrusOutputBlob),
        tx.pure.vector("u8", Array.from(args.outputHash)),
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

    let running = ZERO_HASH;
    let brokenAt: number | null = null;
    events.forEach((event, idx) => {
      const expectedPrev = running;
      if (!u8eq(event.prevHash, expectedPrev)) {
        brokenAt ??= idx;
      }
      // Advance the running root.
      running = chainHash(running, event.contentHash);
    });

    const ok = brokenAt === null && u8eq(running, session.merkleRoot);
    return {
      ok,
      brokenAt,
      expectedMerkleRoot: session.merkleRoot,
      computedMerkleRoot: running,
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
