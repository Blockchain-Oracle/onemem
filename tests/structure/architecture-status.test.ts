import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";

import { ROOT } from "./helpers";

function readText(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

function assertBuiltRow(doc: string, label: string): void {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  assert.doesNotMatch(
    doc,
    new RegExp(`\\|\\s*${escaped}\\s*\\|\\s*⏳ pending`, "i"),
    `${label} must not regress to a stale pending status`,
  );
}

describe("architecture implementation status docs", () => {
  test("protocol README does not mark built Move components pending", () => {
    const protocol = readText("docs/05-our-architecture/01-protocol/README.md");
    for (const label of [
      "Move package skeleton",
      "`MemoryNamespace` struct",
      "`TraceSession` struct",
      "`ActionCall` struct \\+ Merkle chain",
      "`NamespaceCapability` \\+ transfer",
      "`seal_approve` policy",
      "`event::emit_authenticated` events",
      "Upgrade dynamic field",
      "Testnet deployment",
    ]) {
      assertBuiltRow(protocol, label);
    }

    assert.match(protocol, /package v2/i);
    assert.match(protocol, /0xc2e839c719e1c61222440f5661199e68de5413d8cfb49dd8bae3223e92fcf138/);
    assert.match(protocol, /\| Mainnet deployment \| ⏳ pending;/);
  });

  test("SDK README separates built source from registry gaps", () => {
    const sdks = readText("docs/05-our-architecture/02-sdks/README.md");
    for (const label of [
      "`@onemem/sdk-ts` skeleton",
      "`@onemem/sdk-ts` namespace ops",
      "`@onemem/sdk-ts` trace emit",
      "`@onemem/sdk-ts` published to npm",
      "`onemem-sdk-python` skeleton",
    ]) {
      assertBuiltRow(sdks, label);
    }

    assert.match(sdks, /Current on npm at `0\.6\.0`/);
    assert.match(sdks, /Built repo-locally at `0\.2\.0`/);
    assert.match(sdks, /Partial; read\/verify and memory bridge helpers are present/);
    assert.match(sdks, /\| `onemem-sdk-python` published to PyPI \| ⏳ pending;/);
  });

  test("architecture overview routes readers to current scoped status", () => {
    const overview = readText("docs/05-our-architecture/README.md");
    assert.match(overview, /Current Status Orientation/);
    assert.match(overview, /\| `01-protocol\/` \| Built \+ testnet deployed \|/);
    assert.match(overview, /\| `02-sdks\/` \| TS built\/published; Python source built \|/);
    assert.match(overview, /mainnet remains pending/i);
    assert.match(overview, /missing from PyPI/i);
  });

  test("reference maps do not describe current architecture as not started", () => {
    const canonical = readText("docs/06-references/CANONICAL_URLS.md");
    const projectMap = readText(".thoughts/wiki/project-map.md");

    assert.doesNotMatch(canonical, /05-our-architecture\/\*`?\s+—\s+design phase \(not yet started\)/i);
    assert.match(canonical, /current scoped architecture status/);

    assert.doesNotMatch(projectMap, /older architecture docs still contain design-phase/i);
    assert.match(projectMap, /architecture entry points now carry current scoped status/i);
  });
});
