#!/usr/bin/env node
// @onemem/mcp — a stdio MCP server exposing OneMem's verifiable memory + trace
// surface to any MCP runtime (Cursor, Codex, Claude Code, Windsurf, Cline, …).
//
// Tools are thin wrappers over @onemem/sdk-ts. Config via env:
//   SUI_NETWORK         testnet | mainnet | devnet | local (default: active)
//   ONEMEM_PRIVATE_KEY  suiprivkey1... (else falls back to the sui keystore)
//
// Spec: docs/05-our-architecture/03-runtimes/mcp-server.md

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallStatus, NamespaceKind, OneMem, SessionStatus, type SuiNetwork } from "@onemem/sdk-ts";
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
  // Preserve the cause chain — the actionable detail is often nested.
  let message = error.message;
  let cause: unknown = error.cause;
  while (cause instanceof Error) {
    message += `: ${cause.message}`;
    cause = cause.cause;
  }
  return message;
}

function hex(bytes: Uint8Array): string {
  return `0x${Buffer.from(bytes).toString("hex")}`;
}

export function buildServer(onemem: OneMem): McpServer {
  const server = new McpServer({ name: "onemem", version: VERSION });
  const me = onemem.senderAddress();

  server.registerTool(
    "onemem_verify_session",
    {
      title: "Verify a OneMem trace session",
      description:
        "Off-chain Merkle verification of a trace session: confirms no call was inserted, dropped, reordered, or tampered. Read-only.",
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
    "onemem_create_namespace",
    {
      title: "Create a memory namespace",
      description:
        "Mint a shared MemoryNamespace + Admin capability. The Seal policy package defaults to the deployed OneMem package so blobs are decryptable by cap holders.",
      inputSchema: {
        name: z.string().describe("Unique-per-owner namespace name"),
        kind: z.number().int().optional().describe("NamespaceKind u8 (default User)"),
      },
    },
    async ({ name, kind }) => {
      try {
        const created = await onemem.namespaces.create({
          name,
          kind: (kind ?? NamespaceKind.User) as NamespaceKind,
          sealPackageId: onemem.addresses.packageId,
        });
        return ok({ namespaceId: created.namespaceId, adminCapId: created.adminCapId });
      } catch (error) {
        return fail(errMessage(error));
      }
    },
  );

  server.registerTool(
    "onemem_share_readwrite",
    {
      title: "Mint a ReadWrite capability",
      description:
        "Mint a ReadWrite NamespaceCapability and send it to an address (default: this server's key).",
      inputSchema: {
        namespaceId: z.string(),
        adminCapId: z.string(),
        recipient: z.string().optional().describe("0x… address (default: this server)"),
      },
    },
    async ({ namespaceId, adminCapId, recipient }) => {
      try {
        const r = await onemem.namespaces.shareReadWrite({
          namespaceId,
          adminCapId,
          recipient: recipient ?? me,
        });
        return ok({ capId: r.capId });
      } catch (error) {
        return fail(errMessage(error));
      }
    },
  );

  server.registerTool(
    "onemem_open_session",
    {
      title: "Open a trace session",
      description: "Start a TraceSession for recording an agent run.",
      inputSchema: {
        namespaceId: z.string(),
        rwCapId: z.string(),
        agentId: z.string(),
        environment: z.string().optional(),
      },
    },
    async ({ namespaceId, rwCapId, agentId, environment }) => {
      try {
        const r = await onemem.traces.openSession({
          namespaceId,
          rwCapId,
          agentId,
          environment: environment ?? "mcp",
          sdkVersion: VERSION,
        });
        return ok({ sessionId: r.sessionId });
      } catch (error) {
        return fail(errMessage(error));
      }
    },
  );

  server.registerTool(
    "onemem_record_call",
    {
      title: "Record a tool call into a session",
      description:
        "Emit + close one ActionCall. The input/output text is Seal-encrypted and stored on Walrus by default; the on-chain hash is over the plaintext so it stays verifiable.",
      inputSchema: {
        sessionId: z.string(),
        namespaceId: z.string(),
        rwCapId: z.string(),
        toolName: z.string(),
        toolNamespace: z.string().optional(),
        input: z.string().describe("Tool input payload (stored encrypted on Walrus)"),
        output: z.string().optional().describe("Tool output payload (stored encrypted on Walrus)"),
        success: z
          .boolean()
          .optional()
          .describe(
            "Did the tool call succeed? Recorded on-chain (default true). NEVER report a failed call as succeeded.",
          ),
        encrypt: z.boolean().optional().describe("Seal-encrypt before upload (default true)"),
      },
    },
    async ({
      sessionId,
      namespaceId,
      rwCapId,
      toolName,
      toolNamespace,
      input,
      output,
      success,
      encrypt,
    }) => {
      const enc = encrypt ?? true;
      const status = success === false ? CallStatus.Failure : CallStatus.Success;
      let callId: string;
      try {
        const emit = await onemem.traces.emitCall({
          sessionId,
          namespaceId,
          rwCapId,
          toolName,
          toolNamespace: toolNamespace ?? "mcp",
          inputContent: new TextEncoder().encode(input),
          encrypt: enc,
        });
        callId = emit.callId;
      } catch (error) {
        return fail(`emit_call failed: ${errMessage(error)}`);
      }
      try {
        await onemem.traces.closeCall({
          sessionId,
          rwCapId,
          callId,
          namespaceId,
          outputContent: new TextEncoder().encode(output ?? ""),
          encrypt: enc,
          status,
        });
      } catch (error) {
        // The call IS already in the on-chain Merkle chain; only close failed.
        // Return the callId so the agent can retry the close.
        return fail(
          `call ${callId} emitted but close failed (retry close with this callId): ${errMessage(error)}`,
        );
      }
      return ok({ callId, status: success === false ? "Failure" : "Success" });
    },
  );

  server.registerTool(
    "onemem_close_session",
    {
      title: "Close a trace session",
      description: "Lock the session's Merkle root and mark it completed.",
      inputSchema: { sessionId: z.string(), rwCapId: z.string() },
    },
    async ({ sessionId, rwCapId }) => {
      try {
        await onemem.traces.closeSession({
          sessionId,
          rwCapId,
          status: SessionStatus.Completed,
        });
        return ok({ closed: true });
      } catch (error) {
        return fail(errMessage(error));
      }
    },
  );

  return server;
}

async function main(): Promise<void> {
  const network = process.env.SUI_NETWORK as SuiNetwork | undefined;
  const onemem = await OneMem.create({ network, signer: resolveSigner() });
  const server = buildServer(onemem);
  await server.connect(new StdioServerTransport());
  // stderr is safe for MCP stdio (stdout is the protocol channel).
  process.stderr.write(
    `onemem-mcp ${VERSION} ready on ${onemem.network} (${onemem.senderAddress()})\n`,
  );
}

main().catch((error: unknown) => {
  process.stderr.write(
    `onemem-mcp fatal: ${error instanceof Error ? error.stack : String(error)}\n`,
  );
  process.exit(1);
});
