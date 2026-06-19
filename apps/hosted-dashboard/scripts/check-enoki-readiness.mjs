#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ENOKI_API = "https://api.enoki.mystenlabs.com/v1/app";
const DEFAULT_ORIGIN = "https://app.onemem.xyz";
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "../../..");

function parseArgs(argv) {
  const opts = {
    deployedStatusUrl: "",
    envFile: resolve(repoRoot, ".env"),
    json: false,
    origin: process.env.ONEMEM_APP_ORIGIN || DEFAULT_ORIGIN,
    strict: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--json") opts.json = true;
    else if (arg === "--strict") opts.strict = true;
    else if (arg === "--origin") opts.origin = argv[++i] || opts.origin;
    else if (arg === "--env") opts.envFile = resolve(process.cwd(), argv[++i] || "");
    else if (arg === "--deployed-status-url") opts.deployedStatusUrl = argv[++i] || "";
    else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return opts;
}

function parseEnvFile(file) {
  try {
    const text = readFileSync(file, "utf8");
    const env = {};
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(trimmed);
      if (!match) continue;
      const [, key, rawValue] = match;
      env[key] = rawValue.replace(/^['"]|['"]$/g, "");
    }
    return { env, loaded: true };
  } catch {
    return { env: {}, loaded: false };
  }
}

function envValue(fileEnv, key) {
  return process.env[key] || fileEnv[key] || "";
}

async function fetchJson(url, headers = {}) {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(10_000) });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text.slice(0, 400) };
  }
  return { body, ok: res.ok, status: res.status };
}

function providerType(provider) {
  if (!provider || typeof provider !== "object") return null;
  return typeof provider.providerType === "string" ? provider.providerType : null;
}

function deployedStatusReady(deployed) {
  const body = deployed?.body;
  return Boolean(
    deployed?.ok &&
      body &&
      typeof body === "object" &&
      body.ok === true &&
      body.signInReady === true &&
      body.publicEnv?.configured === true &&
      Array.isArray(body.missingOrigins) &&
      body.missingOrigins.length === 0,
  );
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const { env: fileEnv, loaded: envFileLoaded } = parseEnvFile(opts.envFile);

  const publicEnvMissing = [
    envValue(fileEnv, "NEXT_PUBLIC_ENOKI_API_KEY") ? null : "NEXT_PUBLIC_ENOKI_API_KEY",
    envValue(fileEnv, "NEXT_PUBLIC_ENOKI_GOOGLE_CLIENT_ID") ||
    envValue(fileEnv, "NEXT_PUBLIC_GOOGLE_CLIENT_ID")
      ? null
      : "NEXT_PUBLIC_ENOKI_GOOGLE_CLIENT_ID",
  ].filter(Boolean);

  const privateKey = envValue(fileEnv, "ENOKI_PRIVATE_KEY");
  const result = {
    ok: false,
    envFile: {
      loaded: envFileLoaded,
      path: opts.envFile,
    },
    publicEnv: {
      configured: publicEnvMissing.length === 0,
      missing: publicEnvMissing,
    },
    requiredOrigins: [opts.origin],
    serverEnv: {
      enokiPrivateKeyPresent: Boolean(privateKey),
    },
  };

  if (privateKey) {
    const appRes = await fetchJson(ENOKI_API, { Authorization: `Bearer ${privateKey}` });
    const app = appRes.body?.data ?? {};
    const providers = Array.isArray(app.authenticationProviders) ? app.authenticationProviders : [];
    const origins = Array.isArray(app.allowedOrigins) ? app.allowedOrigins : [];
    const providerTypes = providers.map(providerType).filter(Boolean).sort();
    const missingOrigins = [opts.origin].filter((origin) => !origins.includes(origin));
    result.enokiApp = {
      allowedOrigins: origins,
      authProviders: providerTypes,
      hasGoogleProvider: providerTypes.includes("google"),
      metadataReachable: appRes.ok,
      missingOrigins,
      status: appRes.status,
    };
  } else {
    result.enokiApp = {
      allowedOrigins: [],
      authProviders: [],
      hasGoogleProvider: false,
      metadataReachable: false,
      missingOrigins: [opts.origin],
      status: null,
    };
  }

  if (opts.deployedStatusUrl) {
    const deployed = await fetchJson(opts.deployedStatusUrl);
    result.deployed = {
      body: deployed.body,
      ok: deployed.ok,
      ready: deployedStatusReady(deployed),
      status: deployed.status,
      url: opts.deployedStatusUrl,
    };
  }

  result.ok =
    result.publicEnv.configured &&
    result.enokiApp.metadataReachable &&
    result.enokiApp.hasGoogleProvider &&
    result.enokiApp.missingOrigins.length === 0 &&
    (!opts.deployedStatusUrl || result.deployed.ready);

  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`Enoki Google sign-in ready: ${result.ok ? "yes" : "no"}`);
    console.log(`Public env configured: ${result.publicEnv.configured ? "yes" : "no"}`);
    if (result.publicEnv.missing.length > 0) {
      console.log(`Missing public env: ${result.publicEnv.missing.join(", ")}`);
    }
    console.log(`Enoki private key present: ${result.serverEnv.enokiPrivateKeyPresent ? "yes" : "no"}`);
    console.log(`Google provider configured: ${result.enokiApp.hasGoogleProvider ? "yes" : "no"}`);
    if (result.enokiApp.missingOrigins.length > 0) {
      console.log(`Missing Enoki origins: ${result.enokiApp.missingOrigins.join(", ")}`);
    }
    if (opts.deployedStatusUrl) {
      console.log(`Deployed status ready: ${result.deployed.ready ? "yes" : "no"}`);
    }
  }

  if (opts.strict && !result.ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
