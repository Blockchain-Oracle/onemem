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
// Tools: add_memory, search_memory, verify_trace, trace_session, replay_session,
// share_namespace, revoke_namespace_capability (7). get/update/delete_memory are NOT exposed because MemWal
// 0.0.5 has no get/update/delete primitive (verified) — they need a future
// tombstone/versioning layer, not fakeable today.
//
// Spec: docs/05-our-architecture/03-runtimes/mcp-server.md

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

function hex(bytes: Uint8Array): string {
  return `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

export function buildServer(onemem: OneMem, attest?: AttestConfig): McpServer {
  const server = new McpServer({ name: "onemem", version: VERSION });
  const me = onemem.senderAddress();

  // Ambient attesting session for MCP memory writes. When ONEMEM_NAMESPACE_ID +
  // ONEMEM_RW_CAP_ID are configured, the first attested write opens ONE
  // TraceSession (environment="mcp") and every memory write appends a verifiable
  // `memwal_write` ActionCall to it — so MCP memory writes are anchored on-chain,
  // not just stored on Walrus (the BUG-3 fix). Without config, writes are
  // stored-but-unattested and the response says so.
  let ambientSessionId: string | null = null;
  let ambientSessionPromise: Promise<string> | null = null;
  async function ensureAttestingSession(cfg: AttestConfig): Promise<string> {
    if (ambientSessionId) return ambientSessionId;
    if (!ambientSessionPromise) {
      ambientSessionPromise = onemem.traces
        .startSession({
          namespaceId: cfg.namespaceId,
          rwCapId: cfg.rwCapId,
          agentId: "mcp",
          environment: "mcp",
          sdkVersion: VERSION,
        })
        .then((s) => {
          ambientSessionId = s.sessionId;
          return s.sessionId;
        })
        .catch((error) => {
          ambientSessionPromise = null; // allow a later call to retry
          throw error;
        });
    }
    return ambientSessionPromise;
  }

  server.registerTool(
    "onemem_add_memory",
    {
      title: "Remember something (write a memory)",
      description:
        "Store a memory: client-side encrypted (Seal) and saved to Walrus via MemWal — the relayer never sees plaintext. When ONEMEM_NAMESPACE_ID + ONEMEM_RW_CAP_ID are configured, also emits a verifiable on-chain ActionCall (returns callId + suiTxDigest); otherwise the write is stored-but-unattested and says so.",
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
        const addOpts: {
          namespace?: string;
          sessionId?: string;
          onememNamespaceId?: string;
          rwCapId?: string;
        } = { namespace };
        if (attest) {
          addOpts.sessionId = await ensureAttestingSession(attest);
          addOpts.onememNamespaceId = attest.namespaceId;
          addOpts.rwCapId = attest.rwCapId;
        }
        const r = await onemem.requireMemory().add(text, addOpts);
        const attested = Boolean(r.callId);
        return ok({
          memoryId: r.memoryId,
          walrusBlobId: r.walrusBlobId,
          attested,
          callId: r.callId ?? null,
          suiTxDigest: r.suiTxDigest ?? null,
          sessionId: attested ? ambientSessionId : null,
          attestation: r.attestation,
          ...(attested
            ? {}
            : {
                note: "Stored encrypted on Walrus but NOT anchored on-chain. Set ONEMEM_NAMESPACE_ID + ONEMEM_RW_CAP_ID so this MCP server emits a verifiable on-chain ActionCall per memory.",
              }),
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
    "onemem_replay_session",
    {
      title: "Replay a trace session from chain",
      description:
        "Reconstruct a TraceSession from on-chain data: session metadata + ActionCalls in execution order. Per-call plaintext stays Seal-encrypted (decrypt is client-side). Read-only.",
      inputSchema: { sessionId: z.string().describe("0x… TraceSession object id") },
    },
    async ({ sessionId }) => {
      try {
        const { session, calls } = await onemem.traces.replaySession(sessionId);
        return ok({
          sessionId,
          status: session.status,
          callCount: calls.length,
          calls: calls.map((c, i) => ({
            sequence: i,
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

  server.registerTool(
    "onemem_revoke_namespace_capability",
    {
      title: "Admin-revoke a namespace capability",
      description:
        "Mark a NamespaceCapability ID revoked under its namespace. The cap object remains owned by the holder, but future OneMem write/decrypt gates reject it. Requires the namespace's Admin cap.",
      inputSchema: {
        namespaceId: z.string(),
        adminCapId: z.string(),
        capabilityId: z.string(),
        allowAdmin: z.boolean().optional().describe("Allow revoking an Admin capability"),
      },
    },
    async ({ namespaceId, adminCapId, capabilityId, allowAdmin }) => {
      try {
        const kind = await onemem.namespaces.getCapabilityKind(capabilityId);
        if (kind === "Admin" && allowAdmin !== true) {
          return fail("refusing to admin-revoke Admin capability without allowAdmin=true");
        }
        const r = await onemem.namespaces.adminRevokeCapability({
          namespaceId,
          adminCapId,
          capId: capabilityId,
        });
        return ok({
          namespaceId,
          capabilityId,
          kind,
          txDigest: r.txDigest,
          scope: "admin marker-revoke; object not deleted",
        });
      } catch (error) {
        return fail(errMessage(error));
      }
    },
  );

  server.registerTool(
    "onemem_session_status",
    {
      title: "MCP attestation status",
      description:
        "Report whether this MCP server anchors memory writes on-chain, and the ambient TraceSession id (if one is open).",
      inputSchema: {},
    },
    async () => {
      return ok({
        attestationConfigured: Boolean(attest),
        namespaceId: attest?.namespaceId ?? null,
        ambientSessionId,
        address: me,
        network: onemem.network,
      });
    },
  );

  return server;
}

interface AttestConfig {
  readonly namespaceId: string;
  readonly rwCapId: string;
}

function attestConfigFromEnv(): AttestConfig | undefined {
  const namespaceId = process.env.ONEMEM_NAMESPACE_ID;
  const rwCapId = process.env.ONEMEM_RW_CAP_ID;
  return namespaceId && rwCapId ? { namespaceId, rwCapId } : undefined;
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
  const server = buildServer(onemem, attestConfigFromEnv());
  await server.connect(new StdioServerTransport());
  const memoryStatus = onemem.memory ? "memory ON" : "memory OFF (set MemWal env)";
  const attestStatus = attestConfigFromEnv()
    ? "attest ON"
    : "attest OFF (set ONEMEM_NAMESPACE_ID+ONEMEM_RW_CAP_ID)";
  process.stderr.write(
    `onemem-mcp ${VERSION} ready on ${onemem.network} (${onemem.senderAddress()}) — ${memoryStatus}, ${attestStatus}\n`,
  );
}

main().catch((error: unknown) => {
  process.stderr.write(
    `onemem-mcp fatal: ${error instanceof Error ? error.stack : String(error)}\n`,
  );
  process.exit(1);
});
