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
const DEMO_SESSION_ID = "0x08f4ef5b53c768eb446a18659ecc0775ac1a58763890ae51d6658c301a3f33e8";

describe.skipIf(!RUN)("onemem-mcp (stdio, live testnet)", () => {
  it("lists tools and verifies the demo session via the MCP protocol", async () => {
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
      expect(names).toContain("onemem_verify_session");
      expect(names).toContain("onemem_record_call");

      const result = await client.callTool({
        name: "onemem_verify_session",
        arguments: { sessionId: DEMO_SESSION_ID },
      });
      const payload = result.structuredContent as { ok?: boolean; callCount?: number };
      expect(payload?.ok).toBe(true);
      expect(payload?.callCount).toBe(3);
    } finally {
      await client.close();
    }
  }, 60_000);
});
