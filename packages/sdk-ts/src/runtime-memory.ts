// Shared memory recorder for runtime integrations — the Mem0-mirror surface.
// Providers/plugins use it to:
//   recall(query)  -> vector-search prior memories to inject into context
//   capture(text)  -> store a new memory (MemWal: Seal-encrypted blob on Walrus)
// Both are defensive: a OneMem/MemWal failure must never break the host agent
// (recall returns [] so injection is simply empty; capture is fire-and-forget).

import { OneMem, type SuiNetwork } from "./client.js";
import { resolveMemoryConfigFromSources } from "./credentials.js";
import type { Memory, MemoryConfig } from "./memory.js";
import { type RuntimeLogger, resolveNetwork, resolveSigner } from "./runtime.js";

const errMsg = (err: unknown): string => (err instanceof Error ? err.message : String(err));

/**
 * Resolve MemWal memory config from env. Returns undefined unless the three
 * required secrets are present, so memory stays OFF (not half-configured) until
 * a delegate key + account + embedding key are wired.
 */
export function memoryConfigFromEnv(): MemoryConfig | undefined {
  return resolveMemoryConfigFromSources().config;
}

export const DEFAULT_RECALL_TOP_K = 5;

/**
 * Render recalled memories as a context block to prepend to an agent's input.
 * Returns the input unchanged when there are no memories, so callers can wire
 * `injectMemories(input, await recorder.recall(input))` unconditionally.
 */
export function injectMemories(input: string, memories: Memory[]): string {
  if (memories.length === 0) return input;
  const block = memories.map((m) => `- ${m.text}`).join("\n");
  return `Relevant memories from past sessions:\n${block}\n\n${input}`;
}

export interface MemoryRecorderOptions {
  network?: SuiNetwork;
  /** Signer key for Seal/Walrus signing; else keystore/generated wallet. */
  privateKey?: string;
  /** Explicit MemWal config; else resolved from env (memoryConfigFromEnv). */
  memory?: MemoryConfig;
  /** MemWal namespace for isolation (overrides the config's namespace). */
  namespace?: string;
  /** Disable recall/capture (default on when memory is configured). */
  enableMemory?: boolean;
  /** Defaults to console.warn so a silent-off is visible; pass {} to silence. */
  logger?: RuntimeLogger;
}

export interface MemoryRecorder {
  /** True when MemWal memory is configured + enabled. */
  readonly enabled: boolean;
  /** Vector-search prior memories for injection. Returns [] when disabled or on failure. */
  recall(query: string, topK?: number): Promise<Memory[]>;
  /**
   * Store a memory on MemWal (Seal-encrypted blob on Walrus). Never throws —
   * returns true when the write succeeded, false when disabled/empty or the
   * write failed, so a caller that cares about durability can detect (but isn't
   * broken by) loss.
   */
  capture(text: string): Promise<boolean>;
}

/**
 * Shared memory recorder: lazily + once builds a OneMem client with MemWal
 * config and exposes recall/capture off the caller's critical path. A OneMem
 * failure never breaks the host (recall -> [], capture swallows + logs).
 */
export function createMemoryRecorder(opts: MemoryRecorderOptions = {}): MemoryRecorder {
  const logger: RuntimeLogger = opts.logger ?? { warn: (m) => console.warn(m) };
  const memory = opts.memory ?? memoryConfigFromEnv();
  const enabled = opts.enableMemory !== false && memory !== undefined;
  const network = resolveNetwork(opts.network, logger);
  const namespace = opts.namespace ?? memory?.namespace;

  let clientPromise: Promise<OneMem> | null = null;
  function getClient(): Promise<OneMem> {
    if (!clientPromise) {
      const p = OneMem.create({ network, signer: resolveSigner(opts.privateKey, logger), memory });
      clientPromise = p;
      p.catch(() => {
        if (clientPromise === p) clientPromise = null;
      });
    }
    return clientPromise;
  }

  async function recall(query: string, topK: number = DEFAULT_RECALL_TOP_K): Promise<Memory[]> {
    if (!enabled || !query) return [];
    try {
      const client = await getClient();
      const { results } = await client.requireMemory().search(query, { namespace, topK });
      return results;
    } catch (err) {
      logger.warn?.(`[onemem] memory recall failed: ${errMsg(err)}`);
      return [];
    }
  }

  async function capture(text: string): Promise<boolean> {
    if (!enabled || !text) return false;
    try {
      const client = await getClient();
      await client.requireMemory().add(text, { namespace });
      return true;
    } catch (err) {
      logger.warn?.(`[onemem] memory capture failed: ${errMsg(err)}`);
      return false;
    }
  }

  return { enabled, recall, capture };
}
