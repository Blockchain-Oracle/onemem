import {
  getJsonRpcFullnodeUrl,
  type SuiArgument,
  type SuiCallArg,
  SuiJsonRpcClient,
  type SuiTransactionBlockKind,
  type SuiTransactionBlockResponse,
} from "@mysten/sui/jsonRpc";
import { Ed25519Keypair, Ed25519PublicKey } from "@mysten/sui/keypairs/ed25519";
import {
  isValidSuiAddress,
  isValidSuiObjectId,
  isValidTransactionDigest,
  normalizeSuiAddress,
  normalizeSuiObjectId,
} from "@mysten/sui/utils";

const textEncoder = new TextEncoder();

type LoginNetwork = "mainnet" | "testnet" | "devnet" | "localnet";

interface TransactionProofClient {
  getTransactionBlock(input: {
    digest: string;
    options: {
      showEffects: true;
      showEvents: true;
      showInput: true;
      showObjectChanges: true;
    };
  }): Promise<SuiTransactionBlockResponse>;
}

interface LoginCredentialValidationOptions {
  readonly client?: TransactionProofClient;
}

export class LoginCredentialValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LoginCredentialValidationError";
  }
}

function stringField(payload: Record<string, unknown>, key: string): string {
  const value = payload[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new LoginCredentialValidationError(`callback payload missing ${key}`);
  }
  return value;
}

function hexToBytes(value: string): Uint8Array {
  const hex = value.startsWith("0x") ? value.slice(2) : value;
  if (hex.length % 2 !== 0 || /[^0-9a-f]/i.test(hex)) {
    throw new LoginCredentialValidationError("credential key material must be hex");
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.length === right.length && left.every((byte, index) => byte === right[index]);
}

function objectIdField(payload: Record<string, unknown>, key: string): string {
  const value = stringField(payload, key);
  if (!isValidSuiObjectId(value)) {
    throw new LoginCredentialValidationError(`${key} must be a valid Sui object ID`);
  }
  return value;
}

function addressField(payload: Record<string, unknown>, key: string): string {
  const value = stringField(payload, key);
  if (!isValidSuiAddress(value)) {
    throw new LoginCredentialValidationError(`${key} must be a valid Sui address`);
  }
  return value;
}

function networkField(payload: Record<string, unknown>): LoginNetwork {
  const value = stringField(payload, "network");
  if (value !== "mainnet" && value !== "testnet" && value !== "devnet" && value !== "localnet") {
    throw new LoginCredentialValidationError(
      "network must be mainnet, testnet, devnet, or localnet",
    );
  }
  return value;
}

function transactionDigestField(payload: Record<string, unknown>): string {
  const value = stringField(payload, "delegateRegistrationDigest");
  if (!isValidTransactionDigest(value)) {
    throw new LoginCredentialValidationError(
      "delegateRegistrationDigest must be a valid Sui digest",
    );
  }
  return value;
}

function transactionInputIndex(argument: SuiArgument | undefined): number | null {
  if (typeof argument === "object" && argument !== null && "Input" in argument) {
    return typeof argument.Input === "number" ? argument.Input : null;
  }
  return null;
}

function inputForArgument(
  inputs: readonly SuiCallArg[] | undefined,
  argument: SuiArgument | undefined,
): SuiCallArg | null {
  const index = transactionInputIndex(argument);
  return typeof index === "number" ? (inputs?.[index] ?? null) : null;
}

function inputObjectId(input: SuiCallArg | null): string | null {
  return input?.type === "object" && "objectId" in input ? input.objectId : null;
}

function inputPureValue(input: SuiCallArg | null): unknown {
  return input?.type === "pure" ? input.value : undefined;
}

function pureByteVector(value: unknown): Uint8Array | null {
  if (
    !Array.isArray(value) ||
    !value.every((byte) => Number.isInteger(byte) && byte >= 0 && byte <= 255)
  ) {
    return null;
  }
  return Uint8Array.from(value as number[]);
}

function programmableKind(
  kind: SuiTransactionBlockKind | undefined,
): Extract<
  SuiTransactionBlockKind,
  { kind: "ProgrammableTransaction" | "ProgrammableSystemTransaction" }
> | null {
  return kind?.kind === "ProgrammableTransaction" || kind?.kind === "ProgrammableSystemTransaction"
    ? kind
    : null;
}

function createTransactionProofClient(network: LoginNetwork): TransactionProofClient {
  return new SuiJsonRpcClient({ network, url: getJsonRpcFullnodeUrl(network) });
}

async function verifyDelegateRegistrationTransaction(
  payload: Record<string, unknown>,
  publicKey: Ed25519PublicKey,
  client: TransactionProofClient,
): Promise<void> {
  const digest = transactionDigestField(payload);
  const accountId = objectIdField(payload, "accountId");
  const owner = addressField(payload, "suiAddress");
  const packageId = objectIdField(payload, "memwalPackageId");

  const tx = await client.getTransactionBlock({
    digest,
    options: {
      showEffects: true,
      showEvents: true,
      showInput: true,
      showObjectChanges: true,
    },
  });

  const data = tx.transaction?.data;
  if (!data) {
    throw new LoginCredentialValidationError(
      "delegate registration transaction did not include input data",
    );
  }
  if (tx.effects?.status?.status !== "success") {
    throw new LoginCredentialValidationError("delegate registration transaction did not succeed");
  }
  if (normalizeSuiAddress(data.sender) !== normalizeSuiAddress(owner)) {
    throw new LoginCredentialValidationError("delegate registration sender does not match owner");
  }

  const kind = programmableKind(data.transaction);
  const inputs = kind?.inputs;
  const moveCallTransaction = kind?.transactions.find((transaction) => {
    const call = "MoveCall" in transaction ? transaction.MoveCall : null;
    return (
      call?.module === "account" &&
      call.function === "add_delegate_key" &&
      normalizeSuiObjectId(call.package) === normalizeSuiObjectId(packageId)
    );
  });
  const moveCall =
    moveCallTransaction && "MoveCall" in moveCallTransaction ? moveCallTransaction.MoveCall : null;
  if (!moveCall) {
    throw new LoginCredentialValidationError(
      "delegate registration transaction did not call MemWal add_delegate_key",
    );
  }

  const registeredAccount = inputObjectId(inputForArgument(inputs, moveCall.arguments?.[0]));
  if (normalizeSuiObjectId(registeredAccount ?? "") !== normalizeSuiObjectId(accountId)) {
    throw new LoginCredentialValidationError(
      "delegate registration account does not match payload",
    );
  }

  const publicKeyBytes = pureByteVector(
    inputPureValue(inputForArgument(inputs, moveCall.arguments?.[1])),
  );
  if (!publicKeyBytes || !sameBytes(publicKeyBytes, publicKey.toRawBytes())) {
    throw new LoginCredentialValidationError(
      "delegate registration public key does not match payload",
    );
  }

  const registeredDelegateAddress = inputPureValue(
    inputForArgument(inputs, moveCall.arguments?.[2]),
  );
  if (
    typeof registeredDelegateAddress !== "string" ||
    normalizeSuiAddress(registeredDelegateAddress) !== normalizeSuiAddress(publicKey.toSuiAddress())
  ) {
    throw new LoginCredentialValidationError(
      "delegate registration Sui address does not match payload",
    );
  }
}

export async function validateLoginCredentialPayload(
  payload: Record<string, unknown>,
  expectedNonce: string,
  opts: LoginCredentialValidationOptions = {},
): Promise<void> {
  if (payload.nonce !== expectedNonce) {
    throw new LoginCredentialValidationError("nonce mismatch");
  }

  const delegateKey = stringField(payload, "delegateKey");
  const delegatePublicKey = stringField(payload, "delegatePublicKey");
  objectIdField(payload, "accountId");
  addressField(payload, "suiAddress");
  objectIdField(payload, "memwalPackageId");
  const network = networkField(payload);
  const signature = stringField(payload, "signature");
  transactionDigestField(payload);

  const publicKeyBytes = hexToBytes(delegatePublicKey);
  const privateKeyBytes = hexToBytes(delegateKey);
  let privateKeyPublicBytes: Uint8Array;
  try {
    privateKeyPublicBytes = Ed25519Keypair.fromSecretKey(privateKeyBytes)
      .getPublicKey()
      .toRawBytes();
  } catch {
    throw new LoginCredentialValidationError("delegateKey is not a valid Ed25519 private key");
  }
  if (!sameBytes(privateKeyPublicBytes, publicKeyBytes)) {
    throw new LoginCredentialValidationError("delegateKey does not match delegatePublicKey");
  }

  const publicKey = new Ed25519PublicKey(publicKeyBytes);
  let ok = false;
  try {
    ok = await publicKey.verifyPersonalMessage(textEncoder.encode(expectedNonce), signature);
  } catch {
    throw new LoginCredentialValidationError("delegate signature did not verify nonce");
  }
  if (!ok) {
    throw new LoginCredentialValidationError("delegate signature did not verify nonce");
  }

  const delegateSuiAddress = payload.delegateSuiAddress;
  if (
    typeof delegateSuiAddress === "string" &&
    delegateSuiAddress.length > 0 &&
    publicKey.toSuiAddress() !== delegateSuiAddress
  ) {
    throw new LoginCredentialValidationError("delegate public key does not match delegate address");
  }

  await verifyDelegateRegistrationTransaction(
    payload,
    publicKey,
    opts.client ?? createTransactionProofClient(network),
  );
}
