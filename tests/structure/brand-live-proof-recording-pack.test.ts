import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";
import { exists, ROOT, readJson } from "./helpers";

type MediaKit = {
  proofBoundary: string;
  guardrails: string[];
};

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

describe("brand live-proof cleanup boundary", () => {
  test("old live-proof video workspace files are removed", () => {
    for (const rel of [
      "packages/brand/video/onemem-demo/notes/live-proof-recording-pack.generated.md",
      "packages/brand/video/onemem-demo/notes/live-proof-readiness.generated.json",
      "packages/brand/video/onemem-demo/notes/live-proof-shotlist.generated.md",
      "packages/brand/video/onemem-demo/public/footage/live-proof-manifest.example.json",
      "packages/brand/video/onemem-demo/scripts/live-proof-operator.mjs",
      "packages/brand/video/onemem-demo/scripts/verify-live-proof-footage.mjs",
    ]) {
      assert.equal(exists(rel), false, `${rel} should stay removed`);
    }
  });

  test("brand docs keep final proof boundary explicit without old workflow paths", () => {
    const docs = [
      read("packages/brand/README.md"),
      read("packages/brand/ASSET_CLEANUP.md"),
      read("packages/brand/media-kit/onemem-media-kit.generated.md"),
      read("packages/brand/media-kit/onemem-media-kit.generated.html"),
    ].join("\n");

    assert.match(docs, /not final live proof|not packaged|separate approved capture/i);
    assert.match(docs, /designer-campaign\/exports\/video\/onemem-launch-30s\.mp4/);
    assert.doesNotMatch(docs, /live-proof-operator|footage:operator|footage:verify-live/);
    assert.doesNotMatch(docs, /video\/onemem-demo\/public\/footage/);
    assert.doesNotMatch(docs, /OpenClaude|onemem\.ai|docs\.onemem\.ai/i);
  });

  test("media kit guardrails no longer package dashboard-capture proof workflow", () => {
    const kit = readJson<MediaKit>("packages/brand/media-kit/onemem-media-kit.generated.json");
    assert.match(kit.proofBoundary, /Brand media is not final live proof/i);
    assert.ok(kit.guardrails.some((item) => /brand launch media final live proof/i.test(item)));

    const json = read("packages/brand/media-kit/onemem-media-kit.generated.json");
    assert.doesNotMatch(json, /demo-proof-workflow|video-source|sound-design/);
    assert.doesNotMatch(json, /video\/onemem-demo|video\/onemem-intro/);
  });
});
