import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";

import { ROOT, readJson } from "./helpers";

type PackageJson = {
  name: string;
  version: string;
};

const readText = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

const pyprojectVersion = (rel: string): string => {
  const match = readText(rel).match(/^version = "([^"]+)"$/m);
  assert.ok(match, `${rel} must declare a project version`);
  return match[1];
};

describe("OneMem monorepo structure", () => {
  describe("release artifacts", () => {
    test("provider versions advance past stale published memory-helper artifacts", () => {
      const vercel = readJson<PackageJson>("packages/provider-vercel-ai/package.json");
      const openai = readJson<PackageJson>("packages/provider-openai-agents/package.json");

      assert.equal(vercel.version, "0.1.2");
      assert.equal(openai.version, "0.1.3");

      const pythonProviders = [
        [
          "packages/provider-crewai/pyproject.toml",
          "packages/provider-crewai/onemem_crewai/__init__.py",
        ],
        [
          "packages/provider-livekit/pyproject.toml",
          "packages/provider-livekit/onemem_livekit/__init__.py",
        ],
        [
          "packages/provider-elevenlabs/pyproject.toml",
          "packages/provider-elevenlabs/onemem_elevenlabs/__init__.py",
        ],
      ];

      for (const [pyproject, initFile] of pythonProviders) {
        assert.equal(pyprojectVersion(pyproject), "0.1.1");
        assert.match(readText(initFile), /__version__ = "0\.1\.1"/);
      }
    });

    test("python provider packages require the SDK memory bridge version", () => {
      const pyprojects = [
        "packages/provider-crewai/pyproject.toml",
        "packages/provider-livekit/pyproject.toml",
        "packages/provider-elevenlabs/pyproject.toml",
      ];

      for (const pyproject of pyprojects) {
        assert.match(readText(pyproject), /"onemem-sdk-python>=0\.2\.0"/);
      }
    });

    test("release preflight checks published artifacts for memory helper markers", () => {
      const script = readText("scripts/check-release-preflight.py");

      assert.match(script, /ARTIFACT_MARKERS/);
      assert.match(script, /createOneMemMemory/);
      assert.match(script, /create_onemem_memory/);
      assert.match(script, /artifact-drift/);
      assert.match(script, /tarfile/);
      assert.match(script, /ZipFile/);
    });

    test("framework docs distinguish local package truth from stale registry artifacts", () => {
      const docs = readText("docs/05-our-architecture/04-frameworks/README.md");

      for (const version of ["0.1.2", "0.1.3"]) {
        assert.match(docs, new RegExp(`local \`${version}\` pending publish`));
      }
      assert.match(docs, /npm `0\.1\.1` artifact lacks explicit memory helper/);
      assert.match(docs, /npm `0\.1\.2` artifact lacks explicit memory helper/);
      assert.match(docs, /PyPI `0\.1\.0` artifact lacks explicit memory helper/);
    });
  });
});
