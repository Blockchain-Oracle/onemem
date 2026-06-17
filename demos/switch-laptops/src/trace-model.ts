import { createHash } from "node:crypto";

export const SHARED_CONTEXT = {
  project: "Next.js project",
  packageManager: "pnpm",
  auth: "Clerk",
  database: "Postgres on Supabase",
} as const;

export const MEMORY_BLOB_ID = "demo:switch-laptops:project-context-memory";

export const PROOF_BOUNDARIES = [
  "Creates two real OneMem TraceSessions and ActionCalls on Sui testnet.",
  "Both sessions use the same OneMem namespace to model continuity across machines and runtimes.",
  "Verifies each on-chain Merkle chain from Sui events and the TraceSession object.",
  "Does not prove a real Claude Code hook, Hermes hook, MemWal recall, cross-device login, Walrus plaintext availability, or Seal decryptability.",
] as const;

export interface DemoCall {
  readonly id: string;
  readonly toolName: string;
  readonly toolNamespace: string;
  readonly label: string;
  readonly input: Record<string, unknown>;
  readonly output: Record<string, unknown>;
}

export interface MemoryReference {
  readonly blobId: string;
  readonly contentHash: string;
  readonly sourceSessionId: string;
  readonly sourceRuntime: string;
}

export function buildLaptopACalls(runId: string): DemoCall[] {
  return [
    {
      id: "inspect-project",
      toolName: "inspect_project_context",
      toolNamespace: "claude-code",
      label: "Laptop A inspects project context",
      input: { prompt: "Remember this project's stack", runId },
      output: { ...SHARED_CONTEXT, source: "mock-claude-code-session" },
    },
    {
      id: "write-memory",
      toolName: "write_project_memory",
      toolNamespace: "claude-code",
      label: "Laptop A writes shared memory",
      input: { ...SHARED_CONTEXT, runId },
      output: {
        memoryBlobId: MEMORY_BLOB_ID,
        contentHash: hex(hashPayload(SHARED_CONTEXT)),
        mocked: true,
      },
    },
    {
      id: "handoff",
      toolName: "prepare_runtime_handoff",
      toolNamespace: "claude-code",
      label: "Laptop A prepares handoff",
      input: { memoryBlobId: MEMORY_BLOB_ID, runId },
      output: { targetRuntime: "hermes", handoffReady: true },
    },
  ];
}

export function buildLaptopBCalls(runId: string, memory: MemoryReference): DemoCall[] {
  return [
    {
      id: "recall-memory",
      toolName: "recall_project_memory",
      toolNamespace: "hermes",
      label: "Laptop B recalls shared memory",
      input: {
        query: "What database does the Next.js project use?",
        memoryBlobId: memory.blobId,
        sourceSessionId: memory.sourceSessionId,
        runId,
      },
      output: {
        ...SHARED_CONTEXT,
        recalledFromBlobId: memory.blobId,
        recalledContentHash: memory.contentHash,
        sourceRuntime: memory.sourceRuntime,
      },
    },
    {
      id: "answer-question",
      toolName: "answer_from_memory",
      toolNamespace: "hermes",
      label: "Laptop B answers from recalled context",
      input: {
        question: "What database does the Next.js project use?",
        recalledContentHash: memory.contentHash,
        runId,
      },
      output: {
        answer:
          "The project uses Postgres on Supabase. It also uses Clerk for auth and pnpm as the package manager.",
        groundedIn: memory.blobId,
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
