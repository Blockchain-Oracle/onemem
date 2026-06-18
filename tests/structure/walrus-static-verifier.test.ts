import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";

import { ROOT, readJson } from "./helpers";

const verifierDir = "apps/hosted-dashboard/walrus-sites/verifier";
const verifierPath = (name: string) => join(ROOT, verifierDir, name);
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

interface NetworksJson {
  networks: {
    testnet: {
      package_id: string;
      rpc_url: string;
      suiscan_base: string;
    };
    mainnet: {
      package_id: string;
    };
  };
}

describe("Walrus Sites static verifier", () => {
  test("checked-in artifact has the files site-builder can deploy", () => {
    for (const name of ["index.html", "styles.css", "app.js", "ws-resources.json"]) {
      assert.ok(existsSync(verifierPath(name)), `${name} must exist in ${verifierDir}`);
    }
    const index = readFileSync(verifierPath("index.html"), "utf8");
    assert.match(index, /Public Trace Verifier/);
    assert.match(index, /id="sessionId"/);
    assert.match(index, /href="\/styles\.css"/, "assets must work from /verify/<id>");
    assert.match(index, /src="\/app\.js"/, "assets must work from /verify/<id>");
    assert.doesNotMatch(index, /https:\/\/cdn|unpkg|jsdelivr/);
  });

  test("browser verifier performs real Sui trace verification", () => {
    const networks = readJson<NetworksJson>("config/networks.json");
    const app = readFileSync(verifierPath("app.js"), "utf8");
    assert.match(app, /sui_getObject/);
    assert.match(app, /suix_queryEvents/);
    assert.match(app, /ActionCallEmittedEvent/);
    assert.match(app, /crypto\.subtle\.digest\("SHA-256"/);
    assert.match(app, /prevHash/);
    assert.match(app, /countMatches/);
    assert.match(app, /location\.pathname\.match/);
    assert.match(app, /pathSession/);
    assert.match(app, new RegExp(networks.networks.testnet.package_id));
    assert.match(app, new RegExp(networks.networks.testnet.rpc_url.replaceAll(".", "\\.")));
    assert.doesNotMatch(app, /packageId: ""[\s\S]*enabled: true/);
  });

  test("Walrus resource metadata routes verifier URLs to the shell", () => {
    const resources = readJson<{
      headers: Record<string, Record<string, string>>;
      routes: Record<string, string>;
      site_name: string;
    }>(`${verifierDir}/ws-resources.json`);
    assert.equal(resources.headers["/index.html"]?.["Content-Type"], "text/html; charset=utf-8");
    assert.equal(resources.headers["/styles.css"]?.["Content-Type"], "text/css; charset=utf-8");
    assert.equal(
      resources.headers["/app.js"]?.["Content-Type"],
      "application/javascript; charset=utf-8",
    );
    assert.equal(resources.routes["/verify"], "/index.html");
    assert.equal(resources.routes["/verify/*"], "/index.html");
    assert.equal(resources.site_name, "OneMem Public Verifier");
  });

  test("deploy script and workflow default to the verifier artifact", () => {
    const script = read("scripts/deploy-walrus-sites.sh");
    const workflow = read(".github/workflows/deploy-walrus-sites.yml");
    assert.match(script, new RegExp(`WALRUS_DIST:-${verifierDir}`));
    assert.match(script, /static[\s#]+public verifier shell/);
    assert.match(workflow, new RegExp(`default: "${verifierDir}"`));
    assert.match(workflow, /Deploy static OneMem verifier to Walrus Sites/);
    assert.doesNotMatch(workflow, /Build hosted-dashboard/);
    assert.doesNotMatch(workflow, /pnpm install --frozen-lockfile/);
  });

  test("docs keep full dashboard mirror separate from verifier shell", () => {
    const readme = read("apps/hosted-dashboard/walrus-sites/README.md");
    const architecture = read("docs/05-our-architecture/06-dashboard/walrus-sites-mirror.md");
    assert.match(readme, /current checked-in artifact is a small public verifier shell/i);
    assert.match(architecture, /full dashboard mirror remains future work/i);
    assert.match(architecture, /It does not prove plaintext content/);
    assert.doesNotMatch(readme, /apps\/hosted-dashboard\/out/);
  });
});
