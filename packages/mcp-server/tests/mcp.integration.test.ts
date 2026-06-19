// Real-system integration: spawn the built MCP server over stdio (exactly how
// Claude Code / Cursor launch it), speak the real MCP protocol, and call a tool
// against live testnet.
//
// Gated behind ONEMEM_INTEGRATION=1 (needs network + a sui keystore).
// Run: ONEMEM_INTEGRATION=1 pnpm --filter @onemem/mcp test

import { fileURLToPath } from "node:url";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { describe, expect, it } from "vitest";

const RUN = process.env.ONEMEM_INTEGRATION === "1";
const SERVER = fileURLToPath(new URL("../dist/index.js", import.meta.url));

describe.skipIf(!RUN)("onemem-mcp (stdio, live testnet)", () => {
  it("lists the memory tools over the MCP protocol", async () => {
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [SERVER],
      env: { ...process.env, SUI_NETWORK: "testnet" } as Record<string, string>,
    });
    const client = new Client({ name: "onemem-mcp-test", version: "0.0.0" });
    await client.connect(transport);

    try {
      const { tools } = await client.listTools();
      const names = tools.map((t) => t.name);
      expect(names).toContain("onemem_add_memory");
      expect(names).toContain("onemem_search_memory");
    } finally {
      await client.close();
    }
  }, 60_000);

  it("add_memory then search_memory round-trips over the MCP protocol", async () => {
    const hasMemory =
      !!process.env.ONEMEM_ACCOUNT_ID &&
      !!process.env.ONEMEM_DELEGATE_KEY &&
      !!process.env.ONEMEM_EMBEDDING_API_KEY;
    if (!hasMemory) return; // memory env not set — skip the memory round-trip

    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [SERVER],
      env: { ...process.env, SUI_NETWORK: "testnet" } as Record<string, string>,
    });
    const client = new Client({ name: "onemem-mcp-mem-test", version: "0.0.0" });
    await client.connect(transport);
    try {
      const fact = `MCP memory test: my deploy target is Sui testnet (${Date.now()})`;
      const added = await client.callTool({
        name: "onemem_add_memory",
        arguments: { text: fact },
      });
      const a = added.structuredContent as { walrusBlobId?: string };
      expect(a?.walrusBlobId).toBeTruthy();

      const found = await client.callTool({
        name: "onemem_search_memory",
        arguments: { query: "where do I deploy" },
      });
      const f = found.structuredContent as { results?: { text: string }[] };
      expect(f?.results?.some((m) => m.text.includes("deploy target is Sui testnet"))).toBe(true);
    } finally {
      await client.close();
    }
  }, 120_000);
});
