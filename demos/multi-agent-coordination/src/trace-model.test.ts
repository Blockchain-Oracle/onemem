import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  buildMarketDelegateCall,
  buildMarketSpecialistCalls,
  buildOrchestratorPreludeCalls,
  buildRiskDelegateCall,
  buildRiskSpecialistCalls,
  buildSynthesisCall,
  hashPayload,
  hex,
  MARKET_REPORT_BLOB_ID,
  marketReportHash,
  RISK_REPORT_BLOB_ID,
  riskReportHash,
  SYNTHESIS_BLOB_ID,
  stableJson,
} from "./trace-model.js";

describe("multi-agent coordination trace model", () => {
  test("models orchestrator delegation and specialist report synthesis", () => {
    const runId = "run-1";
    const prelude = buildOrchestratorPreludeCalls(runId);
    const marketDelegate = buildMarketDelegateCall(runId);
    const riskDelegate = buildRiskDelegateCall(runId);
    const marketDelegation = {
      kind: "market-delegation" as const,
      parentSessionId: "0xorchestrator",
      parentCallId: "0xmarketdelegate",
      fromRuntime: "claude-code" as const,
      toRuntime: "hermes" as const,
    };
    const riskDelegation = {
      kind: "risk-delegation" as const,
      parentSessionId: "0xorchestrator",
      parentCallId: "0xriskdelegate",
      fromRuntime: "claude-code" as const,
      toRuntime: "crewai" as const,
    };
    const marketCalls = buildMarketSpecialistCalls(runId, marketDelegation);
    const riskCalls = buildRiskSpecialistCalls(runId, riskDelegation);
    const synthesis = buildSynthesisCall(runId, [
      {
        kind: "market-report",
        blobId: MARKET_REPORT_BLOB_ID,
        contentHash: marketReportHash(),
        sourceSessionId: "0xmarket",
        sourceRuntime: "hermes",
        parentCallId: marketDelegation.parentCallId,
      },
      {
        kind: "risk-report",
        blobId: RISK_REPORT_BLOB_ID,
        contentHash: riskReportHash(),
        sourceSessionId: "0xrisk",
        sourceRuntime: "crewai",
        parentCallId: riskDelegation.parentCallId,
      },
    ]);

    assert.deepEqual(
      [
        ...prelude.map((call) => call.toolName),
        marketDelegate.toolName,
        riskDelegate.toolName,
        synthesis.toolName,
      ],
      [
        "plan_multi_agent_coordination",
        "delegate_market_specialist",
        "delegate_risk_specialist",
        "synthesize_specialist_reports",
      ],
    );
    assert.equal(marketCalls[0]?.input.delegatedFromCallId, marketDelegation.parentCallId);
    assert.equal(riskCalls[0]?.input.delegatedFromCallId, riskDelegation.parentCallId);
    assert.equal(marketCalls[2]?.output.memoryBlobId, MARKET_REPORT_BLOB_ID);
    assert.equal(riskCalls[2]?.output.memoryBlobId, RISK_REPORT_BLOB_ID);
    assert.equal(synthesis.output.memoryBlobId, SYNTHESIS_BLOB_ID);
    assert.deepEqual(synthesis.input.sourceSessionIds, ["0xmarket", "0xrisk"]);
  });

  test("hashing is stable across object key order", () => {
    const left = { report: { b: 2, a: 1 }, kind: "market" };
    const right = { kind: "market", report: { a: 1, b: 2 } };

    assert.equal(stableJson(left), stableJson(right));
    assert.equal(hex(hashPayload(left)), hex(hashPayload(right)));
    assert.match(hex(hashPayload(left)), /^0x[0-9a-f]{64}$/);
  });
});
