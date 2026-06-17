// Walrus blob storage for OneMem trace content.
//
// Trace metadata + Merkle hashes live on Sui (cheap, verifiable); the actual
// tool input/output payloads live as blobs on Walrus, referenced on-chain by
// blob ID. This module wraps `@mysten/walrus` with the settings that actually
// work from a normal client (learned by spiking against testnet):
//   - writes are paid in WAL (see scripts/get-wal.ts to fund a testnet address);
//   - direct-to-storage-node writes are flaky → go through the upload relay;
//   - the relay occasionally returns a transient `fetch failed` → retry;
//   - a just-written blob isn't instantly readable (sliver propagation), so the
//     first read can time out / abort → retry reads too.

import type { Signer } from "@mysten/sui/cryptography";
import type { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { RetryableWalrusClientError, type WalrusClient, walrus } from "@mysten/walrus";

import type { SuiNetwork } from "./generated/addresses.js";

/** Per-network Walrus upload-relay hosts. Others require an explicit host. */
export const UPLOAD_RELAY_BY_NETWORK: Partial<Record<SuiNetwork, string>> = {
  testnet: "https://upload-relay.testnet.walrus.space",
  mainnet: "https://upload-relay.mainnet.walrus.space",
};

export const DEFAULT_SEND_TIP_MAX = 1_000;
export const DEFAULT_STORAGE_EPOCHS = 3;
export const DEFAULT_WRITE_RETRIES = 3;
// Reads retry generously: a freshly-written blob can take >100s to propagate to
// enough storage-node slivers to be served, and Walrus has no "wait until
// readable" API — so the client retry window must outlast propagation lag.
export const DEFAULT_READ_RETRIES = 6;
export const DEFAULT_WRITE_TIMEOUT_MS = 60_000;
export const DEFAULT_READ_TIMEOUT_MS = 30_000;
export const DEFAULT_RETRY_BACKOFF_MS = 500;
// Cap exponential backoff so a high read-retry count doesn't balloon the sleep
// between attempts (2^5 * 500ms would be 16s otherwise).
export const DEFAULT_MAX_BACKOFF_MS = 4_000;

/**
 * Whether a write failure is worth retrying. Transient = the relay's own
 * `RetryableWalrusClientError` or a bare network `fetch failed`. Everything
 * else (insufficient WAL, bad signer, validation) is terminal — fail fast.
 */
export function isRetryableWalrusError(error: unknown): boolean {
  if (error instanceof RetryableWalrusClientError) return true;
  return error instanceof Error && error.message.includes("fetch failed");
}

/**
 * Whether a read failure is worth retrying. On top of the write-transient set,
 * a just-written blob may not yet be served by enough storage-node slivers, so
 * the single read aborts on timeout ("Request was aborted") — retrying gives
 * propagation time to catch up.
 */
export function isRetryableWalrusReadError(error: unknown): boolean {
  if (isRetryableWalrusError(error)) return true;
  if (!(error instanceof Error)) return false;
  // Anchor on the abort/timeout *signal* (DOMException name from AbortSignal.timeout,
  // or the storage node's specific "Request was aborted." wrap) rather than a loose
  // substring scan — so a terminal error that merely mentions "timeout" isn't retried
  // for the full (now wider) window.
  if (error.name === "AbortError" || error.name === "TimeoutError") return true;
  return error.message.toLowerCase().includes("request was aborted");
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export interface WalrusConfig {
  /** Upload-relay host. Defaults to the per-network host above. */
  readonly uploadRelayHost?: string;
  /** Max tip (MIST) paid to the relay per write. */
  readonly sendTipMax?: number;
  /** Storage duration in Walrus epochs. */
  readonly epochs?: number;
  /** If true the blob can later be deleted; trace evidence should be false. */
  readonly deletable?: boolean;
  /** Transient-failure retry attempts for writes. */
  readonly writeRetries?: number;
  /** Transient-failure retry attempts for reads (fresh-blob propagation). */
  readonly readRetries?: number;
  /** Base backoff (ms) between transient retries; doubles each attempt. Set 0 to disable (tests). */
  readonly retryBackoffMs?: number;
}

type WalrusExtendedClient = SuiJsonRpcClient & { walrus: WalrusClient };

/** Thrown when a Walrus write fails (after retries for transient errors). */
export class WalrusWriteError extends Error {
  constructor(
    message: string,
    readonly attempts: number,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "WalrusWriteError";
  }
}

/** Thrown when Walrus is used on a client where it wasn't configured. */
export class WalrusNotConfiguredError extends Error {
  constructor(network: string) {
    super(
      `Walrus is not configured for network "${network}". Pass { walrus: { uploadRelayHost } } to OneMem.create().`,
    );
    this.name = "WalrusNotConfiguredError";
  }
}

/** Thrown when reading a Walrus blob fails; carries the offending blob ID. */
export class WalrusReadError extends Error {
  constructor(
    message: string,
    readonly blobId: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "WalrusReadError";
  }
}

/**
 * Extend an EXISTING Sui client with Walrus. Returns null when no relay host
 * is known for the network and none was supplied (so the caller can leave
 * `onemem.walrus` undefined rather than crash).
 *
 * Critically, this extends the *same* client the rest of the SDK uses for Move
 * transactions — sharing one object/coin cache. A separate client instance
 * would bump the gas coin's version on Walrus writes without the Move client
 * noticing, producing "object unavailable for consumption" errors.
 */
export function extendWithWalrus(
  base: SuiJsonRpcClient,
  network: SuiNetwork,
  config: WalrusConfig = {},
): WalrusExtendedClient | null {
  const host = config.uploadRelayHost ?? UPLOAD_RELAY_BY_NETWORK[network];
  if (!host) return null;
  const extended = base.$extend(
    walrus({
      uploadRelay: { host, sendTip: { max: config.sendTipMax ?? DEFAULT_SEND_TIP_MAX } },
    }),
  );
  return extended as unknown as WalrusExtendedClient;
}

/** Uploads/reads OneMem trace payloads to/from Walrus via the upload relay. */
export class WalrusStore {
  private readonly epochs: number;
  private readonly deletable: boolean;
  private readonly retries: number;
  private readonly readRetries: number;
  private readonly backoffMs: number;

  constructor(
    private readonly client: WalrusExtendedClient,
    private readonly signer: Signer,
    config: WalrusConfig = {},
  ) {
    this.epochs = config.epochs ?? DEFAULT_STORAGE_EPOCHS;
    this.deletable = config.deletable ?? false;
    this.retries = config.writeRetries ?? DEFAULT_WRITE_RETRIES;
    this.readRetries = config.readRetries ?? DEFAULT_READ_RETRIES;
    this.backoffMs = config.retryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
  }

  /**
   * Upload bytes to Walrus; returns the blob ID to store on-chain. Retries
   * only TRANSIENT failures (with exponential backoff); terminal errors
   * (insufficient WAL, bad signer) fail fast so callers see the real cause.
   */
  async uploadBlob(bytes: Uint8Array): Promise<string> {
    let lastError: unknown;
    let attemptsMade = 0;
    for (let attempt = 1; attempt <= this.retries; attempt++) {
      attemptsMade = attempt;
      try {
        const { blobId } = await this.client.walrus.writeBlob({
          blob: bytes,
          deletable: this.deletable,
          epochs: this.epochs,
          signer: this.signer,
          signal: AbortSignal.timeout(DEFAULT_WRITE_TIMEOUT_MS),
        });
        return blobId;
      } catch (error) {
        lastError = error;
        if (!isRetryableWalrusError(error) || attempt === this.retries) break;
        if (this.backoffMs > 0) await sleep(this.backoffMs * 2 ** (attempt - 1));
      }
    }
    throw new WalrusWriteError(
      `Walrus write failed after ${attemptsMade} attempt(s)`,
      attemptsMade,
      { cause: lastError },
    );
  }

  /** Read a blob back from Walrus by its blob ID, retrying transient failures. */
  async readBlob(blobId: string): Promise<Uint8Array> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= this.readRetries; attempt++) {
      try {
        return await this.client.walrus.readBlob({
          blobId,
          signal: AbortSignal.timeout(DEFAULT_READ_TIMEOUT_MS),
        });
      } catch (error) {
        lastError = error;
        if (!isRetryableWalrusReadError(error) || attempt === this.readRetries) break;
        if (this.backoffMs > 0) {
          await sleep(Math.min(this.backoffMs * 2 ** (attempt - 1), DEFAULT_MAX_BACKOFF_MS));
        }
      }
    }
    throw new WalrusReadError(`Walrus read failed for blob ${blobId}`, blobId, {
      cause: lastError,
    });
  }
}
