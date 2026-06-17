// OneMem trace recorder for the OpenClaw plugin.
//
// An OpenClaw plugin runs in one long-lived process, so per-session trace state
// lives in an in-memory map. Defensive throughout: a OneMem failure must never
// break the agent, so callers swallow errors.
//
// Design (matches the verifiable-execution reference plugin): OpenClaw does not
// reliably expose a `session_start` hook, so we NEVER pre-allocate on-chain.
// Tool/LLM calls are buffered lazily (the session map entry is created on first
// sight of a sessionKey), and ALL on-chain work — provisioning, startSession,
// the Merkle-chained ActionCalls, endSession — is deferred to the single
// `agent_end` flush.
//
// Zero-config: namespace/cap/signer are auto-resolved + auto-provisioned (see
// provision.ts) so a user never has to copy IDs or wire env.

import { OneMem, recordSession, shouldTraceRuntime } from "@onemem/sdk-ts/runtime";

import { ensureTarget, type ProvisionedTarget, resolveSigner } from "./provision.js";

const NETWORKS = ["testnet", "mainnet", "devnet", "local"] as const;
type Network = (typeof NETWORKS)[number];

export interface TraceConfig {
  /**
   * Explicit trace target. Both ids travel as a pair (a target is meaningless
   * with only one), so they're modeled as one optional object — absent means
   * "auto-provision + persist at first flush".
   */
  target?: ProvisionedTarget;
  network: Network;
  privateKey?: string;
}

/** Raw config bag from OpenClaw's `api.pluginConfig` (all optional). */
export interface PluginConfigOverrides {
  namespaceId?: unknown;
  rwCapId?: unknown;
  network?: unknown;
  privateKey?: unknown;
}

/** Minimal logger surface (OpenClaw's `api.logger`) so lifecycle is visible. */
export interface TraceLogger {
  info?: (msg: string) => void;
  warn?: (msg: string) => void;
}

function str(...vals: unknown[]): string | undefined {
  for (const v of vals) if (typeof v === "string" && v.length > 0) return v;
  return undefined;
}

/**
 * Resolve OneMem config from `api.pluginConfig` first, then env. Always returns
 * a config (the plugin is zero-config: a missing namespace/cap is provisioned at
 * flush time, not a reason to stay inert).
 */
export function loadConfig(overrides?: PluginConfigOverrides): TraceConfig {
  const rawNetwork = str(overrides?.network, process.env.SUI_NETWORK);
  const network = (NETWORKS as readonly string[]).includes(rawNetwork ?? "")
    ? (rawNetwork as Network)
    : "testnet";
  const namespaceId = str(overrides?.namespaceId, process.env.ONEMEM_NAMESPACE_ID);
  const rwCapId = str(overrides?.rwCapId, process.env.ONEMEM_RW_CAP_ID);
  return {
    // Only an explicit target when BOTH ids are present; a half-configured pair
    // is treated as "unconfigured" → auto-provision.
    target: namespaceId && rwCapId ? { namespaceId, rwCapId } : undefined,
    network,
    privateKey: str(overrides?.privateKey, process.env.ONEMEM_PRIVATE_KEY),
  };
}

interface BufferedCall {
  toolName: string;
  input: unknown;
  output: unknown;
}

const RUNTIME_ID = "openclaw";

/**
 * Records OpenClaw agent activity as a verifiable OneMem trace: buffer every
 * tool/LLM call per session, then flush them as one TraceSession of
 * Merkle-chained ActionCalls at agent_end. One recorder instance per plugin
 * process.
 */
export class TraceRecorder {
  private client: OneMem | null = null;
  // Memoized so concurrent agent_end flushes await ONE provisioning attempt
  // (otherwise two sessions ending together could each mint a namespace).
  private targetPromise: Promise<ProvisionedTarget | null> | null = null;
  private readonly buffers = new Map<string, BufferedCall[]>();

  constructor(
    private readonly config: TraceConfig,
    private readonly logger?: TraceLogger,
  ) {}

  private traceEnabled(): boolean {
    try {
      return shouldTraceRuntime(RUNTIME_ID);
    } catch (err) {
      this.logger?.warn?.(
        `[oc-onemem] trace skipped: runtime controls unreadable: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return false;
    }
  }

  private async getClient(): Promise<OneMem> {
    if (!this.client) {
      this.client = await OneMem.create({
        network: this.config.network,
        signer: resolveSigner(this.config.privateKey, this.logger),
      });
    }
    return this.client;
  }

  /** Buffer a captured call, lazily creating the session entry. */
  record(sessionKey: string, call: BufferedCall): void {
    if (!this.traceEnabled()) return;
    const buf = this.buffers.get(sessionKey);
    if (buf) buf.push(call);
    else this.buffers.set(sessionKey, [call]);
  }

  /**
   * agent_end → flush the buffered calls as one on-chain TraceSession
   * (startSession → appendCall/closeCall chain → endSession). Returns the
   * on-chain session id, or null if nothing was buffered / on a failure.
   */
  async end(sessionKey: string): Promise<string | null> {
    const calls = this.buffers.get(sessionKey);
    if (!calls || calls.length === 0) {
      this.buffers.delete(sessionKey);
      return null;
    }
    this.buffers.delete(sessionKey);
    if (!this.traceEnabled()) {
      this.logger?.info?.(
        `[oc-onemem] skipped ${calls.length} buffered call(s); runtime controls disabled tracing`,
      );
      return null;
    }
    try {
      const onemem = await this.getClient();
      this.targetPromise ??= ensureTarget(onemem, this.config, this.logger);
      const target = await this.targetPromise;
      if (!target) {
        // Provisioning unavailable (e.g. unfunded signer). ensureTarget already
        // warned with the cause; note here that THIS session's buffer is dropped
        // (it was removed above), and clear the memo so a later flush retries.
        this.logger?.warn?.(
          `[oc-onemem] dropping ${calls.length} buffered call(s); no trace target`,
        );
        this.targetPromise = null;
        return null;
      }

      const { sessionId } = await recordSession(onemem, {
        target,
        agentId: "openclaw",
        environment: "openclaw",
        calls,
      });
      return sessionId;
    } catch (err) {
      // Defensive: never break the host agent. But a failure here means we
      // built a full trace and lost it on write — surface it so an operator
      // can see it (the return value alone can't distinguish this from "nothing
      // buffered").
      this.logger?.warn?.(
        `[oc-onemem] trace flush failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
    }
  }
}
