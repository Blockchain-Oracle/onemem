// Signer resolution for the MCP server.
//
// Order: ONEMEM_PRIVATE_KEY (a `suiprivkey1...` bech32 secret) → the active
// sui CLI keystore's first Ed25519 key. The MCP server records traces on the
// user's behalf, so it needs a delegate key with a NamespaceCapability.

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

export class SignerResolutionError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "SignerResolutionError";
  }
}

function fromKeystore(): Ed25519Keypair {
  const path = join(homedir(), ".sui", "sui_config", "sui.keystore");
  let entries: string[];
  try {
    entries = JSON.parse(readFileSync(path, "utf8")) as string[];
  } catch (error) {
    throw new SignerResolutionError(`No ONEMEM_PRIVATE_KEY set and could not read ${path}`, {
      cause: error,
    });
  }
  const first = entries[0];
  if (!first) {
    throw new SignerResolutionError(`${path} has no keys`);
  }
  const decoded = Buffer.from(first, "base64");
  if (decoded[0] !== 0) {
    throw new SignerResolutionError(
      `First keystore key is not Ed25519 (scheme flag ${decoded[0]})`,
    );
  }
  return Ed25519Keypair.fromSecretKey(decoded.subarray(1));
}

/** Resolve the signing keypair from env or the sui keystore. */
export function resolveSigner(): Ed25519Keypair {
  const envKey = process.env.ONEMEM_PRIVATE_KEY;
  if (envKey) {
    try {
      return Ed25519Keypair.fromSecretKey(envKey);
    } catch (error) {
      throw new SignerResolutionError("ONEMEM_PRIVATE_KEY is not a valid key", { cause: error });
    }
  }
  return fromKeystore();
}
