// Types + fetch helper for the local OneMem worker (127.0.0.1:4041). These
// mirror the worker's compressed, readable shapes: observations (the cards),
// summaries (5-section), and prompts. `blobId` is the durable MemWal reference
// (set once the relayer write lands).

export interface LocalObservation {
  readonly id: number;
  readonly sessionId: string;
  readonly seq: number;
  readonly type: string;
  readonly title: string;
  readonly subtitle: string | null;
  readonly facts: string[];
  readonly narrative: string;
  readonly concepts: string[];
  readonly filesRead: string[];
  readonly filesModified: string[];
  readonly blobId: string | null;
  readonly createdAt: number;
}

export interface LocalSummary {
  readonly id: number;
  readonly sessionId: string;
  readonly request: string | null;
  readonly investigated: string | null;
  readonly learned: string | null;
  readonly completed: string | null;
  readonly nextSteps: string | null;
  readonly notes: string | null;
  readonly blobId: string | null;
  readonly createdAt: number;
}

export interface LocalPrompt {
  readonly id: number;
  readonly sessionId: string;
  readonly seq: number;
  readonly text: string;
  readonly blobId: string | null;
  readonly createdAt: number;
}

export interface LocalSession {
  readonly id: string;
  readonly runtime: string;
  readonly project: string | null;
  readonly projectPath: string | null;
  readonly namespaceId: string | null;
  readonly onememSessionId: string | null;
  readonly status: "open" | "closed";
  readonly startedAt: number;
  readonly endedAt: number | null;
}

/** Live processing signal from the worker (drives the alive badge + spinner). */
export interface ProcessingStatus {
  readonly isProcessing: boolean;
  readonly queueDepth: number;
}

export function localWorkerUrl(): string {
  return (process.env.ONEMEM_WORKER_URL || "http://127.0.0.1:4041").replace(/\/+$/, "");
}

export async function fetchLocalWorker(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${localWorkerUrl()}${path}`, { ...init, cache: "no-store" });
}
