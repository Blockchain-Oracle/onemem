import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { CallStatus, OneMem, SessionStatus, type SuiNetwork } from "@onemem/sdk-ts";
import { ensureNamespace, resolveNetwork, resolveSigner } from "@onemem/sdk-ts/runtime";

import {
  buildLaptopACalls,
  buildLaptopBCalls,
  type DemoCall,
  hashPayload,
  hex,
  MEMORY_BLOB_ID,
  type MemoryReference,
  PROOF_BOUNDARIES,
  SHARED_CONTEXT,
} from "./trace-model.js";

interface Args {
  readonly json: boolean;
  readonly label: string;
  readonly network?: SuiNetwork;
  readonly outFile: string;
}

interface RecordedSession {
  readonly role: "laptop-a" | "laptop-b";
  readonly agentId: string;
  readonly environment: string;
  readonly namespaceId: string;
  readonly sessionId: string;
  readonly ok: boolean;
  readonly callIds: readonly string[];
  readonly callCount: number;
  readonly brokenAt: number | null;
  readonly expectedMerkleRoot: string;
  readonly computedMerkleRoot: string;
  readonly sessionStatus: number | null;
  readonly dashboardPath: string;
  readonly publicVerifyPath: string;
  readonly suiscanUrl: string;
  readonly calls: readonly {
    readonly id: string;
    readonly callId: string | undefined;
    readonly toolName: string;
    readonly toolNamespace: string;
    readonly label: string;
    readonly inputHash: string;
    readonly outputHash: string;
  }[];
}

const DEFAULT_OUT = fileURLToPath(new URL("../out/latest-trace.json", import.meta.url));
const VALID_NETWORKS = new Set(["testnet", "mainnet", "devnet", "local"]);

function parseArgs(argv: readonly string[]): Args {
  let json = false;
  let label = "switch-laptops-demo";
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
      if (!VALID_NETWORKS.has(value)) throw new Error(`unknown network "${value}"`);
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

async function recordDemoSession(
  onemem: OneMem,
  args: {
    role: "laptop-a" | "laptop-b";
    namespaceId: string;
    rwCapId: string;
    agentId: string;
    environment: string;
    calls: readonly DemoCall[];
  },
): Promise<RecordedSession> {
  const session = await onemem.traces.startSession({
    namespaceId: args.namespaceId,
    rwCapId: args.rwCapId,
    agentId: args.agentId,
    environment: args.environment,
    sdkVersion: "demo-0.1.0",
  });
  const callIds: string[] = [];
  let parentCallId: string | null = null;
  try {
    for (const call of args.calls) {
      const emitted = await onemem.traces.appendCall({
        sessionId: session.sessionId,
        namespaceId: args.namespaceId,
        rwCapId: args.rwCapId,
        parentCallId,
        toolName: call.toolName,
        toolNamespace: call.toolNamespace,
        input: { walrusBlob: `demo:switch:${call.id}:input`, hash: hashPayload(call.input) },
        label: call.label,
      });
      await onemem.traces.closeCall({
        sessionId: session.sessionId,
        namespaceId: args.namespaceId,
        rwCapId: args.rwCapId,
        callId: emitted.callId,
        output: { walrusBlob: `demo:switch:${call.id}:output`, hash: hashPayload(call.output) },
        status: CallStatus.Success,
      });
      parentCallId = emitted.callId;
      callIds.push(emitted.callId);
    }
  } catch (error) {
    await onemem.traces
      .endSession({
        sessionId: session.sessionId,
        namespaceId: args.namespaceId,
        rwCapId: args.rwCapId,
        status: SessionStatus.Failed,
      })
      .catch(() => {});
    throw error;
  }

  await onemem.traces.endSession({
    sessionId: session.sessionId,
    namespaceId: args.namespaceId,
    rwCapId: args.rwCapId,
    status: SessionStatus.Completed,
  });
  const verify = await onemem.traces.verifySession(session.sessionId);
  return {
    role: args.role,
    agentId: args.agentId,
    environment: args.environment,
    namespaceId: args.namespaceId,
    sessionId: session.sessionId,
    ok: verify.ok,
    callIds,
    callCount: verify.callCount,
    brokenAt: verify.brokenAt,
    expectedMerkleRoot: hex(verify.expectedMerkleRoot),
    computedMerkleRoot: hex(verify.computedMerkleRoot),
    sessionStatus: verify.sessionStatus,
    dashboardPath: `/trace/${session.sessionId}`,
    publicVerifyPath: `/verify/${session.sessionId}`,
    suiscanUrl: `${onemem.addresses.suiscanBase}/object/${session.sessionId}`,
    calls: args.calls.map((call, index) => ({
      id: call.id,
      callId: callIds[index],
      toolName: call.toolName,
      toolNamespace: call.toolNamespace,
      label: call.label,
      inputHash: hex(hashPayload(call.input)),
      outputHash: hex(hashPayload(call.output)),
    })),
  };
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
    throw new Error("switch-laptops demo defaults to testnet; pass --network testnet");
  }

  const signer = resolveSigner(undefined, logger);
  const onemem = await OneMem.create({ network, signer });
  const target = await ensureNamespace(onemem, { network, label: args.label, logger });
  const runId = new Date().toISOString();
  const laptopACalls = buildLaptopACalls(runId);
  const laptopA = await recordDemoSession(onemem, {
    role: "laptop-a",
    namespaceId: target.namespaceId,
    rwCapId: target.rwCapId,
    agentId: "switch-laptops-claude-code",
    environment: "laptop-a-claude-code",
    calls: laptopACalls,
  });
  const memory: MemoryReference = {
    blobId: MEMORY_BLOB_ID,
    contentHash: hex(hashPayload(SHARED_CONTEXT)),
    sourceSessionId: laptopA.sessionId,
    sourceRuntime: laptopA.environment,
  };
  const laptopB = await recordDemoSession(onemem, {
    role: "laptop-b",
    namespaceId: target.namespaceId,
    rwCapId: target.rwCapId,
    agentId: "switch-laptops-hermes",
    environment: "laptop-b-hermes",
    calls: buildLaptopBCalls(runId, memory),
  });
  const ok = laptopA.ok && laptopB.ok;
  const result = {
    ok,
    runId,
    network,
    namespaceId: target.namespaceId,
    sharedMemory: memory,
    continuity: {
      sameNamespace: laptopA.namespaceId === laptopB.namespaceId,
      distinctSessions: laptopA.sessionId !== laptopB.sessionId,
      distinctRuntimes: laptopA.environment !== laptopB.environment,
      laptopASessionId: laptopA.sessionId,
      laptopBSessionId: laptopB.sessionId,
      claim: "Laptop B uses the project-context memory reference written by Laptop A.",
    },
    sessions: [laptopA, laptopB],
    proofBoundaries: [...PROOF_BOUNDARIES],
  };

  writeJson(args.outFile, result);
  if (args.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    process.stdout.write("✓ switch-laptops demo traces verified\n");
    process.stdout.write(`  namespace   ${result.namespaceId}\n`);
    process.stdout.write(`  laptop A    ${laptopA.sessionId} (${laptopA.callCount} calls)\n`);
    process.stdout.write(`  laptop B    ${laptopB.sessionId} (${laptopB.callCount} calls)\n`);
    process.stdout.write(`  artifact    ${resolve(args.outFile)}\n`);
    process.stdout.write("  boundary    mocked runtimes; same namespace continuity only\n");
  }
  if (!ok) process.exitCode = 1;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`FATAL: ${message}\n`);
  process.exit(1);
});
