import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { CallStatus, OneMem, SessionStatus, type SuiNetwork } from "@onemem/sdk-ts";
import { ensureNamespace, resolveNetwork, resolveSigner } from "@onemem/sdk-ts/runtime";

import {
  buildMarketDelegateCall,
  buildMarketSpecialistCalls,
  buildOrchestratorPreludeCalls,
  buildRiskDelegateCall,
  buildRiskSpecialistCalls,
  buildSynthesisCall,
  type DelegationReference,
  type DemoCall,
  hashPayload,
  hex,
  MARKET_REPORT_BLOB_ID,
  marketReportHash,
  PROOF_BOUNDARIES,
  RISK_REPORT_BLOB_ID,
  type RuntimeRole,
  riskReportHash,
  type SpecialistReportReference,
} from "./trace-model.js";

interface Args {
  readonly json: boolean;
  readonly label: string;
  readonly network?: SuiNetwork;
  readonly outFile: string;
}

interface ActiveSession {
  readonly role: RuntimeRole;
  readonly agentId: string;
  readonly environment: string;
  readonly namespaceId: string;
  readonly rwCapId: string;
  readonly sessionId: string;
  readonly calls: DemoCall[];
  readonly callIds: string[];
  readonly parentCallIds: Array<string | null>;
  parentCallId: string | null;
}

interface RecordedSession {
  readonly role: RuntimeRole;
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
    readonly parentCallId: string | null;
    readonly inputHash: string;
    readonly outputHash: string;
  }[];
}

const DEFAULT_OUT = fileURLToPath(new URL("../out/latest-trace.json", import.meta.url));
const VALID_NETWORKS = new Set(["testnet", "mainnet", "devnet", "local"]);
function parseArgs(argv: readonly string[]): Args {
  let json = false;
  let label = "multi-agent-coordination-demo";
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

async function startActiveSession(
  onemem: OneMem,
  args: {
    role: RuntimeRole;
    namespaceId: string;
    rwCapId: string;
    agentId: string;
    environment: string;
    initialParentCallId?: string | null;
  },
): Promise<ActiveSession> {
  const session = await onemem.traces.startSession({
    namespaceId: args.namespaceId,
    rwCapId: args.rwCapId,
    agentId: args.agentId,
    environment: args.environment,
    sdkVersion: "demo-0.1.0",
  });
  return {
    role: args.role,
    agentId: args.agentId,
    environment: args.environment,
    namespaceId: args.namespaceId,
    rwCapId: args.rwCapId,
    sessionId: session.sessionId,
    calls: [],
    callIds: [],
    parentCallIds: [],
    parentCallId: args.initialParentCallId ?? null,
  };
}

async function appendDemoCall(onemem: OneMem, session: ActiveSession, call: DemoCall) {
  const parentCallId = session.parentCallId;
  const emitted = await onemem.traces.appendCall({
    sessionId: session.sessionId,
    namespaceId: session.namespaceId,
    rwCapId: session.rwCapId,
    parentCallId,
    toolName: call.toolName,
    toolNamespace: call.toolNamespace,
    input: { walrusBlob: `demo:multi-agent:${call.id}:input`, hash: hashPayload(call.input) },
    label: call.label,
  });
  await onemem.traces.closeCall({
    sessionId: session.sessionId,
    namespaceId: session.namespaceId,
    rwCapId: session.rwCapId,
    callId: emitted.callId,
    output: { walrusBlob: `demo:multi-agent:${call.id}:output`, hash: hashPayload(call.output) },
    status: CallStatus.Success,
  });
  session.calls.push(call);
  session.callIds.push(emitted.callId);
  session.parentCallIds.push(parentCallId);
  session.parentCallId = emitted.callId;
  return { callId: emitted.callId, parentCallId };
}

async function finishSession(onemem: OneMem, session: ActiveSession): Promise<RecordedSession> {
  await onemem.traces.endSession({
    sessionId: session.sessionId,
    namespaceId: session.namespaceId,
    rwCapId: session.rwCapId,
    status: SessionStatus.Completed,
  });
  const verify = await onemem.traces.verifySession(session.sessionId);
  return {
    role: session.role,
    agentId: session.agentId,
    environment: session.environment,
    namespaceId: session.namespaceId,
    sessionId: session.sessionId,
    ok: verify.ok,
    callIds: session.callIds,
    callCount: verify.callCount,
    brokenAt: verify.brokenAt,
    expectedMerkleRoot: hex(verify.expectedMerkleRoot),
    computedMerkleRoot: hex(verify.computedMerkleRoot),
    sessionStatus: verify.sessionStatus,
    dashboardPath: `/trace/${session.sessionId}`,
    publicVerifyPath: `/verify/${session.sessionId}`,
    suiscanUrl: `${onemem.addresses.suiscanBase}/object/${session.sessionId}`,
    calls: session.calls.map((call, index) => ({
      id: call.id,
      callId: session.callIds[index],
      toolName: call.toolName,
      toolNamespace: call.toolNamespace,
      label: call.label,
      parentCallId: session.parentCallIds[index] ?? null,
      inputHash: hex(hashPayload(call.input)),
      outputHash: hex(hashPayload(call.output)),
    })),
  };
}

async function failSession(onemem: OneMem, session: ActiveSession) {
  await onemem.traces
    .endSession({
      sessionId: session.sessionId,
      namespaceId: session.namespaceId,
      rwCapId: session.rwCapId,
      status: SessionStatus.Failed,
    })
    .catch(() => {});
}

async function recordSpecialist(
  onemem: OneMem,
  args: {
    role: "market-specialist" | "risk-specialist";
    namespaceId: string;
    rwCapId: string;
    agentId: string;
    environment: string;
    delegation: DelegationReference;
    calls: readonly DemoCall[];
  },
) {
  const session = await startActiveSession(onemem, {
    role: args.role,
    namespaceId: args.namespaceId,
    rwCapId: args.rwCapId,
    agentId: args.agentId,
    environment: args.environment,
    initialParentCallId: args.delegation.parentCallId,
  });
  try {
    for (const call of args.calls) await appendDemoCall(onemem, session, call);
  } catch (error) {
    await failSession(onemem, session);
    throw error;
  }
  const recorded = await finishSession(onemem, session);
  return {
    recorded,
    link: {
      kind: args.delegation.kind,
      parentSessionId: args.delegation.parentSessionId,
      parentCallId: args.delegation.parentCallId,
      childSessionId: recorded.sessionId,
      childFirstCallId: recorded.callIds[0],
      fromRuntime: args.delegation.fromRuntime,
      toRuntime: args.delegation.toRuntime,
      ok: recorded.calls[0]?.parentCallId === args.delegation.parentCallId,
    },
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
    throw new Error("multi-agent-coordination demo defaults to testnet; pass --network testnet");
  }

  const signer = resolveSigner(undefined, logger);
  const onemem = await OneMem.create({ network, signer });
  const target = await ensureNamespace(onemem, { network, label: args.label, logger });
  const runId = new Date().toISOString();
  const orchestrator = await startActiveSession(onemem, {
    role: "orchestrator",
    namespaceId: target.namespaceId,
    rwCapId: target.rwCapId,
    agentId: "multi-agent-claude-code-orchestrator",
    environment: "claude-code-orchestrator",
  });

  try {
    for (const call of buildOrchestratorPreludeCalls(runId)) {
      await appendDemoCall(onemem, orchestrator, call);
    }
    const marketDelegate = await appendDemoCall(
      onemem,
      orchestrator,
      buildMarketDelegateCall(runId),
    );
    const marketDelegation: DelegationReference = {
      kind: "market-delegation",
      parentSessionId: orchestrator.sessionId,
      parentCallId: marketDelegate.callId,
      fromRuntime: "claude-code",
      toRuntime: "hermes",
    };
    const market = await recordSpecialist(onemem, {
      role: "market-specialist",
      namespaceId: target.namespaceId,
      rwCapId: target.rwCapId,
      agentId: "multi-agent-hermes-market-specialist",
      environment: "hermes-market-specialist",
      delegation: marketDelegation,
      calls: buildMarketSpecialistCalls(runId, marketDelegation),
    });
    const riskDelegate = await appendDemoCall(onemem, orchestrator, buildRiskDelegateCall(runId));
    const riskDelegation: DelegationReference = {
      kind: "risk-delegation",
      parentSessionId: orchestrator.sessionId,
      parentCallId: riskDelegate.callId,
      fromRuntime: "claude-code",
      toRuntime: "crewai",
    };
    const risk = await recordSpecialist(onemem, {
      role: "risk-specialist",
      namespaceId: target.namespaceId,
      rwCapId: target.rwCapId,
      agentId: "multi-agent-crewai-risk-specialist",
      environment: "crewai-risk-specialist",
      delegation: riskDelegation,
      calls: buildRiskSpecialistCalls(runId, riskDelegation),
    });
    const reports: SpecialistReportReference[] = [
      {
        kind: "market-report",
        blobId: MARKET_REPORT_BLOB_ID,
        contentHash: marketReportHash(),
        sourceSessionId: market.recorded.sessionId,
        sourceRuntime: "hermes",
        parentCallId: marketDelegation.parentCallId,
      },
      {
        kind: "risk-report",
        blobId: RISK_REPORT_BLOB_ID,
        contentHash: riskReportHash(),
        sourceSessionId: risk.recorded.sessionId,
        sourceRuntime: "crewai",
        parentCallId: riskDelegation.parentCallId,
      },
    ];
    await appendDemoCall(onemem, orchestrator, buildSynthesisCall(runId, reports));
    const root = await finishSession(onemem, orchestrator);
    const sessions = [root, market.recorded, risk.recorded] as const;
    const ok = sessions.every((session) => session.ok);
    const result = {
      ok,
      runId,
      network,
      namespaceId: target.namespaceId,
      composition: {
        claim:
          "Mocked Claude Code orchestrator delegates to mocked Hermes and CrewAI specialists through cross-session parentCallId links.",
        orchestratorSessionId: root.sessionId,
        specialistSessionIds: [market.recorded.sessionId, risk.recorded.sessionId],
        crossRuntimeLinks: [market.link, risk.link],
      },
      reportReferences: reports,
      sessions,
      proofBoundaries: [...PROOF_BOUNDARIES],
    };
    writeJson(args.outFile, result);
    if (args.json) {
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    } else {
      process.stdout.write("✓ multi-agent coordination demo traces verified\n");
      process.stdout.write(`  namespace       ${result.namespaceId}\n`);
      for (const session of sessions) {
        process.stdout.write(
          `  ${session.role.padEnd(17)} ${session.sessionId} (${session.callCount} calls)\n`,
        );
      }
      process.stdout.write(`  artifact        ${resolve(args.outFile)}\n`);
      process.stdout.write("  boundary        mocked runtimes; real cross-linked testnet traces\n");
    }
    if (!ok) process.exitCode = 1;
  } catch (error) {
    await failSession(onemem, orchestrator);
    throw error;
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`FATAL: ${message}\n`);
  process.exit(1);
});
