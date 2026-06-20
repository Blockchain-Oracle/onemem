import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  MemWalDurableStore,
  observationText,
  projectNamespace,
  resolveDurableConfig,
  summaryText,
} from "./durable.js";
import type { Observation, Summary } from "./store.js";

const dirs: string[] = [];
function tempCreds(content: unknown): string {
  const dir = mkdtempSync(join(tmpdir(), "onemem-creds-"));
  dirs.push(dir);
  const path = join(dir, "credentials.json");
  writeFileSync(path, JSON.stringify(content));
  return path;
}

afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe("resolveDurableConfig", () => {
  it("prefers env vars", () => {
    const cfg = resolveDurableConfig(
      { ONEMEM_DELEGATE_KEY: "k", ONEMEM_ACCOUNT_ID: "0xacc", MEMWAL_RELAYER_URL: "https://r" },
      tempCreds({ delegateKey: "other", accountId: "0xother" }),
    );
    expect(cfg).toEqual({ key: "k", accountId: "0xacc", serverUrl: "https://r" });
  });

  it("falls back to ~/.onemem/credentials.json", () => {
    const path = tempCreds({
      delegateKey: "dk",
      accountId: "0xfromfile",
      relayerUrl: "https://relay",
    });
    const cfg = resolveDurableConfig({}, path);
    expect(cfg).toEqual({ key: "dk", accountId: "0xfromfile", serverUrl: "https://relay" });
  });

  it("returns null when neither env nor creds provide delegate+account", () => {
    expect(resolveDurableConfig({}, join(tmpdir(), "does-not-exist.json"))).toBeNull();
  });

  it("MemWalDurableStore.available reflects config presence", () => {
    expect(new MemWalDurableStore({ key: "k", accountId: "0xa" }).available()).toBe(true);
  });
});

describe("namespace + text formatters", () => {
  it("scopes a project namespace", () => {
    expect(projectNamespace("onemem")).toBe("cm:onemem");
    expect(projectNamespace(null)).toBe("cm:default");
  });

  it("renders readable, embeddings-friendly observation text", () => {
    const o: Observation = {
      id: 1,
      sessionId: "s",
      seq: 1,
      type: "bugfix",
      title: "Release sockets on error",
      subtitle: "Stops the pool leaking under load",
      facts: ["Pool max was 10", "Sockets leaked on the error path"],
      narrative: "Released sockets in the error path.",
      concepts: ["problem-solution"],
      filesRead: [],
      filesModified: ["src/pool.ts"],
      contentHash: "h",
      blobId: null,
      createdAt: 1,
    };
    const text = observationText(o);
    expect(text).toContain("[bugfix] Release sockets on error");
    expect(text).toContain("Stops the pool leaking under load");
    expect(text).toContain("- Pool max was 10");
    expect(text).toContain("Files modified: src/pool.ts");
  });

  it("renders a summary into labeled sections, skipping empties", () => {
    const s: Summary = {
      id: 1,
      sessionId: "s",
      request: "Build it",
      investigated: null,
      learned: "x",
      completed: "done",
      nextSteps: null,
      notes: null,
      contentHash: "h",
      blobId: null,
      createdAt: 1,
    };
    const text = summaryText(s);
    expect(text).toContain("Request: Build it");
    expect(text).toContain("Learned: x");
    expect(text).toContain("Completed: done");
    expect(text).not.toContain("Investigated:");
    expect(text).not.toContain("Next steps:");
  });
});
