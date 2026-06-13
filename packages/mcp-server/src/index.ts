#!/usr/bin/env node
// @onemem/mcp — a stdio MCP server exposing OneMem's verifiable MEMORY surface
// to any MCP runtime (Cursor, Codex, Claude Code, Windsurf, Cline, …).
//
// Memory-centric (Mem0-style): agents "remember" + "recall", and can verify the
// on-chain trace. Tools are thin wrappers over @onemem/sdk-ts. Config via env:
//   SUI_NETWORK              testnet | mainnet | devnet | local (default active)
//   ONEMEM_PRIVATE_KEY       suiprivkey1... (else falls back to sui keystore)
//   ONEMEM_ACCOUNT_ID        MemWal account (enables memory tools)
//   ONEMEM_DELEGATE_KEY      MemWal delegate key (hex)
//   ONEMEM_EMBEDDING_API_KEY OpenAI/OpenRouter key for /manual embeddings
//   MEMWAL_PACKAGE_ID, MEMWAL_RELAYER_URL
//
// Tools backed by MemWal 0.0.5 today: add_memory, search_memory (+ verify_trace,
// trace_session, share_namespace). get/update/delete_memory + replay_session are
// v0.2 (MemWal has no get/update/delete primitive) — intentionally not exposed.
//
// Spec: docs/05-our-architecture/03-runtimes/mcp-server.md

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { type MemoryConfig, OneMem, type SuiNetwork } from "@onemem/sdk-ts";
import { z } from "zod";

import { resolveSigner } from "./signer.js";

export const VERSION = "0.1.0";

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

function hex(bytes: Uint8Array): string {
  return `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

export function buildServer(onemem: OneMem): McpServer {
  const server = new McpServer({ name: "onemem", version: VERSION });
  const me = onemem.senderAddress();

  server.registerTool(
    "onemem_add_memory",
    {
      title: "Remember something (write a memory)",
      description:
        "Store a memory: client-side encrypted (Seal) and saved to Walrus via MemWal — the relayer never sees plaintext. Returns the Walrus blob id + attestation.",
      inputSchema: {
        text: z.string().describe("The memory text to remember"),
        namespace: z
          .string()
          .optional()
          .describe("Memory namespace for isolation (default 'default')"),
      },
    },
    async ({ text, namespace }) => {
      try {
        const r = await onemem.requireMemory().add(text, { namespace });
        return ok({
          memoryId: r.memoryId,
          walrusBlobId: r.walrusBlobId,
          attestation: r.attestation,
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
      },
    },
    async ({ query, namespace, topK }) => {
      try {
        const r = await onemem.requireMemory().search(query, { namespace, topK });
        return ok({ results: r.results });
      } catch (error) {
        return fail(errMessage(error));
      }
    },
  );

  server.registerTool(
    "onemem_verify_trace",
    {
      title: "Verify a trace session on-chain",
      description:
        "Off-chain Merkle verification of a TraceSession: confirms no recorded call was inserted, dropped, reordered, or tampered. Read-only.",
      inputSchema: { sessionId: z.string().describe("0x… TraceSession object id") },
    },
    async ({ sessionId }) => {
      try {
        const r = await onemem.traces.verifySession(sessionId);
        return ok({
          ok: r.ok,
          callCount: r.callCount,
          brokenAt: r.brokenAt,
          merkleRoot: hex(r.expectedMerkleRoot),
          computedRoot: hex(r.computedMerkleRoot),
        });
      } catch (error) {
        return fail(errMessage(error));
      }
    },
  );

  server.registerTool(
    "onemem_trace_session",
    {
      title: "List the calls in a trace session",
      description:
        "Return the ActionCalls recorded in a session (ascending), so an agent or user can inspect what happened.",
      inputSchema: { sessionId: z.string() },
    },
    async ({ sessionId }) => {
      try {
        const calls = await onemem.traces.getCalls(sessionId);
        return ok({
          sessionId,
          callCount: calls.length,
          calls: calls.map((c) => ({
            callId: c.callId,
            parentCallId: c.parentCallId,
            contentHash: hex(c.contentHash),
            timestampMs: Number(c.timestampMs),
          })),
        });
      } catch (error) {
        return fail(errMessage(error));
      }
    },
  );

  server.registerTool(
    "onemem_share_namespace",
    {
      title: "Share a namespace (mint + transfer a capability)",
      description:
        "Mint a ReadWrite (or ReadOnly) NamespaceCapability and transfer it to an address — on-chain memory sharing. Requires the namespace's Admin cap.",
      inputSchema: {
        namespaceId: z.string(),
        adminCapId: z.string(),
        recipient: z.string().optional().describe("0x… address (default: this server)"),
        readOnly: z.boolean().optional().describe("Share ReadOnly instead of ReadWrite"),
      },
    },
    async ({ namespaceId, adminCapId, recipient, readOnly }) => {
      try {
        const args = { namespaceId, adminCapId, recipient: recipient ?? me };
        const r = readOnly
          ? await onemem.namespaces.shareReadOnly(args)
          : await onemem.namespaces.shareReadWrite(args);
        return ok({ capabilityId: r.capId, kind: readOnly ? "ReadOnly" : "ReadWrite" });
      } catch (error) {
        return fail(errMessage(error));
      }
    },
  );

  return server;
}

function memoryConfigFromEnv(): MemoryConfig | undefined {
  const e = process.env;
  if (!e.ONEMEM_ACCOUNT_ID || !e.ONEMEM_DELEGATE_KEY || !e.ONEMEM_EMBEDDING_API_KEY) {
    return undefined;
  }
  return {
    delegateKey: e.ONEMEM_DELEGATE_KEY,
    accountId: e.ONEMEM_ACCOUNT_ID,
    embeddingApiKey: e.ONEMEM_EMBEDDING_API_KEY,
    memwalPackageId: e.MEMWAL_PACKAGE_ID ?? "",
    relayerUrl: e.MEMWAL_RELAYER_URL ?? "https://relayer.memory.walrus.xyz",
  };
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
