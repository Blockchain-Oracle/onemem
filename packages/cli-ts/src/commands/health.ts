import { type GlobalOpts, printJson, printLine, runCommand } from "../util/output.js";
import { readContext } from "../util/sui.js";

/**
 * `onemem health` — confirm the network endpoint is reachable and the OneMem
 * package is deployed there. Pure read; no signer.
 */
export function healthCommand(_opts: unknown, command: { optsWithGlobals(): GlobalOpts }) {
  const g = command.optsWithGlobals();
  return runCommand(g, async () => {
    const { client, packageId, network } = readContext(g.network);

    let chainId: string | null = null;
    let rpcOk = false;
    let rpcError: string | null = null;
    try {
      chainId = await client.getChainIdentifier();
      rpcOk = true;
    } catch (err) {
      rpcError = err instanceof Error ? err.message : String(err);
    }

    // Distinguish three states: deployed, genuinely-not-found, and "couldn't
    // tell" (RPC error). Collapsing an RPC blip into "not deployed" would
    // mislead the user into thinking they're on the wrong network.
    let packageDeployed = false;
    let packageError: string | null = null;
    if (rpcOk) {
      try {
        const pkg = await client.getObject({ id: packageId });
        if (pkg.data?.objectId === packageId) {
          packageDeployed = true;
        } else if (pkg.error) {
          packageError = JSON.stringify(pkg.error);
        } else {
          packageError = "not found";
        }
      } catch (err) {
        packageError = err instanceof Error ? err.message : String(err);
      }
    }

    const ok = rpcOk && packageDeployed;
    if (!ok) process.exitCode = 1;

    if (g.json) {
      printJson({
        ok,
        network,
        chainId,
        rpc: rpcOk,
        rpcError,
        package: packageId,
        packageDeployed,
        packageError,
      });
      return;
    }
    printLine(ok ? "✓ healthy" : "✗ unhealthy");
    printLine(`  network  ${network}`);
    printLine(`  rpc      ${rpcOk ? `ok (chain ${chainId})` : `unreachable (${rpcError})`}`);
    if (rpcOk) {
      printLine(
        `  package  ${packageDeployed ? `deployed (${packageId})` : `unverified (${packageError})`}`,
      );
    }
  });
}
