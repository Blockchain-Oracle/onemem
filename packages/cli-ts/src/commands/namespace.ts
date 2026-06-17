import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { type NamespaceCapabilityKind, OneMem } from "@onemem/sdk-ts";
import { resolveNetwork, resolveSigner } from "@onemem/sdk-ts/runtime";
import { type GlobalOpts, printJson, printLine, printTable, runCommand } from "../util/output.js";
import { parseNetwork } from "../util/validate.js";

type ShareCapKind = "ReadOnly" | "ReadWrite";

interface ShareOpts {
  cap?: string;
  adminCap?: string;
}

interface RevokeOpts {
  allowAdmin?: boolean;
}

export function parseShareCapKind(raw: string | undefined): ShareCapKind {
  const value = raw ?? "ReadOnly";
  const normalized = value.toLowerCase();
  if (normalized === "readonly" || normalized === "read-only" || normalized === "ro") {
    return "ReadOnly";
  }
  if (normalized === "readwrite" || normalized === "read-write" || normalized === "rw") {
    return "ReadWrite";
  }
  throw new Error("--cap must be one of: ReadOnly, ReadWrite");
}

export function resolveAdminCapId(opts: { adminCap?: string }, env = process.env): string {
  const cap = opts.adminCap || env.ONEMEM_ADMIN_CAP_ID;
  if (!cap) {
    throw new Error("missing admin cap: pass --admin-cap <id> or set ONEMEM_ADMIN_CAP_ID");
  }
  return cap;
}

export function assertRevokeAllowed(kind: NamespaceCapabilityKind, allowAdmin = false): void {
  if (kind === "Admin" && !allowAdmin) {
    throw new Error("refusing to revoke Admin capability without --allow-admin");
  }
}

function assertObjectId(value: string, label: string): void {
  if (!/^0x[0-9a-fA-F]+$/.test(value)) {
    throw new Error(`${label} must be a 0x-prefixed hex object/address id`);
  }
}

function kindRank(kind: number): string {
  if (kind === 0) return "ReadOnly";
  if (kind === 1) return "ReadWrite";
  if (kind === 2) return "Admin";
  return `Unknown(${kind})`;
}

function shortId(id: string): string {
  return id.length > 18 ? `${id.slice(0, 10)}...${id.slice(-6)}` : id;
}

export function namespaceShare(
  namespaceId: string,
  recipient: string,
  opts: ShareOpts,
  command: { optsWithGlobals(): GlobalOpts },
) {
  const g = command.optsWithGlobals();
  return runCommand(g, async () => {
    assertObjectId(namespaceId, "namespace id");
    assertObjectId(recipient, "recipient address");
    const network = resolveNetwork(parseNetwork(g.network));
    const capKind = parseShareCapKind(opts.cap);
    const adminCapId = resolveAdminCapId(opts);
    assertObjectId(adminCapId, "admin cap id");
    const signer = resolveSigner();
    const client = await OneMem.create({ network, signer });
    const result =
      capKind === "ReadOnly"
        ? await client.namespaces.shareReadOnly({ namespaceId, adminCapId, recipient })
        : await client.namespaces.shareReadWrite({ namespaceId, adminCapId, recipient });

    if (g.json) {
      printJson({
        ok: true,
        network,
        namespaceId,
        recipient,
        capKind,
        capId: result.capId,
        txDigest: result.txDigest,
      });
      return;
    }
    printLine("✓ capability shared");
    printLine(`  network     ${network}`);
    printLine(`  namespace   ${namespaceId}`);
    printLine(`  recipient   ${recipient}`);
    printLine(`  capability  ${capKind}`);
    printLine(`  capId       ${result.capId}`);
    printLine(`  txDigest    ${result.txDigest}`);
  });
}

export function namespaceRevoke(
  capId: string,
  opts: RevokeOpts,
  command: { optsWithGlobals(): GlobalOpts },
) {
  const g = command.optsWithGlobals();
  return runCommand(g, async () => {
    assertObjectId(capId, "capability id");
    const network = resolveNetwork(parseNetwork(g.network));
    const signer = resolveSigner();
    const client = await OneMem.create({ network, signer });
    const kind = await client.namespaces.getCapabilityKind(capId);
    assertRevokeAllowed(kind, opts.allowAdmin === true);
    const result = await client.namespaces.revokeCapability({ capId, kind });

    if (g.json) {
      printJson({
        ok: true,
        network,
        capId,
        kind: result.kind,
        txDigest: result.txDigest,
      });
      return;
    }
    printLine("✓ capability revoked");
    printLine(`  network     ${network}`);
    printLine(`  capability  ${capId}`);
    printLine(`  kind        ${result.kind}`);
    printLine(`  scope       holder self-revoke`);
    printLine(`  txDigest    ${result.txDigest}`);
  });
}

export function namespaceCapabilities(
  namespaceId: string,
  command: { optsWithGlobals(): GlobalOpts },
) {
  const g = command.optsWithGlobals();
  return runCommand(g, async () => {
    assertObjectId(namespaceId, "namespace id");
    const network = resolveNetwork(parseNetwork(g.network));
    const client = await OneMem.create({ network, signer: Ed25519Keypair.generate() });
    const capabilities = await client.namespaces.getCapabilities(namespaceId);

    if (g.json) {
      printJson({
        ok: true,
        network,
        namespaceId,
        capabilities: capabilities.map((cap) => ({ ...cap, kindLabel: kindRank(cap.kind) })),
      });
      return;
    }
    printLine(`active capabilities for ${namespaceId} (${network})`);
    printTable(
      capabilities.map((cap) => ({
        cap: shortId(cap.capId),
        kind: kindRank(cap.kind),
        recipient: shortId(cap.recipient),
      })),
      ["cap", "kind", "recipient"],
    );
  });
}
