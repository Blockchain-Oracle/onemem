import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { exists, isDir } from "./helpers";

describe("OneMem monorepo structure", () => {
  describe("Context Engineering artifacts (reset seed)", () => {
    for (const f of [
      ".thoughts/wiki/index.md",
      ".thoughts/plans/2026-06-19-onemem-reset-plan.md",
      ".thoughts/research/2026-06-19-reality-brief.md",
      ".thoughts/research/2026-06-19-cleanup-audit.md",
      ".thoughts/SALVAGE-2026-06-19.md",
    ]) {
      test(`Context Engineering artifact exists: ${f}`, () => {
        assert.ok(exists(f), `${f} missing`);
      });
    }

    for (const d of [".thoughts", ".thoughts/wiki", ".thoughts/plans", ".thoughts/research"]) {
      test(`Context Engineering directory exists: ${d}`, () => {
        assert.ok(isDir(d), `${d} missing`);
      });
    }
  });
});
