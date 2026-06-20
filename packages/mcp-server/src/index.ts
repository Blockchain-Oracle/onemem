#!/usr/bin/env node
// @onemem/mcp — a stdio MCP server exposing OneMem's MEMORY surface to any MCP
// runtime (Cursor, Codex, Claude Code, Windsurf, Cline, …).
//
// Memory-centric (Mem0-style): agents "remember" + "recall". Memory is stored on
// MemWal (Seal-encrypted blob on Walrus). Tools are thin wrappers over
// @onemem/sdk-ts. Config via env:
//   SUI_NETWORK              testnet | mainnet | devnet | local (default testnet)
//   ONEMEM_PRIVATE_KEY       suiprivkey1... (else falls back to sui keystore)
//   ONEMEM_ACCOUNT_ID        MemWal account (enables memory tools)
//   ONEMEM_DELEGATE_KEY      MemWal delegate key (hex)
//   ONEMEM_EMBEDDING_API_KEY OpenAI/OpenRouter key for /manual embeddings
//   MEMWAL_PACKAGE_ID, MEMWAL_RELAYER_URL
//
// Tools: add_memory, search_memory, get_memory, list_memories, delete_memory.
// MemWal 0.0.7 is append-only (no get/get_all/delete primitive), so get/list are
// served from a LOCAL SQLite index that mirrors every write, and delete is a
// soft-delete in that index (the encrypted Walrus blob persists until its epoch
// expires — a true hard delete is not possible on append-only MemWal).

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { type MemoryConfig, OneMem, type SuiNetwork } from "@onemem/sdk-ts";
import { memoryConfigFromCredentials } from "@onemem/sdk-ts/runtime";
import { z } from "zod";

import { resolveSigner } from "./signer.js";
import { VERSION } from "./version.js";

type ToolResult = {
  content: { type: "text"; text: string }[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
};

function ok(payload: Record<string, unknown>): ToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
    structuredContent: payload,
  };
}

function fail(message: string): ToolResult {
  return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
}

function errMessage(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  let message = error.message;
  let cause: unknown = error.cause;
  while (cause instanceof Error) {
    message += `: ${cause.message}`;
    cause = cause.cause;
  }
  return message;
}

export function buildServer(onemem: OneMem): McpServer {
  const server = new McpServer({ name: "onemem", version: VERSION });

  server.registerTool(
    "onemem_add_memory",
    {
      title: "Remember something (write a memory)",
      description:
        "Store a memory: client-side encrypted (Seal) and saved to Walrus via MemWal — the relayer never sees plaintext.",
      inputSchema: {
        text: z.string().describe("The memory text to remember"),
        namespace: z
          .string()
          .optional()
          .describe("Memory namespace for isolation (default 'default')"),
        userId: z
          .string()
          .optional()
          .describe("Scope to a user (derives namespace user:<id> when no namespace)"),
        agentId: z.string().optional().describe("Scope to an agent"),
        runId: z.string().optional().describe("Scope to a run/session"),
        metadata: z
          .record(z.string(), z.unknown())
          .optional()
          .describe("Arbitrary JSON metadata stored with the memory"),
      },
    },
    async ({ text, namespace, userId, agentId, runId, metadata }) => {
      try {
        const r = await onemem
          .requireMemory()
          .add(text, { namespace, userId, agentId, runId, metadata });
        return ok({
          memoryId: r.memoryId,
          walrusBlobId: r.walrusBlobId,
          inputHashHex: r.inputHashHex,
        });
      } catch (error) {
        return fail(errMessage(error));
      }
    },
  );

  server.registerTool(
    "onemem_search_memory",
    {
      title: "Recall memories (vector search)",
      description:
        "Semantic search over stored memories. Embeds the query, searches MemWal, downloads + Seal-decrypts hits client-side. Returns ranked memories (relevance 0–1).",
      inputSchema: {
        query: z.string().describe("What to recall"),
        namespace: z.string().optional(),
        topK: z.number().int().positive().optional().describe("Max results (default 10)"),
        userId: z.string().optional().describe("Scope to a user (derives namespace user:<id>)"),
        agentId: z.string().optional().describe("Filter to an agent"),
        runId: z.string().optional().describe("Filter to a run/session"),
        metadata: z
          .record(z.string(), z.unknown())
          .optional()
          .describe("Metadata filter (returned memory must contain these key/values)"),
      },
    },
    async ({ query, namespace, topK, userId, agentId, runId, metadata }) => {
      try {
        const r = await onemem
          .requireMemory()
          .search(query, { namespace, topK, userId, agentId, runId, metadata });
        return ok({ results: r.results });
      } catch (error) {
        return fail(errMessage(error));
      }
    },
  );

  server.registerTool(
    "onemem_get_memory",
    {
      title: "Get a memory by id",
      description:
        "Fetch one stored memory by id from the local index (excludes soft-deleted). Returns its text + scope + metadata.",
      inputSchema: {
        id: z.string().describe("The memory id (from add)"),
      },
    },
    async ({ id }) => {
      try {
        const memory = await onemem.requireMemory().get(id);
        return ok({ memory });
      } catch (error) {
        return fail(errMessage(error));
      }
    },
  );

  server.registerTool(
    "onemem_list_memories",
    {
      title: "List memories (scope-filtered)",
      description:
        "List stored memories from the local index, newest-first, filtered by user/agent/run/namespace/metadata. Excludes soft-deleted.",
      inputSchema: {
        userId: z.string().optional().describe("Filter by user id"),
        agentId: z.string().optional().describe("Filter by agent id"),
        runId: z.string().optional().describe("Filter by run/session id"),
        namespace: z.string().optional().describe("Filter by namespace"),
        metadata: z
          .record(z.string(), z.unknown())
          .optional()
          .describe("Metadata filter (memory must contain these key/values)"),
        limit: z.number().int().positive().optional().describe("Max rows"),
      },
    },
    async ({ userId, agentId, runId, namespace, metadata, limit }) => {
      try {
        const memories = await onemem
          .requireMemory()
          .getAll({ userId, agentId, runId, namespace, metadata, limit });
        return ok({ memories });
      } catch (error) {
        return fail(errMessage(error));
      }
    },
  );

  server.registerTool(
    "onemem_delete_memory",
    {
      title: "Delete a memory (soft delete)",
      description:
        "Soft-delete a memory by id: it stops appearing in get/list/search. The encrypted blob persists on Walrus until its storage epoch expires — a true hard delete is not possible on append-only MemWal.",
      inputSchema: {
        id: z.string().describe("The memory id to delete"),
      },
    },
    async ({ id }) => {
      try {
        const deleted = await onemem.requireMemory().delete(id);
        return ok({ id, deleted });
      } catch (error) {
        return fail(errMessage(error));
      }
    },
  );

  return server;
}

function memoryConfigFromEnv(): MemoryConfig | undefined {
  return memoryConfigFromCredentials();
}

async function main(): Promise<void> {
  const network = process.env.SUI_NETWORK as SuiNetwork | undefined;
  const onemem = await OneMem.create({
    network,
    signer: resolveSigner(),
    memory: memoryConfigFromEnv(),
  });
  const server = buildServer(onemem);
  await server.connect(new StdioServerTransport());
  const memoryStatus = onemem.memory ? "memory ON" : "memory OFF (set MemWal env)";
  process.stderr.write(
    `onemem-mcp ${VERSION} ready on ${onemem.network} (${onemem.senderAddress()}) — ${memoryStatus}\n`,
  );
}

main().catch((error: unknown) => {
  process.stderr.write(
    `onemem-mcp fatal: ${error instanceof Error ? error.stack : String(error)}\n`,
  );
  process.exit(1);
});
