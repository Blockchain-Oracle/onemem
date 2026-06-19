#!/usr/bin/env node

import { spawn } from "node:child_process";
import { access, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const here = dirname(fileURLToPath(import.meta.url));
const root = dirname(here);
const defaultPort = Number(process.env.ONEMEM_HOSTED_SMOKE_PORT || 4056);
const providedBaseUrl = process.env.ONEMEM_HOSTED_SMOKE_BASE_URL;
const baseUrl = providedBaseUrl || `http://127.0.0.1:${defaultPort}`;
const headless = process.env.ONEMEM_HOSTED_SMOKE_HEADLESS !== "0";
const artifactsDir = join(root, ".browser-smoke");
const screenshotPath = join(artifactsDir, "hosted-sponsored-provisioning.png");
const verifySmokeSession =
  process.env.ONEMEM_HOSTED_VERIFY_SMOKE_SESSION ||
  "0x6ceaab0fe2961043d490326960dfd192e43c25ed655772d42c04c265ad3ec080";
const missingShareCapability = `0x${"5".repeat(64)}`;

const checks = [];
const consoleErrors = [];
const resourceErrors = [];
let server = null;

try {
  await mkdir(artifactsDir, { recursive: true });
  if (!providedBaseUrl) {
    server = startServer(defaultPort);
    await waitForServer(baseUrl, 45_000);
    await expectMissingSponsorshipConfig(baseUrl);
    await expectMissingShareSponsorshipConfig(baseUrl);
  }
  const authUi = await readAuthUiConfig(baseUrl);

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage({ viewport: { width: 1360, height: 920 } });
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => consoleErrors.push(err.message));
    page.on("response", (res) => {
      if (res.status() >= 400) resourceErrors.push(`${res.status()} ${res.url()}`);
    });

    await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
    await expectText(page, "Sign in", "login title");
    await expectText(page, authUi.connectText, "login connect button");
    await expectText(page, "No account connected yet", "login disconnected state");
    await expectText(page, authUi.statusText, "login enoki config state");

    await page.goto(`${baseUrl}/onboarding`, { waitUntil: "networkidle" });
    await expectText(page, "Connect an account", "onboarding account step");
    await expectText(page, "No account connected yet", "onboarding disconnected state");
    await expectText(page, "Connect before continuing", "onboarding gate copy");

    await expectCliLoginLookup(baseUrl);
    await page.goto(`${baseUrl}/cli-login?nonce=smoke-nonce&port=12345`, {
      waitUntil: "networkidle",
    });
    await expectText(page, "Pair your terminal", "cli-login title");
    await expectText(page, authUi.connectText, "cli-login connect button");
    await expectText(page, "Device nonce", "cli-login nonce row");
    await expectText(page, "smoke-nonce", "cli-login nonce value");
    await expectText(page, "localhost:12345", "cli-login callback port");
    await expectText(page, "Connect the wallet", "cli-login disconnected gate");
    await expectText(page, "not stored in this hosted app", "cli-login private key copy");

    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });
    await expectText(page, "OneMem Dashboard", "dashboard title");
    await expectText(page, "Connect an account", "dashboard account gate");
    await expectText(page, "public verification work without an account", "dashboard public verify copy");
    if (!authUi.publicEnvConfigured) {
      await expectText(page, "Google sign-in is not enabled", "dashboard enoki config state");
    }

    await page.goto(`${baseUrl}/share`, { waitUntil: "networkidle" });
    await expectText(page, "Share", "share title");
    await expectText(page, "Public verification link", "share public verify card");
    await expectText(page, "Sponsored capability mint", "share sponsored mint card");
    await expectText(page, "Connect an account before minting", "share account gate");
    await expectText(page, "Mint sponsored capability", "share mint button");
    await expectText(page, "Capability history", "share capability history panel");
    await expectText(page, "event-backed share history", "share history empty state");
    await expectText(page, "Boundary", "share proof boundary");
    await expectText(page, "Recipient capability links", "share recipient link boundary");
    await expectText(page, "no separate claim transaction", "share no-claim boundary");

    await page.goto(`${baseUrl}/share/${missingShareCapability}`, { waitUntil: "networkidle" });
    await expectText(page, "share capability", "share capability public badge");
    await expectText(page, "Capability not found", "share capability missing title");
    await expectText(page, "No NamespaceCapability", "share capability missing reason");
    await expectText(page, "Open share tools", "share capability fallback link");

    await page.goto(`${baseUrl}/verify/${verifySmokeSession}`, { waitUntil: "networkidle" });
    await expectText(page, "public verifier", "verify public badge");
    await expectText(page, "What this proves, and what it does not", "verify proof boundary");
    await expectText(page, "Proven", "verify proven panel");
    await expectText(page, "Not proven", "verify not-proven panel");
    await expectText(page, "Call Evidence", "verify call evidence");
    await expectText(page, "View TraceSession on Suiscan", "verify suiscan link");

    await page.screenshot({ fullPage: true, path: screenshotPath });
    check(resourceErrors.length === 0, "browser emitted no failed resource responses");
    check(consoleErrors.length === 0, "browser console emitted no errors");
  } finally {
    await browser.close();
  }

  await writeFile(
    join(artifactsDir, "last-run.json"),
    `${JSON.stringify({ baseUrl, checks, screenshotPath }, null, 2)}\n`,
  );
  console.log(`[hosted-browser-smoke] passed ${checks.length} checks`);
  for (const item of checks) console.log(`  - ${item}`);
  console.log(`[hosted-browser-smoke] screenshot ${screenshotPath}`);
} catch (err) {
  console.error(
    `[hosted-browser-smoke] failed: ${err instanceof Error ? err.message : String(err)}`,
  );
  if (consoleErrors.length > 0) {
    console.error("[hosted-browser-smoke] browser console errors:");
    for (const line of consoleErrors) console.error(`  - ${line}`);
  }
  if (resourceErrors.length > 0) {
    console.error("[hosted-browser-smoke] failed browser resources:");
    for (const line of resourceErrors) console.error(`  - ${line}`);
  }
  process.exitCode = 1;
} finally {
  if (server) await stopServer(server);
}

function startServer(port) {
  const child = spawn("pnpm", ["exec", "next", "dev", "-p", String(port)], {
    cwd: root,
    env: { ...process.env, ENOKI_PRIVATE_KEY: "", ENOKI_SECRET_KEY: "", PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", (chunk) => process.stdout.write(prefix(chunk, "next")));
  child.stderr.on("data", (chunk) => process.stderr.write(prefix(chunk, "next")));
  return child;
}

async function waitForServer(url, timeoutMs) {
  const started = Date.now();
  let lastError = "";
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.status < 500) return;
      lastError = `HTTP ${res.status}`;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
    await delay(500);
  }
  throw new Error(`hosted dashboard server not ready at ${url}: ${lastError}`);
}

async function launchBrowser() {
  const executablePath = await findBrowserExecutable();
  if (executablePath) {
    return chromium.launch({
      executablePath,
      headless,
      args: ["--disable-dev-shm-usage"],
    });
  }
  try {
    return await chromium.launch({ channel: "chrome", headless });
  } catch (err) {
    throw new Error(
      `Chrome/Chromium is required for hosted smoke. Set ONEMEM_BROWSER_EXECUTABLE to a browser binary. Last launch error: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
}

async function findBrowserExecutable() {
  const candidates = [
    process.env.ONEMEM_BROWSER_EXECUTABLE,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Keep looking.
    }
  }
  return null;
}

async function expectText(page, text, label) {
  await page.getByText(text, { exact: false }).first().waitFor({ timeout: 30_000 });
  check(true, label);
}

async function readAuthUiConfig(url) {
  const res = await fetch(`${url}/api/enoki/status`);
  const body = await res.json();
  check(res.status === 200, "enoki status endpoint reachable");
  const serialized = JSON.stringify(body);
  check(!serialized.includes("ENOKI_PRIVATE_KEY="), "enoki status does not leak private key");
  check(!serialized.includes("ENOKI_SECRET_KEY="), "enoki status does not leak legacy secret key");
  const publicEnvConfigured = Boolean(body?.publicEnv?.configured);
  return {
    publicEnvConfigured,
    connectText: publicEnvConfigured ? "Connect wallet or Google" : "Connect Sui wallet",
    statusText: publicEnvConfigured
      ? "Enoki Google wallets are registered"
      : "Google sign-in is not enabled",
  };
}

async function expectMissingSponsorshipConfig(url) {
  const sender = `0x${"1".padStart(64, "0")}`;
  const res = await fetch(`${url}/api/onboarding/sponsored/prepare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "namespace-create", sender }),
  });
  const body = await res.json();
  check(res.status === 503, "sponsored prepare reports missing private key");
  check(body?.code === "not_configured", "sponsored prepare missing-config code");
  check(!JSON.stringify(body).includes("ENOKI_SECRET_KEY="), "sponsored prepare does not leak key");
}

async function expectMissingShareSponsorshipConfig(url) {
  const sender = `0x${"1".padStart(64, "0")}`;
  const recipient = `0x${"2".padStart(64, "0")}`;
  const namespaceId = `0x${"3".padStart(64, "0")}`;
  const adminCapId = `0x${"4".padStart(64, "0")}`;
  const capId = `0x${"5".padStart(64, "0")}`;
  const shareRes = await fetch(`${url}/api/share/sponsored/prepare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "ro-cap-share",
      sender,
      recipient,
      namespaceId,
      adminCapId,
    }),
  });
  const shareBody = await shareRes.json();
  check(shareRes.status === 503, "share prepare reports missing private key");
  check(shareBody?.code === "not_configured", "share prepare missing-config code");
  check(
    !JSON.stringify(shareBody).includes("ENOKI_SECRET_KEY="),
    "share prepare does not leak key",
  );

  const revokeRes = await fetch(`${url}/api/share/sponsored/prepare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "cap-self-revoke",
      sender,
      capId,
      capKind: "ReadOnly",
    }),
  });
  const revokeBody = await revokeRes.json();
  check(revokeRes.status === 503, "share self-revoke prepare reports missing private key");
  check(revokeBody?.code === "not_configured", "share self-revoke missing-config code");
  check(
    !JSON.stringify(revokeBody).includes("ENOKI_SECRET_KEY="),
    "share self-revoke does not leak key",
  );
}

async function expectCliLoginLookup(url) {
  const owner = `0x${"4".repeat(64)}`;
  const res = await fetch(`${url}/api/cli-login/memwal-account?owner=${owner}`);
  const body = await res.json();
  check([200, 503].includes(res.status), "cli-login memwal lookup has expected status");
  if (res.status === 200) {
    check(body?.ok === true, "cli-login memwal lookup ok");
    check(body?.owner === owner, "cli-login memwal lookup echoes owner");
    check("accountId" in body, "cli-login memwal lookup returns account field");
  } else {
    check(body?.code === "not_configured", "cli-login memwal lookup missing-config code");
  }
  const serialized = JSON.stringify(body);
  check(!serialized.includes("PRIVATE_KEY="), "cli-login memwal lookup does not leak private key");
  check(!serialized.includes("ENOKI"), "cli-login memwal lookup does not leak enoki config");
}

function check(ok, label) {
  if (!ok) throw new Error(label);
  checks.push(label);
}

function prefix(chunk, label) {
  return String(chunk)
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => `[${label}] ${line}\n`)
    .join("");
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function stopServer(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  child.kill("SIGINT");
  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    delay(3000).then(() => {
      if (child.exitCode === null && child.signalCode === null) child.kill("SIGTERM");
    }),
  ]);
}

process.on("exit", () => {
  if (process.exitCode) {
    void rm(artifactsDir, { recursive: true, force: true }).catch(() => {});
  }
});
