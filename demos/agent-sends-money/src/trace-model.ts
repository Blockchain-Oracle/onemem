import { createHash } from "node:crypto";

export const PROOF_BOUNDARIES = [
  "Creates a real OneMem TraceSession and ActionCalls on Sui testnet.",
  "Verifies the on-chain Merkle chain from Sui events and the TraceSession object.",
  "Does not send real money, transfer USDC, or execute a payment transaction.",
  "Uses placeholder Walrus blob IDs; it does not prove plaintext blob availability or Seal decryptability.",
] as const;

export interface DemoCall {
  readonly id: string;
  readonly toolName: string;
  readonly toolNamespace: string;
  readonly label: string;
  readonly input: Record<string, unknown>;
  readonly output: Record<string, unknown>;
}

export function buildMockPaymentCalls(runId: string): DemoCall[] {
  return [
    {
      id: "resolve-suins",
      toolName: "resolve_suins",
      toolNamespace: "wallet-agent",
      label: "Resolve alice.sui",
      input: { name: "alice.sui", runId },
      output: {
        address: "0x00000000000000000000000000000000000000000000000000000000a11ce500",
        source: "mock-suins",
      },
    },
    {
      id: "fetch-oracle",
      toolName: "fetch_pyth_oracle",
      toolNamespace: "wallet-agent",
      label: "Fetch USDC/USD oracle",
      input: { symbol: "USDC/USD", runId },
      output: { price: "1.0000", confidence: "0.0010", source: "mock-pyth" },
    },
    {
      id: "check-gas",
      toolName: "check_gas_estimate",
      toolNamespace: "wallet-agent",
      label: "Estimate Sui gas",
      input: { txKind: "mock-usdc-transfer", recipient: "alice.sui", amountBaseUnits: 5_000_000 },
      output: { estimatedMist: 1_000_000, route: "mock-fast-path" },
    },
    {
      id: "execute-payment",
      toolName: "execute_payment",
      toolNamespace: "wallet-agent",
      label: "Mock payment execution",
      input: {
        recipient: "0x00000000000000000000000000000000000000000000000000000000a11ce500",
        amountBaseUnits: 5_000_000,
        asset: "USDC",
        runId,
      },
      output: {
        mocked: true,
        txDigest: "mock:testnet:no-transfer",
        warning: "No real payment transaction was built, signed, or submitted.",
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
