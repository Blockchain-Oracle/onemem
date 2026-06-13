// TIRE-KICK: prove a real Seal encrypt→decrypt round-trip through our deployed
// onemem::seal_policy::seal_approve on testnet. Not committed.
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { SealClient, SessionKey } from "@mysten/seal";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { fromHex } from "@mysten/sui/utils";

import { NamespaceKind, OneMem } from "./src/index.js";

function kp() {
  const entries = JSON.parse(
    readFileSync(join(homedir(), ".sui", "sui_config", "sui.keystore"), "utf8"),
  ) as string[];
  return Ed25519Keypair.fromSecretKey(Buffer.from(entries[0]!, "base64").subarray(1));
}
const strip = (h: string) => (h.startsWith("0x") ? h.slice(2) : h);

const signer = kp();
const onemem = await OneMem.create({ network: "testnet", signer });
const pkg = onemem.addresses.packageId;
console.log("package:", pkg);

console.log("creating namespace + RW cap (sealPackageId = our package)...");
const ns = await onemem.namespaces.create({
  name: `seal-${Date.now().toString(36)}`,
  kind: NamespaceKind.User,
  sealPackageId: pkg,
});
await onemem.client.waitForTransaction({ digest: ns.txDigest });
const rw = await onemem.namespaces.shareReadWrite({
  namespaceId: ns.namespaceId,
  adminCapId: ns.adminCapId,
  recipient: signer.toSuiAddress(),
});
console.log("namespace:", ns.namespaceId, "rwCap:", rw.capId);

const sealClient = new SealClient({
  suiClient: onemem.client as never,
  serverConfigs: [
    {
      objectId: "0xb012378c9f3799fb5b1a7083da74a4069e3c3f1c93de0b27212a5799ce1e1e98",
      aggregatorUrl: "https://seal-aggregator-testnet.mystenlabs.com",
      weight: 1,
    },
  ],
  verifyKeyServers: false,
});

const id = strip(ns.namespaceId); // opaque to seal_approve; reused for decrypt
const data = new TextEncoder().encode(`onemem seal secret ${Date.now()}`);

console.log("encrypting...");
const { encryptedObject } = await sealClient.encrypt({
  threshold: 1,
  packageId: pkg,
  id,
  data,
});
console.log("encrypted bytes:", encryptedObject.length);

console.log("building seal_approve PTB + session key...");
const tx = new Transaction();
tx.moveCall({
  target: `${pkg}::seal_policy::seal_approve`,
  typeArguments: [`${pkg}::namespace::ReadWrite`],
  arguments: [
    tx.pure.vector("u8", fromHex(id)),
    tx.object(ns.namespaceId),
    tx.object(rw.capId),
  ],
});
const txBytes = await tx.build({ client: onemem.client as never, onlyTransactionKind: true });

const sk = await SessionKey.create({
  address: signer.toSuiAddress(),
  packageId: pkg,
  ttlMin: 10,
  suiClient: onemem.client as never,
});
const { signature } = await signer.signPersonalMessage(sk.getPersonalMessage());
sk.setPersonalMessageSignature(signature);

console.log("decrypting...");
const decrypted = await sealClient.decrypt({ data: encryptedObject, sessionKey: sk, txBytes });
const ok = new TextDecoder().decode(decrypted) === new TextDecoder().decode(data);
console.log("ROUND-TRIP OK:", ok);
