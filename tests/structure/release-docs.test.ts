import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";

import { ROOT } from "./helpers";

describe("OneMem monorepo structure", () => {
  describe("release docs", () => {
    test("release docs route Python publishing to the real script", () => {
      const docs = [
        ".changeset/README.md",
        "docs/05-our-architecture/00-overview/TOOLING_DECISIONS.md",
      ];
      for (const doc of docs) {
        const content = readFileSync(join(ROOT, doc), "utf8");
        assert.match(
          content,
          /scripts\/publish-all\.sh/,
          `${doc} must point at scripts/publish-all.sh`,
        );
        assert.doesNotMatch(
          content,
          /publish-python\.py/,
          `${doc} must not reference missing publish-python.py`,
        );
        assert.doesNotMatch(
          content,
          /reads? (?:the )?(?:same )?changeset metadata|reads? (?:the )?note metadata/i,
          `${doc} must not claim unimplemented changeset metadata parsing`,
        );
      }
    });

    test("changeset release docs explain registry credential gates", () => {
      const content = readFileSync(join(ROOT, ".changeset/README.md"), "utf8");
      assert.match(content, /NPM_TOKEN/, "release docs must name the npm token gate");
      assert.match(
        content,
        /ONEMEM_NPM_TRUSTED_PUBLISHING/,
        "release docs must name the trusted-publishing opt-in",
      );
      assert.match(content, /PYPI_TOKEN/, "release docs must name the PyPI token gate");
      assert.match(
        content,
        /does not mean npm\s+or PyPI packages were published/i,
        "release docs must not let green Release runs imply registry publication",
      );
      assert.match(
        content,
        /npm view @onemem\/codex-plugin version/,
        "release docs must require registry lookup before publication claims",
      );
    });
  });
});
