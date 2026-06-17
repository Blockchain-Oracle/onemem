#!/usr/bin/env node

import { spawn } from "node:child_process";
import { access, chmod, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const here = dirname(fileURLToPath(import.meta.url));
const root = dirname(here);
const defaultPort = Number(process.env.ONEMEM_DASHBOARD_SMOKE_PORT || 4055);
const providedBaseUrl = process.env.ONEMEM_DASHBOARD_SMOKE_BASE_URL;
const baseUrl = providedBaseUrl || `http://127.0.0.1:${defaultPort}`;
const headless = process.env.ONEMEM_DASHBOARD_SMOKE_HEADLESS !== "0";
const artifactsDir = join(root, ".browser-smoke");
const screenshotPath = join(artifactsDir, "sessions-grouped-replay.png");
const traceScreenshotPath = join(artifactsDir, "trace-single-replay.png");
const settingsScreenshotPath = join(artifactsDir, "settings-delegate-lifecycle.png");
const smokeCredentialsPath = join(artifactsDir, "credentials.json");
const traceSmokeSession =
  process.env.ONEMEM_DASHBOARD_TRACE_SMOKE_SESSION ||
  "0x6ceaab0fe2961043d490326960dfd192e43c25ed655772d42c04c265ad3ec080";

const checks = [];
const consoleErrors = [];
const resourceErrors = [];
let server = null;

try {
  await mkdir(artifactsDir, { recursive: true });
  if (!providedBaseUrl) {
    await writeSmokeCredentials(smokeCredentialsPath);
    server = startServer(defaultPort);
    await waitForServer(baseUrl, 45_000);
  }

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => consoleErrors.push(err.message));
    page.on("response", (res) => {
      if (res.status() >= 400) resourceErrors.push(`${res.status()} ${res.url()}`);
    });

    await page.goto(`${baseUrl}/sessions`, { waitUntil: "domcontentloaded" });
    await expectText(page, "Sessions", "sessions page title");
    await expectText(
      page,
      "Dashboard-derived day groups over on-chain TraceSessions.",
      "sessions proof-boundary subtitle",
    );

    const replayButtons = page.getByRole("button", { name: "Replay/export" });
    const replayCount = await replayButtons.count();
    check(replayCount > 0, `found ${replayCount} Replay/export button(s)`);
    await clickUntilVisible(
      page,
      replayButtons.first(),
      page.getByRole("dialog", { name: "Grouped session replay" }),
      "grouped replay modal opened",
    );

    await expectText(page, "Grouped replay", "grouped replay modal title");
    await expectText(page, "onemem.grouped-session-export.v1", "grouped export schema");
    await expectText(page, "Download JSON", "download json action");
    await expectText(page, "Copy JSON", "copy json action");
    await expectText(page, "does not prove plaintext", "proof-boundary text");
    await page.screenshot({ fullPage: true, path: screenshotPath });

    await page.goto(`${baseUrl}/trace/${traceSmokeSession}`, { waitUntil: "networkidle" });
    await expectText(page, "TraceSession", "trace page session title");
    await expectText(page, "Replay session", "trace replay action");
    await clickUntilVisible(
      page,
      page.getByRole("button", { name: "Replay session" }),
      page.getByRole("dialog", { name: "Replay session" }),
      "single trace replay modal opened",
    );
    await expectText(page, "Replay", "single trace replay modal title");
    await expectText(page, "onemem.trace-session-export.v1", "single trace export schema");
    await expectText(page, "Download JSON", "single trace download action");
    await expectText(page, "Copy JSON", "single trace copy action");
    await expectText(page, "does not include plaintext", "single trace no-plaintext boundary");
    await page.screenshot({ fullPage: true, path: traceScreenshotPath });

    if (!providedBaseUrl) {
      await page.goto(`${baseUrl}/settings`, { waitUntil: "networkidle" });
      await expectText(page, "Settings", "settings page title");
      const delegateTab = page.getByRole("button", { name: "Delegate keys" });
      await delegateTab.waitFor({ timeout: 30_000 });
      await delegateTab.click();
      await page.waitForFunction(
        () => document.body.textContent?.includes("Credentials file"),
        undefined,
        { timeout: 30_000 },
      );
      check(true, "settings delegate tab");
      await expectText(page, "browser smoke delegate", "settings delegate label");
      await expectText(page, "active", "settings active delegate lifecycle");
      await expectText(page, "30d", "settings delegate ttl");
      const settingsText = (await page.textContent("body")) ?? "";
      check(!settingsText.includes("smoke-private-delegate-key"), "settings hides delegate secret");
      check(
        !settingsText.includes("smoke-private-embedding-key"),
        "settings hides embedding secret",
      );
      await page.screenshot({ fullPage: true, path: settingsScreenshotPath });
    }

    check(resourceErrors.length === 0, "browser emitted no failed resource responses");
    check(consoleErrors.length === 0, "browser console emitted no errors");
  } finally {
    await browser.close();
  }

  await writeFile(
    join(artifactsDir, "last-run.json"),
    `${JSON.stringify(
      { baseUrl, checks, screenshotPath, traceScreenshotPath, settingsScreenshotPath },
      null,
      2,
    )}\n`,
  );
  console.log(`[browser-smoke] passed ${checks.length} checks`);
  for (const item of checks) console.log(`  - ${item}`);
  console.log(`[browser-smoke] screenshot ${screenshotPath}`);
  console.log(`[browser-smoke] screenshot ${traceScreenshotPath}`);
  if (!providedBaseUrl) console.log(`[browser-smoke] screenshot ${settingsScreenshotPath}`);
} catch (err) {
  console.error(`[browser-smoke] failed: ${err instanceof Error ? err.message : String(err)}`);
  if (consoleErrors.length > 0) {
    console.error("[browser-smoke] browser console errors:");
    for (const line of consoleErrors) console.error(`  - ${line}`);
  }
  if (resourceErrors.length > 0) {
    console.error("[browser-smoke] failed browser resources:");
    for (const line of resourceErrors) console.error(`  - ${line}`);
  }
  process.exitCode = 1;
} finally {
  if (server) await stopServer(server);
}

function startServer(port) {
  const child = spawn("pnpm", ["exec", "next", "dev", "-p", String(port)], {
    cwd: root,
    env: { ...process.env, ONEMEM_CREDENTIALS_PATH: smokeCredentialsPath, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", (chunk) => process.stdout.write(prefix(chunk, "next")));
  child.stderr.on("data", (chunk) => process.stderr.write(prefix(chunk, "next")));
  child.on("exit", (code, signal) => {
    if (process.exitCode === undefined && code && code !== 0) {
      console.error(`[browser-smoke] dashboard server exited with code ${code} signal ${signal}`);
    }
  });
  return child;
}

async function writeSmokeCredentials(path) {
  await writeFile(
    path,
    `${JSON.stringify(
      {
        delegateKey: "smoke-private-delegate-key",
        embeddingApiKey: "smoke-private-embedding-key",
        delegatePublicKey: "0xsmokepublic",
        delegateLabel: "browser smoke delegate",
        delegateTtlSeconds: 2_592_000,
        accountId: "0xsmokeaccount",
        suiAddress: "0xsmokesui",
        activeNamespaceId: "0xsmokenamespace",
        memwalPackageId: "0xsmokememwal",
        relayerUrl: "https://relayer.memory.walrus.xyz",
        createdAt: "2026-06-17T00:00:00.000Z",
        expiresAt: "2099-01-01T00:00:00.000Z",
        sdkVersion: "browser-smoke",
      },
      null,
      2,
    )}\n`,
    { mode: 0o600 },
  );
  await chmod(path, 0o600);
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
  throw new Error(`dashboard server not ready at ${url}: ${lastError}`);
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
      `Chrome/Chromium is required for browser smoke. Set ONEMEM_BROWSER_EXECUTABLE to a browser binary. Last launch error: ${
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

async function clickUntilVisible(page, button, target, label) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    await button.click();
    try {
      await target.waitFor({ timeout: 10_000 });
      check(true, label);
      return;
    } catch (err) {
      if (attempt === 3) throw err;
      await page.waitForTimeout(750);
    }
  }
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
