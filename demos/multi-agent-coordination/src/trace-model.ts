import { createHash } from "node:crypto";

export const COORDINATION_QUESTION =
  "Should OneMem prioritize short-expiry prediction-market agents for demo day?";

export const MARKET_REPORT_BLOB_ID = "demo:multi-agent:market-specialist-report";
export const RISK_REPORT_BLOB_ID = "demo:multi-agent:risk-specialist-report";
export const SYNTHESIS_BLOB_ID = "demo:multi-agent:orchestrator-synthesis";

export const MARKET_REPORT = {
  specialist: "hermes-market-specialist",
  findings: [
    "Short-expiry markets are visually compelling because odds move during the demo window.",
    "CLOB-style liquidity metrics make agent actions easy to inspect and explain.",
    "The strongest wedge is not price prediction; it is verifiable tool provenance.",
  ],
} as const;

export const RISK_REPORT = {
  specialist: "crewai-risk-specialist",
  risks: [
    "Oracle latency can make fast-expiry settlement look arbitrary.",
    "Thin liquidity creates misleading confidence if the demo treats prices as truth.",
    "Live financial actions should remain mocked unless a separate payment proof is required.",
  ],
} as const;

export const FINAL_SYNTHESIS = {
  answer:
    "Use short-expiry prediction markets as the story, but keep execution mocked and make the proof about cross-runtime trace integrity.",
  recommendation: "ship-cross-runtime-trace-demo",
} as const;

export const PROOF_BOUNDARIES = [
  "Creates three real OneMem TraceSessions and ActionCalls on Sui testnet.",
  "All sessions use the same OneMem namespace.",
  "Specialist sessions start with parentCallId values emitted by orchestrator delegate calls.",
  "Verifies every on-chain Merkle chain from Sui events and TraceSession objects.",
  "Does not prove real Claude Code hooks, Hermes execution, CrewAI execution, LangGraph execution, real parallelism, MemWal semantic recall, Walrus plaintext availability, or Seal decryptability.",
] as const;

export type RuntimeRole = "orchestrator" | "market-specialist" | "risk-specialist";

export interface DemoCall {
  readonly id: string;
  readonly role: RuntimeRole;
  readonly toolName: string;
  readonly toolNamespace: string;
  readonly label: string;
  readonly input: Record<string, unknown>;
  readonly output: Record<string, unknown>;
}

export interface DelegationReference {
  readonly kind: "market-delegation" | "risk-delegation";
  readonly parentSessionId: string;
  readonly parentCallId: string;
  readonly fromRuntime: "claude-code";
  readonly toRuntime: "hermes" | "crewai";
}

export interface SpecialistReportReference {
  readonly kind: "market-report" | "risk-report";
  readonly blobId: string;
  readonly contentHash: string;
  readonly sourceSessionId: string;
  readonly sourceRuntime: "hermes" | "crewai";
  readonly parentCallId: string;
}

export function marketReportHash(): string {
  return hex(hashPayload(MARKET_REPORT));
}

export function riskReportHash(): string {
  return hex(hashPayload(RISK_REPORT));
}

export function synthesisHash(): string {
  return hex(hashPayload(FINAL_SYNTHESIS));
}

export function buildOrchestratorPreludeCalls(runId: string): DemoCall[] {
  return [
    {
      id: "plan-coordination",
      role: "orchestrator",
      toolName: "plan_multi_agent_coordination",
      toolNamespace: "claude-code",
      label: "Claude Code plans specialist delegation",
      input: { question: COORDINATION_QUESTION, runId },
      output: {
        specialists: ["hermes-market-specialist", "crewai-risk-specialist"],
        mocked: true,
      },
    },
  ];
}

export function buildMarketDelegateCall(runId: string): DemoCall {
  return {
    id: "delegate-market-specialist",
    role: "orchestrator",
    toolName: "delegate_market_specialist",
    toolNamespace: "claude-code",
    label: "Delegate market analysis to Hermes",
    input: { question: COORDINATION_QUESTION, targetRuntime: "hermes", runId },
    output: {
      delegatedAgent: "hermes-market-specialist",
      expectedArtifact: MARKET_REPORT_BLOB_ID,
      mocked: true,
    },
  };
}

export function buildRiskDelegateCall(runId: string): DemoCall {
  return {
    id: "delegate-risk-specialist",
    role: "orchestrator",
    toolName: "delegate_risk_specialist",
    toolNamespace: "claude-code",
    label: "Delegate risk analysis to CrewAI",
    input: { question: COORDINATION_QUESTION, targetRuntime: "crewai", runId },
    output: {
      delegatedAgent: "crewai-risk-specialist",
      expectedArtifact: RISK_REPORT_BLOB_ID,
      mocked: true,
    },
  };
}

export function buildMarketSpecialistCalls(
  runId: string,
  delegation: DelegationReference,
): DemoCall[] {
  return [
    {
      id: "accept-market-delegation",
      role: "market-specialist",
      toolName: "accept_delegation",
      toolNamespace: "hermes",
      label: "Hermes accepts market-analysis delegation",
      input: { delegatedFromCallId: delegation.parentCallId, runId },
      output: { accepted: true, parentSessionId: delegation.parentSessionId, mocked: true },
    },
    {
      id: "analyze-market-structure",
      role: "market-specialist",
      toolName: "analyze_market_structure",
      toolNamespace: "hermes",
      label: "Analyze demo-market structure",
      input: { question: COORDINATION_QUESTION, runId },
      output: { findings: MARKET_REPORT.findings, mocked: true },
    },
    {
      id: "write-market-report",
      role: "market-specialist",
      toolName: "write_market_report_memory",
      toolNamespace: "hermes",
      label: "Write market specialist report",
      input: { reportKind: "market", runId },
      output: {
        memoryBlobId: MARKET_REPORT_BLOB_ID,
        contentHash: marketReportHash(),
        report: MARKET_REPORT,
        mocked: true,
      },
    },
  ];
}

export function buildRiskSpecialistCalls(
  runId: string,
  delegation: DelegationReference,
): DemoCall[] {
  return [
    {
      id: "accept-risk-delegation",
      role: "risk-specialist",
      toolName: "accept_delegation",
      toolNamespace: "crewai",
      label: "CrewAI accepts risk-analysis delegation",
      input: { delegatedFromCallId: delegation.parentCallId, runId },
      output: { accepted: true, parentSessionId: delegation.parentSessionId, mocked: true },
    },
    {
      id: "analyze-risk-boundaries",
      role: "risk-specialist",
      toolName: "analyze_risk_boundaries",
      toolNamespace: "crewai",
      label: "Analyze live-demo risk boundaries",
      input: { question: COORDINATION_QUESTION, runId },
      output: { risks: RISK_REPORT.risks, mocked: true },
    },
    {
      id: "write-risk-report",
      role: "risk-specialist",
      toolName: "write_risk_report_memory",
      toolNamespace: "crewai",
      label: "Write risk specialist report",
      input: { reportKind: "risk", runId },
      output: {
        memoryBlobId: RISK_REPORT_BLOB_ID,
        contentHash: riskReportHash(),
        report: RISK_REPORT,
        mocked: true,
      },
    },
  ];
}

export function buildSynthesisCall(
  runId: string,
  reports: readonly SpecialistReportReference[],
): DemoCall {
  return {
    id: "synthesize-specialist-reports",
    role: "orchestrator",
    toolName: "synthesize_specialist_reports",
    toolNamespace: "claude-code",
    label: "Synthesize specialist reports",
    input: {
      question: COORDINATION_QUESTION,
      reportHashes: reports.map((report) => report.contentHash),
      sourceSessionIds: reports.map((report) => report.sourceSessionId),
      runId,
    },
    output: {
      memoryBlobId: SYNTHESIS_BLOB_ID,
      contentHash: synthesisHash(),
      synthesis: FINAL_SYNTHESIS,
      groundedIn: reports.map((report) => report.blobId),
      mocked: true,
    },
  };
}

export function stableJson(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

export function hashPayload(value: unknown): Uint8Array {
  return createHash("sha256").update(stableJson(value)).digest();
}

export function hex(bytes: Uint8Array): string {
  return `0x${Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")}`;
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, sortValue(child)]),
  );
}
