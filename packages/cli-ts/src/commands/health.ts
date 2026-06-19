import { OneMem } from "@onemem/sdk-ts";
import { resolveNetwork, resolveSigner } from "@onemem/sdk-ts/runtime";
import { type GlobalOpts, printJson, printLine, runCommand } from "../util/output.js";
import { parseNetwork } from "../util/validate.js";

/**
 * `onemem health` — confirm the Sui RPC endpoint for the selected network is
 * reachable. (A fuller MemWal/relayer readiness check is a later phase.)
 */
export function healthCommand(_opts: unknown, command: { optsWithGlobals(): GlobalOpts }) {
  const g = command.optsWithGlobals();
  return runCommand(g, async () => {
    const network = resolveNetwork(parseNetwork(g.network));
    const onemem = await OneMem.create({ network, signer: resolveSigner() });

    let chainId: string | null = null;
    let rpcOk = false;
    let rpcError: string | null = null;
    try {
      chainId = await onemem.client.getChainIdentifier();
      rpcOk = true;
    } catch (err) {
      rpcError = err instanceof Error ? err.message : String(err);
    }

    if (!rpcOk) process.exitCode = 1;

    if (g.json) {
      printJson({ ok: rpcOk, network, chainId, rpc: rpcOk, rpcError });
      return;
    }
    printLine(rpcOk ? "✓ healthy" : "✗ unhealthy");
    printLine(`  network  ${network}`);
    printLine(`  rpc      ${rpcOk ? `ok (chain ${chainId})` : `unreachable (${rpcError})`}`);
  });
}
