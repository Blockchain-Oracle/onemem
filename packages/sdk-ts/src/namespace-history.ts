type EventCursor = { readonly txDigest: string; readonly eventSeq: string } | null;

export type NamespaceCapabilityHistoryStatus = "active" | "revoked";

export interface NamespaceCapabilityHistoryRow {
  readonly capId: string;
  readonly kind: number;
  readonly recipient: string;
  readonly active: boolean;
  readonly status: NamespaceCapabilityHistoryStatus;
  readonly mintedTxDigest: string | null;
  readonly mintedEventSeq: string | null;
  readonly mintedAtMs: number;
  readonly revokedTxDigest: string | null;
  readonly revokedEventSeq: string | null;
  readonly revokedAtMs: number | null;
}

interface NamespaceEventClient {
  queryEvents(input: {
    readonly query: { readonly MoveEventType: string };
    readonly cursor: EventCursor;
    readonly order: "ascending";
    readonly limit: number;
  }): Promise<{
    readonly data: readonly NamespaceEvent[];
    readonly hasNextPage: boolean;
    readonly nextCursor?: EventCursor;
  }>;
}

interface NamespaceEvent {
  readonly id?: { readonly txDigest?: string; readonly eventSeq?: string };
  readonly timestampMs?: string | number | null;
  readonly parsedJson?: unknown;
}

interface MintedEvent {
  readonly capId: string;
  readonly kind: number;
  readonly recipient: string;
  readonly txDigest: string | null;
  readonly eventSeq: string | null;
  readonly timestampMs: number;
}

interface RevokedEvent {
  readonly capId: string;
  readonly txDigest: string | null;
  readonly eventSeq: string | null;
  readonly timestampMs: number;
}

export async function fetchNamespaceCapabilityHistory(
  client: NamespaceEventClient,
  packageId: string,
  namespaceId: string,
): Promise<NamespaceCapabilityHistoryRow[]> {
  const [minted, revoked] = await Promise.all([
    queryCapabilityEvents<MintedEvent>(
      client,
      packageId,
      namespaceId,
      "NamespaceCapabilityMintedEvent",
      parseMinted,
    ),
    queryCapabilityEvents<RevokedEvent>(
      client,
      packageId,
      namespaceId,
      "NamespaceCapabilityRevokedEvent",
      parseRevoked,
    ),
  ]);

  const revokedByCap = new Map<string, RevokedEvent>();
  for (const event of revoked) {
    const existing = revokedByCap.get(event.capId);
    if (!existing || event.timestampMs >= existing.timestampMs) {
      revokedByCap.set(event.capId, event);
    }
  }

  return minted
    .map((event) => {
      const revokedEvent = revokedByCap.get(event.capId) ?? null;
      return {
        capId: event.capId,
        kind: event.kind,
        recipient: event.recipient,
        active: !revokedEvent,
        status: revokedEvent ? "revoked" : "active",
        mintedTxDigest: event.txDigest,
        mintedEventSeq: event.eventSeq,
        mintedAtMs: event.timestampMs,
        revokedTxDigest: revokedEvent?.txDigest ?? null,
        revokedEventSeq: revokedEvent?.eventSeq ?? null,
        revokedAtMs: revokedEvent?.timestampMs ?? null,
      } satisfies NamespaceCapabilityHistoryRow;
    })
    .sort((a, b) => b.mintedAtMs - a.mintedAtMs || a.capId.localeCompare(b.capId));
}

async function queryCapabilityEvents<T>(
  client: NamespaceEventClient,
  packageId: string,
  namespaceId: string,
  event: string,
  parse: (event: NamespaceEvent, fields: Record<string, unknown>) => T | null,
): Promise<T[]> {
  const rows: T[] = [];
  let cursor: EventCursor = null;

  for (;;) {
    const page = await client.queryEvents({
      query: { MoveEventType: `${packageId}::namespace::${event}` },
      cursor,
      order: "ascending",
      limit: 50,
    });

    for (const item of page.data) {
      const fields = item.parsedJson as Record<string, unknown> | undefined;
      if (!fields || fields.namespace_id !== namespaceId) continue;
      const parsed = parse(item, fields);
      if (parsed) rows.push(parsed);
    }

    if (!page.hasNextPage || !page.nextCursor) break;
    cursor = page.nextCursor;
  }

  return rows;
}

function parseMinted(event: NamespaceEvent, fields: Record<string, unknown>): MintedEvent | null {
  const capId = idString(fields.cap_id);
  const recipient = idString(fields.recipient);
  if (!capId || !recipient) return null;
  return {
    capId,
    kind: Number(fields.kind_tag ?? -1),
    recipient,
    txDigest: event.id?.txDigest ?? null,
    eventSeq: event.id?.eventSeq ?? null,
    timestampMs: Number(event.timestampMs ?? 0),
  };
}

function parseRevoked(event: NamespaceEvent, fields: Record<string, unknown>): RevokedEvent | null {
  const capId = idString(fields.cap_id);
  if (!capId) return null;
  return {
    capId,
    txDigest: event.id?.txDigest ?? null,
    eventSeq: event.id?.eventSeq ?? null,
    timestampMs: Number(event.timestampMs ?? 0),
  };
}

function idString(value: unknown): string | null {
  return typeof value === "string" && value.startsWith("0x") ? value : null;
}
