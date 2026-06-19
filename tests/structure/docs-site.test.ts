import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";

import { ROOT, readJson } from "./helpers";

type DocsPageGroup = {
  group?: string;
  pages?: string[];
};

type DocsTab = {
  tab?: string;
  groups?: DocsPageGroup[];
};

type DocsConfig = {
  $schema?: string;
  favicon?: string;
  name?: string;
  seo?: {
    metatags?: {
      canonical?: string;
    };
  };
  navigation?: {
    tabs?: DocsTab[];
  };
};

const docsPath = (...parts: string[]) => join(ROOT, "apps/docs", ...parts);
const readDocsFile = (rel: string) => readFileSync(docsPath(rel), "utf8");

const collectPages = (config: DocsConfig) =>
  (config.navigation?.tabs ?? []).flatMap((tab) =>
    (tab.groups ?? []).flatMap((group) => group.pages ?? []),
  );

describe("OneMem docs site source", () => {
  test("Mintlify docs.json uses the planned production canonical", () => {
    const config = readJson<DocsConfig>("apps/docs/docs.json");

    assert.equal(config.$schema, "https://mintlify.com/docs.json");
    assert.equal(config.name, "OneMem");
    assert.equal(config.seo?.metatags?.canonical, "https://docs.onemem.xyz");
    assert.equal(config.favicon, "/favicon.svg");
    assert.ok(existsSync(docsPath("favicon.svg")), "configured docs favicon must exist");
  });

  test("Mintlify navigation points only to checked-in MDX pages", () => {
    const config = readJson<DocsConfig>("apps/docs/docs.json");
    const pages = collectPages(config);

    assert.ok(pages.length > 0, "docs navigation must list pages");

    for (const page of pages) {
      const pagePath = docsPath(`${page}.mdx`);
      assert.ok(existsSync(pagePath), `docs navigation page is missing: ${page}.mdx`);
    }
  });

  test("published Node CLI docs keep the verified install boundary explicit", () => {
    for (const rel of ["quickstart.mdx", "reference/cli.mdx"]) {
      const source = readDocsFile(rel);

      assert.match(source, /published `@onemem\/cli@0\.6\.3` install path is\s+verified/);
      assert.match(source, /npm exec --yes --package @onemem\/cli@0\.6\.3 -- onemem --version/);
      assert.match(source, /prints `0\.6\.3`/);
      assert.match(source, /pnpm release:preflight --strict --timeout 30/);
      assert.doesNotMatch(source, /blocked by SDK artifact drift|repo-local CLI/i);
    }
  });

  test("docs README records the hosted docs proof boundary", () => {
    const readme = readDocsFile("README.md");

    assert.match(readme, /Current deployment status, 2026-06-19: live/);
    assert.match(readme, /Vercel `onemem-docs` project/);
    assert.match(readme, /dpl_F4iKnanzYDEq968cbtq1Z3hHNwLb/);
    assert.match(readme, /`\/quickstart`/);
    assert.match(readme, /HTTP 200/);
    assert.match(readme, /not a native\s+Mintlify dashboard deployment/);
    assert.doesNotMatch(readme, /not proven live/i);
    assert.doesNotMatch(readme, /not complete until/i);
  });
});
