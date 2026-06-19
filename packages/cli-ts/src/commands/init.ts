import { resolveNetwork, resolveSigner } from "@onemem/sdk-ts/runtime";
import { type GlobalOpts, printJson, printLine, runCommand } from "../util/output.js";
import { parseNetwork } from "../util/validate.js";

interface InitOpts {
  label?: string;
}

/**
 * `onemem init` — zero-config setup. Resolves a signer (env key → sui keystore →
 * generated+persisted wallet under ~/.onemem) and reports the address + network.
 *
 * NOTE: full MemWal account/delegate provisioning is a later phase; for now this
 * just ensures a local signer exists. Run `onemem login` to wire MemWal
 * credentials, or set ONEMEM_ACCOUNT_ID / ONEMEM_DELEGATE_KEY /
 * ONEMEM_EMBEDDING_API_KEY directly.
 */
export function initCommand(opts: InitOpts, command: { optsWithGlobals(): GlobalOpts }) {
  const g = command.optsWithGlobals();
  return runCommand(g, async () => {
    const network = resolveNetwork(parseNetwork(g.network));
    const label = opts.label ?? "onemem";
    const logger = g.json ? {} : undefined; // default logger prints progress to stderr
    const signer = resolveSigner(undefined, logger);
    const address = signer.toSuiAddress();

    if (g.json) {
      printJson({ ok: true, address, network, label });
      return;
    }
    printLine("✓ OneMem signer ready");
    printLine(`  address  ${address}`);
    printLine(`  network  ${network}`);
    printLine("");
    printLine("Next: run `onemem login` to connect a MemWal account + delegate key,");
    printLine("or set ONEMEM_ACCOUNT_ID / ONEMEM_DELEGATE_KEY / ONEMEM_EMBEDDING_API_KEY.");
  });
}
