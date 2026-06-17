import { randomBytes } from "node:crypto";
import type {
  SuiCallArg,
  SuiTransaction,
  SuiTransactionBlockKind,
  SuiTransactionBlockResponse,
} from "@mysten/sui/jsonRpc";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { describe, expect, it } from "vitest";
import {
  LoginCredentialValidationError,
  validateLoginCredentialPayload,
} from "../src/commands/login.js";

const encoder = new TextEncoder();
const REGISTRATION_DIGEST = "11111111111111111111111111111111";
const MEMWAL_PACKAGE_ID = `0x${"a".repeat(64)}`;

type LoginPayload = Awaited<ReturnType<typeof signedPayload>>;
type ProgrammableKind = Extract<SuiTransactionBlockKind, { kind: "ProgrammableTransaction" }>;

function bytesToHex(bytes: Uint8Array): string {
  return `0x${[...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

async function signedPayload(nonce: string) {
  const privateKey = randomBytes(32);
  const keypair = Ed25519Keypair.fromSecretKey(privateKey);
  return {
    nonce,
    delegateKey: bytesToHex(privateKey),
    delegatePublicKey: bytesToHex(keypair.getPublicKey().toRawBytes()),
    delegateSuiAddress: keypair.getPublicKey().toSuiAddress(),
    accountId: `0x${"1".repeat(64)}`,
    suiAddress: `0x${"2".repeat(64)}`,
    memwalPackageId: MEMWAL_PACKAGE_ID,
    network: "testnet",
    delegateRegistrationDigest: REGISTRATION_DIGEST,
    signature: (await keypair.signPersonalMessage(encoder.encode(nonce))).signature,
  };
}

function registrationInputs(payload: LoginPayload): SuiCallArg[] {
  return [
    {
      type: "object",
      objectId: payload.accountId,
      objectType: "immOrOwnedObject",
      version: "1",
      digest: "digest",
    },
    {
      type: "pure",
      value: Array.from(Buffer.from(payload.delegatePublicKey.slice(2), "hex")),
      valueType: "vector<u8>",
    },
    {
      type: "pure",
      value: payload.delegateSuiAddress,
      valueType: "address",
    },
  ];
}

function registrationCalls(payload: LoginPayload): SuiTransaction[] {
  return [
    {
      MoveCall: {
        package: payload.memwalPackageId,
        module: "account",
        function: "add_delegate_key",
        arguments: [{ Input: 0 }, { Input: 1 }, { Input: 2 }],
      },
    },
  ];
}

function registrationTx(payload: LoginPayload): SuiTransactionBlockResponse {
  return {
    digest: payload.delegateRegistrationDigest,
    effects: { status: { status: "success" } },
    transaction: {
      txSignatures: [],
      data: {
        messageVersion: "v1",
        sender: payload.suiAddress,
        gasData: {
          budget: "0",
          owner: payload.suiAddress,
          payment: [],
          price: "0",
        },
        transaction: {
          kind: "ProgrammableTransaction",
          inputs: registrationInputs(payload),
          transactions: registrationCalls(payload),
        },
      },
    },
  } as SuiTransactionBlockResponse;
}

function transactionData(tx: SuiTransactionBlockResponse) {
  const data = tx.transaction?.data;
  if (!data) throw new Error("test transaction is missing data");
  return data;
}

function programmableData(tx: SuiTransactionBlockResponse): ProgrammableKind {
  const kind = transactionData(tx).transaction;
  if (kind.kind !== "ProgrammableTransaction") {
    throw new Error("test transaction is not programmable");
  }
  return kind;
}

function withSender(tx: SuiTransactionBlockResponse, sender: string): SuiTransactionBlockResponse {
  const data = transactionData(tx);
  return {
    ...tx,
    transaction: { txSignatures: tx.transaction?.txSignatures ?? [], data: { ...data, sender } },
  };
}

function withProgrammable(
  tx: SuiTransactionBlockResponse,
  patch: Partial<ProgrammableKind>,
): SuiTransactionBlockResponse {
  const data = transactionData(tx);
  const kind = programmableData(tx);
  return {
    ...tx,
    transaction: {
      txSignatures: tx.transaction?.txSignatures ?? [],
      data: { ...data, transaction: { ...kind, ...patch } },
    },
  };
}

function proofClient(tx: SuiTransactionBlockResponse) {
  return {
    async getTransactionBlock() {
      return tx;
    },
  };
}

function validate(payload: LoginPayload, tx = registrationTx(payload)) {
  return validateLoginCredentialPayload(payload, payload.nonce, {
    client: proofClient(tx),
  });
}

describe("validateLoginCredentialPayload", () => {
  it("accepts a nonce signed by the submitted delegate key with matching on-chain proof", async () => {
    const payload = await signedPayload("abc123");
    await expect(validate(payload)).resolves.toBe(undefined);
  });

  it("rejects a delegate private key that does not match the submitted public key", async () => {
    const payload = await signedPayload("abc123");
    await expect(
      validate({ ...payload, delegateKey: bytesToHex(randomBytes(32)) }),
    ).rejects.toThrow(/delegateKey does not match delegatePublicKey/);
  });

  it("rejects a registration transaction sent by another owner", async () => {
    const payload = await signedPayload("abc123");
    await expect(
      validate(payload, withSender(registrationTx(payload), `0x${"3".repeat(64)}`)),
    ).rejects.toThrow(/sender does not match owner/);
  });

  it("rejects a registration transaction for another account", async () => {
    const payload = await signedPayload("abc123");
    await expect(
      validate(
        payload,
        withProgrammable(registrationTx(payload), {
          inputs: [
            {
              type: "object",
              objectId: `0x${"3".repeat(64)}`,
              objectType: "immOrOwnedObject",
              version: "1",
              digest: "digest",
            },
          ],
        }),
      ),
    ).rejects.toThrow(/account does not match payload/);
  });

  it("rejects a registration transaction for another delegate public key", async () => {
    const payload = await signedPayload("abc123");
    const inputs = registrationInputs(payload);
    await expect(
      validate(
        payload,
        withProgrammable(registrationTx(payload), {
          inputs: [inputs[0], { type: "pure", value: [9, 9, 9], valueType: "vector<u8>" }],
        }),
      ),
    ).rejects.toThrow(/public key does not match payload/);
  });

  it("rejects a registration transaction for another delegate Sui address", async () => {
    const payload = await signedPayload("abc123");
    const inputs = registrationInputs(payload);
    await expect(
      validate(
        payload,
        withProgrammable(registrationTx(payload), {
          inputs: [
            inputs[0],
            inputs[1],
            { type: "pure", value: `0x${"3".repeat(64)}`, valueType: "address" },
          ],
        }),
      ),
    ).rejects.toThrow(/Sui address does not match payload/);
  });

  it("rejects a registration transaction with the wrong Move target", async () => {
    const payload = await signedPayload("abc123");
    await expect(
      validate(
        payload,
        withProgrammable(registrationTx(payload), {
          transactions: [
            {
              MoveCall: {
                package: payload.memwalPackageId,
                module: "account",
                function: "remove_delegate_key",
                arguments: [{ Input: 0 }, { Input: 1 }, { Input: 2 }],
              },
            },
          ],
        }),
      ),
    ).rejects.toThrow(/did not call MemWal add_delegate_key/);
  });

  it("rejects a registration transaction from the wrong MemWal package", async () => {
    const payload = await signedPayload("abc123");
    await expect(
      validate(
        payload,
        withProgrammable(registrationTx(payload), {
          transactions: [
            {
              MoveCall: {
                package: `0x${"b".repeat(64)}`,
                module: "account",
                function: "add_delegate_key",
                arguments: [{ Input: 0 }, { Input: 1 }, { Input: 2 }],
              },
            },
          ],
        }),
      ),
    ).rejects.toThrow(/did not call MemWal add_delegate_key/);
  });

  it("rejects a failed registration transaction", async () => {
    const payload = await signedPayload("abc123");
    await expect(
      validate(payload, {
        ...registrationTx(payload),
        effects: { status: { status: "failure", error: "nope" } },
      }),
    ).rejects.toThrow(/did not succeed/);
  });

  it("rejects a registration transaction without input data", async () => {
    const payload = await signedPayload("abc123");
    await expect(
      validate(payload, { ...registrationTx(payload), transaction: undefined }),
    ).rejects.toThrow(/did not include input data/);
  });

  it("rejects missing or invalid registration proof fields", async () => {
    const payload = await signedPayload("abc123");
    await expect(validate({ ...payload, delegateRegistrationDigest: undefined })).rejects.toThrow(
      /delegateRegistrationDigest/,
    );
    await expect(validate({ ...payload, delegateRegistrationDigest: "abc123" })).rejects.toThrow(
      /valid Sui digest/,
    );
    await expect(validate({ ...payload, memwalPackageId: undefined })).rejects.toThrow(
      /memwalPackageId/,
    );
    await expect(validate({ ...payload, memwalPackageId: "abc" })).rejects.toThrow(
      /memwalPackageId/,
    );
    await expect(validate({ ...payload, network: undefined })).rejects.toThrow(/network/);
    await expect(validate({ ...payload, network: "sneaky" })).rejects.toThrow(/network must be/);
  });

  it("rejects malformed local credential fields", async () => {
    const payload = await signedPayload("abc123");
    await expect(validate({ ...payload, delegateKey: "xyz" })).rejects.toThrow(
      /key material must be hex/,
    );
    await expect(validate({ ...payload, delegatePublicKey: "xyz" })).rejects.toThrow(
      /key material must be hex/,
    );
    await expect(validate({ ...payload, suiAddress: "abc" })).rejects.toThrow(/suiAddress/);
    await expect(validate({ ...payload, accountId: "abc" })).rejects.toThrow(/accountId/);
  });

  it("rejects a nonce mismatch before writing credentials", async () => {
    const payload = await signedPayload("abc123");
    await expect(validateLoginCredentialPayload(payload, "different")).rejects.toBeInstanceOf(
      LoginCredentialValidationError,
    );
  });

  it("rejects a signature that does not verify the expected nonce", async () => {
    const payload = await signedPayload("abc123");
    const otherKeypair = Ed25519Keypair.generate();
    const wrongSignature = (await otherKeypair.signPersonalMessage(encoder.encode(payload.nonce)))
      .signature;
    await expect(
      validateLoginCredentialPayload({ ...payload, signature: wrongSignature }, payload.nonce),
    ).rejects.toThrow(/delegate signature did not verify nonce/);
  });

  it("rejects a delegate address that does not match the public key", async () => {
    const payload = {
      ...(await signedPayload("abc123")),
      delegateSuiAddress: `0x${"3".repeat(64)}`,
    };
    await expect(validateLoginCredentialPayload(payload, payload.nonce)).rejects.toThrow(
      /does not match delegate address/,
    );
  });

  it("rejects missing required credential fields", async () => {
    await expect(validateLoginCredentialPayload({ nonce: "abc123" }, "abc123")).rejects.toThrow(
      /delegateKey/,
    );
  });
});
