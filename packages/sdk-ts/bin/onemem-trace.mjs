#!/usr/bin/env node
// onemem-trace — record a buffered agent session as a verifiable on-chain
// TraceSession (full Walrus + Seal + Merkle). The bridge non-JS runtimes (the
// Python Hermes/CrewAI/LiveKit plugins) use to get full-fidelity traces without
// reimplementing Walrus/Seal.
//
// Reads a JSON payload from argv[2] (a file path) or stdin:
//   { "agentId": "hermes", "environment": "hermes", "label": "hermes",
//     "network": "testnet", "calls": [{ "toolName", "input", "output" }, ...],
//     "target": { "namespaceId", "rwCapId" },   // target optional → auto-provision
//     "parentCallId": "0x..." }                  // optional cross-runtime parent
//
// Cross-runtime stitch: pass `parentCallId` (or $ONEMEM_PARENT_CALL_ID) to chain
// this session's first call off another runtime's call in the same namespace.
// Signer: ONEMEM_PRIVATE_KEY → sui keystore → generated+persisted wallet.
// Prints one JSON line to stdout: { "sessionId", "callIds", "namespaceId", "rwCapId" }.

import { readFileSync } from "node:fs";

import {
  ensureNamespace,
  OneMem,
  recordSession,
  resolveSigner,
  shouldTraceRuntime,
} from "../dist/runtime.js";

function readPayload() {
  const path = process.argv[2];
  const raw = path ? readFileSync(path, "utf8") : readFileSync(0, "utf8");
  return JSON.parse(raw);
}

async function main() {
  const p = readPayload();
  const network = p.network ?? process.env.SUI_NETWORK ?? "testnet";
  const label = p.label ?? p.agentId ?? "onemem";
  const environment = p.environment ?? label;
  const logger = { info: (m) => console.error(m), warn: (m) => console.error(m) };

  try {
    if (!shouldTraceRuntime(environment)) {
      console.error(`[onemem-trace] trace skipped by runtime controls for ${environment}`);
      process.stdout.write(
        `${JSON.stringify({ skipped: true, reason: "runtime-controls", environment, callIds: [] })}\n`,
      );
      return;
    }
  } catch (err) {
    console.error(
      `[onemem-trace] trace skipped: runtime controls unreadable: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
    process.stdout.write(
      `${JSON.stringify({
        skipped: true,
        reason: "runtime-controls-unreadable",
        environment,
        callIds: [],
      })}\n`,
    );
    return;
  }

  const onemem = await OneMem.create({
    network,
    signer: resolveSigner(process.env.ONEMEM_PRIVATE_KEY, logger),
  });

  const envTarget =
    process.env.ONEMEM_NAMESPACE_ID && process.env.ONEMEM_RW_CAP_ID
      ? { namespaceId: process.env.ONEMEM_NAMESPACE_ID, rwCapId: process.env.ONEMEM_RW_CAP_ID }
      : undefined;
  const target = p.target ?? envTarget ?? (await ensureNamespace(onemem, { network, label, logger }));

  const { sessionId, callIds } = await recordSession(onemem, {
    target,
    agentId: p.agentId ?? label,
    environment,
    calls: Array.isArray(p.calls) ? p.calls : [],
    sdkVersion: p.sdkVersion,
    // Cross-runtime stitch: seed the first call's parent with a call id from
    // another runtime's session in the same namespace (env or payload).
    parentCallId: p.parentCallId ?? process.env.ONEMEM_PARENT_CALL_ID ?? null,
  });

  // Emit callIds so an orchestrator can hand one to a sub-runtime as its parent.
  process.stdout.write(`${JSON.stringify({ sessionId, callIds, ...target })}\n`);
}

main().catch((err) => {
  console.error(`[onemem-trace] ${err instanceof Error ? err.stack : String(err)}`);
  process.exit(1);
});
