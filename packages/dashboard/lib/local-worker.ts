export interface LocalObservation {
  readonly id: number;
  readonly sessionId: string;
  readonly seq: number;
  readonly type: string;
  readonly toolName: string | null;
  readonly toolNamespace: string | null;
  readonly inputPreview: string | null;
  readonly outputPreview: string | null;
  readonly parentCallId: string | null;
  readonly createdAt: number;
}

export interface LocalSession {
  readonly id: string;
  readonly runtime: string;
  readonly projectPath: string | null;
  readonly namespaceId: string | null;
  readonly onememSessionId: string | null;
  readonly status: "open" | "closed";
  readonly startedAt: number;
  readonly endedAt: number | null;
}

export function localWorkerUrl(): string {
  return (process.env.ONEMEM_WORKER_URL || "http://127.0.0.1:4041").replace(/\/+$/, "");
}

export async function fetchLocalWorker(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${localWorkerUrl()}${path}`, {
    ...init,
    cache: "no-store",
  });
}
