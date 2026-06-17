// Zero-config provisioning for the OneMem OpenClaw plugin.
//
// A thin adapter over the shared `@onemem/sdk-ts/runtime` helpers so the plugin
// doesn't re-implement signer resolution, faucet top-up, or namespace minting
// (those live in one place now). The only plugin-specific bit is the defensive
// "return null instead of throwing" contract the recorder relies on.
//
// Resolution order (inherited from the shared runtime):
//   signer : ONEMEM_PRIVATE_KEY → sui keystore → generated+persisted wallet
//   target : configured ns/cap → persisted ~/.onemem/oc-onemem.<network>.json →
//            freshly minted MemoryNamespace + ReadWrite cap (then persisted)

import { ensureNamespace, type ProvisionedTarget, resolveSigner } from "@onemem/sdk-ts/runtime";

import type { TraceConfig, TraceLogger } from "./onemem-trace.js";

export type { ProvisionedTarget };
export { resolveSigner };

// Label drives the persisted-target filename (`<label>.<network>.json`) and the
// on-chain namespace name — kept as "oc-onemem" so existing persisted targets
// resolve unchanged.
const LABEL = "oc-onemem";

/**
 * Resolve the trace target (namespace + RW cap): an explicit config target wins;
 * otherwise delegate to the shared `ensureNamespace` (persist-or-provision).
 * Returns null — never throws — when provisioning is impossible (e.g. unfunded
 * signer), so the recorder can skip this flush without breaking the host agent.
 */
export async function ensureTarget(
  client: Parameters<typeof ensureNamespace>[0],
  config: TraceConfig,
  logger?: TraceLogger,
): Promise<ProvisionedTarget | null> {
  if (config.target) return config.target;
  try {
    return await ensureNamespace(client, { network: config.network, label: LABEL, logger });
  } catch (err) {
    logger?.warn?.(
      `[oc-onemem] auto-provision failed (fund ${client.signer.toSuiAddress()} on ${config.network}): ${err instanceof Error ? err.message : String(err)}`,
    );
    return null;
  }
}
