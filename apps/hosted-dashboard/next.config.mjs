import nextEnv from "@next/env";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const { loadEnvConfig } = nextEnv;
const appDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(appDir, "../..");

// The hosted app lives in a workspace package, while local operator secrets and
// public Enoki config live in the repo-root .env. Load that file before Next
// snapshots NEXT_PUBLIC_* values into the client bundle.
loadEnvConfig(repoRoot, process.env.NODE_ENV !== "production", console, true);

const publicClientEnv = Object.fromEntries(
  [
    "NEXT_PUBLIC_ENOKI_API_KEY",
    "NEXT_PUBLIC_ENOKI_GOOGLE_CLIENT_ID",
    "NEXT_PUBLIC_GOOGLE_CLIENT_ID",
    "NEXT_PUBLIC_SUI_NETWORK",
  ]
    .map((key) => [key, process.env[key]])
    .filter((entry) => typeof entry[1] === "string" && entry[1].length > 0),
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: publicClientEnv,
  allowedDevOrigins: ["127.0.0.1"],
  // Transpile workspace deps that ship TS/TSX directly (per Next.js 15 workspace conventions)
  transpilePackages: ["@onemem/dashboard", "@onemem/brand"],
  // Keep native/WASM-bearing SDK deps external so Next loads them from
  // node_modules at runtime instead of bundling (fixes walrus_wasm_bg.wasm).
  serverExternalPackages: ["@onemem/sdk-ts", "@mysten/walrus", "@mysten/seal", "@mysten/sui"],
};

export default nextConfig;
