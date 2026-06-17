import { createHash } from "node:crypto";

export const RESEARCH_TOPIC = "prediction market microstructure";

export const SOURCE_DIGEST_MEMORY_BLOB_ID = "demo:research-agent:day-1-source-digest";
export const SYNTHESIS_MEMORY_BLOB_ID = "demo:research-agent:day-2-synthesis";

export const SOURCE_DIGEST = {
  topic: RESEARCH_TOPIC,
  sources: [
    {
      title: "CLOB prediction market mechanics",
      finding: "Central-limit-order-book markets expose liquidity and spread dynamics.",
    },
    {
      title: "Short-horizon market expiry design",
      finding: "Sub-hour expiries need oracle latency and settlement-risk controls.",
    },
    {
      title: "Volatility surface analogies",
      finding: "Prediction-market pricing can borrow option-volatility-surface tooling.",
    },
  ],
} as const;

export const RESEARCH_SYNTHESIS = {
  topic: RESEARCH_TOPIC,
  findings: [
    "CLOB-based markets make liquidity conditions auditable but expose thin-book risk.",
    "Fast expiries create useful intraday instruments only when settlement latency is bounded.",
    "Volatility-surface style views are the missing primitive for comparing market uncertainty.",
  ],
} as const;

export const PROOF_BOUNDARIES = [
  "Creates three real OneMem TraceSessions and ActionCalls on Sui testnet.",
  "All sessions use the same OneMem namespace to model research memory accumulating over time.",
  "Verifies each on-chain Merkle chain from Sui events and the TraceSession object.",
  "Does not prove real web search, PDF extraction, Hermes execution, MemWal semantic recall, Walrus plaintext availability, or Seal decryptability.",
] as const;

export interface DemoCall {
  readonly id: string;
  readonly day: "day-1" | "day-2" | "day-3";
  readonly toolName: string;
  readonly toolNamespace: string;
  readonly label: string;
  readonly input: Record<string, unknown>;
  readonly output: Record<string, unknown>;
}

export interface ResearchMemoryReference {
  readonly kind: "source-digest" | "research-synthesis";
  readonly blobId: string;
  readonly contentHash: string;
  readonly sourceSessionId: string;
  readonly sourceRuntime: string;
}

export function sourceDigestHash(): string {
  return hex(hashPayload(SOURCE_DIGEST));
}

export function synthesisHash(): string {
  return hex(hashPayload(RESEARCH_SYNTHESIS));
}

export function buildDay1Calls(runId: string): DemoCall[] {
  return [
    {
      id: "search-sources",
      day: "day-1",
      toolName: "search_prediction_market_sources",
      toolNamespace: "research-agent",
      label: "Day 1: find source material",
      input: {
        query: "prediction market CLOB settlement volatility surface",
        topic: RESEARCH_TOPIC,
        runId,
      },
      output: {
        mocked: true,
        sourceCount: SOURCE_DIGEST.sources.length,
        sources: SOURCE_DIGEST.sources.map((source) => source.title),
      },
    },
    {
      id: "write-source-digest",
      day: "day-1",
      toolName: "write_source_digest_memory",
      toolNamespace: "research-agent",
      label: "Day 1: write source digest memory",
      input: {
        topic: RESEARCH_TOPIC,
        sourceCount: SOURCE_DIGEST.sources.length,
        runId,
      },
      output: {
        memoryBlobId: SOURCE_DIGEST_MEMORY_BLOB_ID,
        contentHash: sourceDigestHash(),
        digest: SOURCE_DIGEST,
        mocked: true,
      },
    },
  ];
}

export function buildDay2Calls(runId: string, sourceDigest: ResearchMemoryReference): DemoCall[] {
  return [
    {
      id: "extract-market-microstructure",
      day: "day-2",
      toolName: "extract_market_microstructure_summary",
      toolNamespace: "research-agent",
      label: "Day 2: summarize market microstructure",
      input: {
        topic: RESEARCH_TOPIC,
        sourceMemoryBlobId: sourceDigest.blobId,
        sourceSessionId: sourceDigest.sourceSessionId,
        runId,
      },
      output: {
        finding: RESEARCH_SYNTHESIS.findings[0],
        citedMemoryHash: sourceDigest.contentHash,
        mocked: true,
      },
    },
    {
      id: "extract-volatility-surface",
      day: "day-2",
      toolName: "extract_volatility_surface_summary",
      toolNamespace: "research-agent",
      label: "Day 2: summarize volatility surface angle",
      input: {
        topic: RESEARCH_TOPIC,
        sourceMemoryBlobId: sourceDigest.blobId,
        sourceSessionId: sourceDigest.sourceSessionId,
        runId,
      },
      output: {
        findings: [RESEARCH_SYNTHESIS.findings[1], RESEARCH_SYNTHESIS.findings[2]],
        citedMemoryHash: sourceDigest.contentHash,
        mocked: true,
      },
    },
    {
      id: "write-research-synthesis",
      day: "day-2",
      toolName: "write_research_synthesis_memory",
      toolNamespace: "research-agent",
      label: "Day 2: write synthesis memory",
      input: {
        topic: RESEARCH_TOPIC,
        sourceMemoryBlobId: sourceDigest.blobId,
        sourceMemoryHash: sourceDigest.contentHash,
        runId,
      },
      output: {
        memoryBlobId: SYNTHESIS_MEMORY_BLOB_ID,
        contentHash: synthesisHash(),
        synthesis: RESEARCH_SYNTHESIS,
        mocked: true,
      },
    },
  ];
}

export function buildDay3Calls(
  runId: string,
  memories: readonly ResearchMemoryReference[],
): DemoCall[] {
  const hashes = memories.map((memory) => memory.contentHash);
  const blobs = memories.map((memory) => memory.blobId);
  return [
    {
      id: "recall-research-memory",
      day: "day-3",
      toolName: "recall_research_memory",
      toolNamespace: "research-agent",
      label: "Day 3: recall accumulated research memory",
      input: {
        question: "What are the three most important prediction-market findings?",
        memoryBlobIds: blobs,
        runId,
      },
      output: {
        recalledContentHashes: hashes,
        recalledMemoryCount: memories.length,
        topic: RESEARCH_TOPIC,
        mocked: true,
      },
    },
    {
      id: "answer-research-question",
      day: "day-3",
      toolName: "answer_research_question",
      toolNamespace: "research-agent",
      label: "Day 3: answer from accumulated memory",
      input: {
        question: "What are the three most important prediction-market findings?",
        recalledContentHashes: hashes,
        runId,
      },
      output: {
        answer: RESEARCH_SYNTHESIS.findings,
        groundedIn: blobs,
        mocked: true,
      },
    },
  ];
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
