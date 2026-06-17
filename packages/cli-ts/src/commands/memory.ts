import { OneMem } from "@onemem/sdk-ts";
import { resolveNetwork, resolveSigner } from "@onemem/sdk-ts/runtime";
import { memoryConfigFromEnv } from "../util/memory-config.js";
import { type GlobalOpts, printJson, printLine, printTable, runCommand } from "../util/output.js";
import { parseNetwork, parseTopK } from "../util/validate.js";

type Cmd = { optsWithGlobals(): GlobalOpts };

async function memoryClient(networkOpt?: string): Promise<OneMem> {
  const network = resolveNetwork(parseNetwork(networkOpt));
  const signer = resolveSigner();
  return OneMem.create({ network, signer, memory: memoryConfigFromEnv() });
}

interface AddOpts {
  namespace?: string;
}

/** `onemem add <text>` — store a memory (MemWal) + emit a verifiable ActionCall. */
export function addCommand(text: string, opts: AddOpts, command: Cmd) {
  const g = command.optsWithGlobals();
  return runCommand(g, async () => {
    const client = await memoryClient(g.network);
    const result = await client.requireMemory().add(text, { namespace: opts.namespace });
    if (g.json) {
      printJson(result);
      return;
    }
    printLine("✓ memory stored");
    printLine(`  memoryId    ${result.memoryId}`);
    printLine(`  walrusBlob  ${result.walrusBlobId}`);
    if (result.suiTxDigest) printLine(`  suiTx       ${result.suiTxDigest}`);
  });
}

interface SearchOpts {
  topK?: string;
  namespace?: string;
}

/** `onemem search <query>` — vector-recall memories (MemWal). */
export function searchCommand(query: string, opts: SearchOpts, command: Cmd) {
  const g = command.optsWithGlobals();
  return runCommand(g, async () => {
    const topK = parseTopK(opts.topK);
    const client = await memoryClient(g.network);
    const { results } = await client.requireMemory().search(query, {
      namespace: opts.namespace,
      topK,
    });
    if (g.json) {
      printJson({ results });
      return;
    }
    printTable(
      results.map((m) => ({
        relevance: m.relevance.toFixed(3),
        text: m.text.length > 60 ? `${m.text.slice(0, 60)}…` : m.text,
        blob: `${m.walrusBlobId.slice(0, 12)}…`,
      })),
      ["relevance", "text", "blob"],
    );
  });
}
