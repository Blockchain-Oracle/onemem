import { OneMem } from "@onemem/sdk-ts";
import { resolveNetwork, resolveSigner } from "@onemem/sdk-ts/runtime";
import { memoryConfigFromEnv } from "../util/memory-config.js";
import { type GlobalOpts, printJson, printLine, printTable, runCommand } from "../util/output.js";
import { parseMetadata, parseNetwork, parseTopK } from "../util/validate.js";

type Cmd = { optsWithGlobals(): GlobalOpts };

async function memoryClient(networkOpt?: string): Promise<OneMem> {
  const network = resolveNetwork(parseNetwork(networkOpt));
  const signer = resolveSigner();
  return OneMem.create({ network, signer, memory: memoryConfigFromEnv() });
}

/** Shared scope flags on add/search/list. */
interface ScopeOpts {
  namespace?: string;
  userId?: string;
  agentId?: string;
  runId?: string;
  metadata?: string;
}

function scopeArgs(opts: ScopeOpts) {
  return {
    namespace: opts.namespace,
    userId: opts.userId,
    agentId: opts.agentId,
    runId: opts.runId,
    metadata: parseMetadata(opts.metadata),
  };
}

/** `onemem add <text>` — store a memory on MemWal (Seal-encrypted blob on Walrus). */
export function addCommand(text: string, opts: ScopeOpts, command: Cmd) {
  const g = command.optsWithGlobals();
  return runCommand(g, async () => {
    const client = await memoryClient(g.network);
    const result = await client.requireMemory().add(text, scopeArgs(opts));
    if (g.json) {
      printJson(result);
      return;
    }
    printLine("✓ memory stored");
    printLine(`  memoryId    ${result.memoryId}`);
    printLine(`  walrusBlob  ${result.walrusBlobId}`);
  });
}

interface SearchOpts extends ScopeOpts {
  topK?: string;
}

/** `onemem search <query>` — vector-recall memories (MemWal), index-post-filtered. */
export function searchCommand(query: string, opts: SearchOpts, command: Cmd) {
  const g = command.optsWithGlobals();
  return runCommand(g, async () => {
    const topK = parseTopK(opts.topK);
    const client = await memoryClient(g.network);
    const { results } = await client.requireMemory().search(query, {
      ...scopeArgs(opts),
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

interface ListOpts extends ScopeOpts {
  limit?: string;
}

/** `onemem list` — list stored memories from the local index (scope-filtered). */
export function listCommand(opts: ListOpts, command: Cmd) {
  const g = command.optsWithGlobals();
  return runCommand(g, async () => {
    const limit = parseTopK(opts.limit);
    const client = await memoryClient(g.network);
    const memories = await client.requireMemory().getAll({ ...scopeArgs(opts), limit });
    if (g.json) {
      printJson({ memories });
      return;
    }
    printTable(
      memories.map((m) => ({
        id: m.id.length > 14 ? `${m.id.slice(0, 14)}…` : m.id,
        user: m.userId ?? "",
        text: m.text.length > 48 ? `${m.text.slice(0, 48)}…` : m.text,
        namespace: m.namespace,
      })),
      ["id", "user", "text", "namespace"],
    );
  });
}

/** `onemem get <id>` — fetch one stored memory by id from the local index. */
export function getCommand(id: string, _opts: unknown, command: Cmd) {
  const g = command.optsWithGlobals();
  return runCommand(g, async () => {
    const client = await memoryClient(g.network);
    const memory = await client.requireMemory().get(id);
    if (g.json) {
      printJson({ memory });
      return;
    }
    if (!memory) {
      printLine(`(no memory with id ${id})`);
      return;
    }
    printLine(`id          ${memory.id}`);
    printLine(`text        ${memory.text}`);
    printLine(`namespace   ${memory.namespace}`);
    if (memory.userId) printLine(`userId      ${memory.userId}`);
    if (memory.agentId) printLine(`agentId     ${memory.agentId}`);
    if (memory.runId) printLine(`runId       ${memory.runId}`);
    if (memory.metadata) printLine(`metadata    ${JSON.stringify(memory.metadata)}`);
    printLine(`walrusBlob  ${memory.walrusBlobId}`);
  });
}

/** `onemem delete <id>` — soft-delete a memory in the local index. */
export function deleteCommand(id: string, _opts: unknown, command: Cmd) {
  const g = command.optsWithGlobals();
  return runCommand(g, async () => {
    const client = await memoryClient(g.network);
    const deleted = await client.requireMemory().delete(id);
    if (g.json) {
      printJson({ id, deleted });
      return;
    }
    printLine(
      deleted
        ? `✓ memory ${id} removed from local index (encrypted blob persists on Walrus until its epoch expires)`
        : `(no active memory with id ${id})`,
    );
  });
}
