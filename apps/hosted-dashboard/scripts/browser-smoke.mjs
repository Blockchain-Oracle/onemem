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
const screenshotPath = join(artifactsDir, "hosted-login.png");

const checks = [];
const consoleErrors = [];
const resourceErrors = [];
let server = null;

try {
  await mkdir(artifactsDir, { recursive: true });
  if (!providedBaseUrl) {
    server = startServer(defaultPort);
    await waitForServer(baseUrl, 45_000);
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

    await expectCliLoginLookup(baseUrl);
    await page.goto(`${baseUrl}/cli-login?nonce=smoke-nonce&port=12345`, {
      waitUntil: "networkidle",
    });
    await expectText(page, "Pair your terminal", "cli-login title");
    await expectText(page, authUi.connectText, "cli-login connect button");
    await expectText(page, "Device nonce", "cli-login nonce row");
    await expectText(page, "smoke-nonce", "cli-login nonce value");
    await expectText(page, "localhost:12345", "cli-login callback port");

    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });
    await expectText(page, "OneMem Dashboard", "dashboard title");
    await expectText(page, "Connect an account", "dashboard account gate");
    if (!authUi.publicEnvConfigured) {
      await expectText(page, "Google sign-in is not enabled", "dashboard enoki config state");
    }

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
