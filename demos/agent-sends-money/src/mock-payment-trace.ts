import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { CallStatus, OneMem, SessionStatus, type SuiNetwork } from "@onemem/sdk-ts";
import { ensureNamespace, resolveNetwork, resolveSigner } from "@onemem/sdk-ts/runtime";

import { buildMockPaymentCalls, hashPayload, hex, PROOF_BOUNDARIES } from "./trace-model.js";

interface Args {
  readonly json: boolean;
  readonly label: string;
  readonly network?: SuiNetwork;
  readonly outFile: string;
}

const DEFAULT_OUT = fileURLToPath(new URL("../out/latest-trace.json", import.meta.url));
const VALID_NETWORKS = new Set(["testnet", "mainnet", "devnet", "local"]);

function parseArgs(argv: readonly string[]): Args {
  let json = false;
  let label = "agent-sends-money-demo";
  let network: SuiNetwork | undefined;
  let outFile = DEFAULT_OUT;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--json") {
      json = true;
      continue;
    }
    if (arg === "--label") {
      label = requiredValue(argv, ++i, "--label");
      continue;
    }
    if (arg === "--network") {
      const value = requiredValue(argv, ++i, "--network");
      if (!VALID_NETWORKS.has(value)) {
        throw new Error(`unknown network "${value}"`);
      }
      network = value as SuiNetwork;
      continue;
    }
    if (arg === "--out") {
      outFile = requiredValue(argv, ++i, "--out");
      continue;
    }
    throw new Error(`unknown argument: ${arg}`);
  }

  return { json, label, network, outFile };
}

function requiredValue(argv: readonly string[], index: number, flag: string): string {
  const value = argv[index];
  if (!value) throw new Error(`${flag} requires a value`);
  return value;
}

function writeJson(path: string, value: unknown): void {
  const absolute = resolve(path);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, `${JSON.stringify(value, null, 2)}\n`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const logger = args.json
    ? {}
    : {
        info: (message: string) => process.stderr.write(`${message}\n`),
        warn: (message: string) => process.stderr.write(`${message}\n`),
      };
  const network = resolveNetwork(args.network, logger);
  if (network !== "testnet") {
    throw new Error("agent-sends-money demo defaults to testnet; pass --network testnet");
  }

  const signer = resolveSigner(undefined, logger);
  const onemem = await OneMem.create({ network, signer });
  const target = await ensureNamespace(onemem, { network, label: args.label, logger });
  const runId = new Date().toISOString();
  const calls = buildMockPaymentCalls(runId);

  const session = await onemem.traces.startSession({
    namespaceId: target.namespaceId,
    rwCapId: target.rwCapId,
    agentId: "agent-sends-money-demo",
    environment: "demo-agent-sends-money",
    sdkVersion: "demo-0.1.0",
  });

  const callIds: string[] = [];
  let parentCallId: string | null = null;
  try {
    for (const call of calls) {
      const emitted = await onemem.traces.appendCall({
        sessionId: session.sessionId,
        namespaceId: target.namespaceId,
        rwCapId: target.rwCapId,
        parentCallId,
        toolName: call.toolName,
        toolNamespace: call.toolNamespace,
        input: { walrusBlob: `demo:${call.id}:input`, hash: hashPayload(call.input) },
        label: call.label,
      });
      await onemem.traces.closeCall({
        sessionId: session.sessionId,
        namespaceId: target.namespaceId,
        rwCapId: target.rwCapId,
        callId: emitted.callId,
        output: { walrusBlob: `demo:${call.id}:output`, hash: hashPayload(call.output) },
        status: CallStatus.Success,
      });
      parentCallId = emitted.callId;
      callIds.push(emitted.callId);
    }
  } catch (error) {
    await onemem.traces
      .endSession({
        sessionId: session.sessionId,
        namespaceId: target.namespaceId,
        rwCapId: target.rwCapId,
        status: SessionStatus.Failed,
      })
      .catch(() => {});
    throw error;
  }

  await onemem.traces.endSession({
    sessionId: session.sessionId,
    namespaceId: target.namespaceId,
    rwCapId: target.rwCapId,
    status: SessionStatus.Completed,
  });
  const verify = await onemem.traces.verifySession(session.sessionId);
  const result = {
    ok: verify.ok,
    runId,
    network,
    sessionId: session.sessionId,
    namespaceId: target.namespaceId,
    callIds,
    callCount: verify.callCount,
    brokenAt: verify.brokenAt,
    expectedMerkleRoot: hex(verify.expectedMerkleRoot),
    computedMerkleRoot: hex(verify.computedMerkleRoot),
    sessionStatus: verify.sessionStatus,
    suiscanUrl: `${onemem.addresses.suiscanBase}/object/${session.sessionId}`,
    dashboardPath: `/trace/${session.sessionId}`,
    publicVerifyPath: `/verify/${session.sessionId}`,
    proofBoundaries: [...PROOF_BOUNDARIES],
    calls: calls.map((call, index) => ({
      id: call.id,
      callId: callIds[index],
      toolName: call.toolName,
      toolNamespace: call.toolNamespace,
      label: call.label,
      inputHash: hex(hashPayload(call.input)),
      outputHash: hex(hashPayload(call.output)),
    })),
  };

  writeJson(args.outFile, result);
  if (args.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    process.stdout.write(`✓ demo trace verified\n`);
    process.stdout.write(`  session     ${result.sessionId}\n`);
    process.stdout.write(`  calls       ${result.callCount}\n`);
    process.stdout.write(`  artifact    ${resolve(args.outFile)}\n`);
    process.stdout.write(`  suiscan     ${result.suiscanUrl}\n`);
    process.stdout.write(`  boundary    mocked payment; no real transfer\n`);
  }
  if (!verify.ok) process.exitCode = 1;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`FATAL: ${message}\n`);
  process.exit(1);
});
