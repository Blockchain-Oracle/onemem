import type { MemoryRef } from "./memory";

export type MemoryFilter = "all" | "with_blob" | "without_blob" | "recent" | "active_namespace";

export interface RelatedMemory {
  memory: MemoryRef;
  reason: "same session" | "same namespace";
}

export function shortId(value: string | null | undefined, head = 10, tail = 6): string {
  if (!value) return "-";
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

export function formatTime(ms: number): string {
  if (!ms) return "unknown";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ms));
}

export function filterMemories(
  memories: MemoryRef[],
  query: string,
  filter: MemoryFilter,
  activeNamespaceId?: string | null,
  now = Date.now(),
): MemoryRef[] {
  const needle = query.trim().toLowerCase();
  return memories.filter((memory) => {
    if (filter === "with_blob" && !memory.walrusBlobId) return false;
    if (filter === "without_blob" && memory.walrusBlobId) return false;
    if (filter === "active_namespace" && memory.namespaceId !== activeNamespaceId) return false;
    if (filter === "recent" && now - memory.capturedAt > 24 * 60 * 60 * 1000) return false;
    if (!needle) return true;
    return memorySearchText(memory).includes(needle);
  });
}

export function relatedMemories(
  selected: MemoryRef,
  memories: MemoryRef[],
  limit = 3,
): RelatedMemory[] {
  const out: RelatedMemory[] = [];
  for (const memory of memories) {
    if (memory.callId === selected.callId) continue;
    if (memory.sessionId && memory.sessionId === selected.sessionId) {
      out.push({ memory, reason: "same session" });
    }
    if (out.length >= limit) return out;
  }
  for (const memory of memories) {
    if (memory.callId === selected.callId) continue;
    if (out.some((item) => item.memory.callId === memory.callId)) continue;
    if (memory.namespaceId && memory.namespaceId === selected.namespaceId) {
      out.push({ memory, reason: "same namespace" });
    }
    if (out.length >= limit) return out;
  }
  return out;
}

function memorySearchText(memory: MemoryRef): string {
  return [
    memory.callId,
    memory.sessionId,
    memory.namespaceId,
    memory.parentCallId,
    memory.toolName,
    memory.toolNamespace,
    memory.walrusBlobId,
    memory.inputHash,
    memory.contentHash,
    memory.prevHash,
    memory.sessionMerkleRoot,
    memory.capturedByAddress,
    memory.txDigest,
    memory.label,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
