import { OneMem } from "@onemem/sdk-ts";
import { ensureNamespace, resolveNetwork, resolveSigner } from "@onemem/sdk-ts/runtime";
import { type GlobalOpts, printJson, printLine, runCommand } from "../util/output.js";
import { parseNetwork } from "../util/validate.js";

interface InitOpts {
  label?: string;
}

/**
 * `onemem init` — zero-config provisioning. Resolves a signer (env key → sui
 * keystore → generated+persisted wallet), then provisions (or reuses) a
 * namespace + ReadWrite cap, persisted under ~/.onemem. This is all a user needs
 * before recording traces; no browser, no dashboard, no manual config.
 */
export function initCommand(opts: InitOpts, command: { optsWithGlobals(): GlobalOpts }) {
  const g = command.optsWithGlobals();
  return runCommand(g, async () => {
    const network = resolveNetwork(parseNetwork(g.network));
    const label = opts.label ?? "onemem";
    const logger = g.json ? {} : undefined; // default logger prints progress to stderr
    const signer = resolveSigner(undefined, logger);
    const address = signer.toSuiAddress();
    const client = await OneMem.create({ network, signer });
    const target = await ensureNamespace(client, { network, label, logger });

    if (g.json) {
      printJson({ ok: true, address, network, label, ...target });
      return;
    }
    printLine("✓ OneMem ready");
    printLine(`  address     ${address}`);
    printLine(`  network     ${network}`);
    printLine(`  namespace   ${target.namespaceId}`);
    if (target.adminCapId) printLine(`  adminCap    ${target.adminCapId}`);
    printLine(`  rwCap       ${target.rwCapId}`);
    printLine("");
    printLine("Set these so any runtime records to this namespace:");
    printLine(`  export ONEMEM_NAMESPACE_ID=${target.namespaceId}`);
    printLine(`  export ONEMEM_RW_CAP_ID=${target.rwCapId}`);
    if (target.adminCapId) printLine(`  export ONEMEM_ADMIN_CAP_ID=${target.adminCapId}`);
  });
}
