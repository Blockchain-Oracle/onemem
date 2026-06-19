#!/usr/bin/env node
// `npx @onemem/oc-onemem init` — the one post-install line.
//
// Grants the ONE thing OpenClaw's security model won't let a plugin self-enable:
// conversation-access for its lifecycle hooks (privacy opt-in, by design). Also
// enables + allowlists the plugin. Captured observations stream to the local
// OneMem worker (127.0.0.1:4041) — nothing else to configure.
//
// Usage:
//   npx @onemem/oc-onemem init              # default profile (~/.openclaw)
//   npx @onemem/oc-onemem init --dev        # ~/.openclaw-dev
//   npx @onemem/oc-onemem init --profile X  # ~/.openclaw-X
//   OPENCLAW_CONFIG_PATH=/path init         # explicit config file

import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const PLUGIN_ID = "oc-onemem";

/** Resolve the OpenClaw config path: env > --profile > --dev > default. */
export function resolveConfigPath(argv, env = process.env, home = homedir()) {
  if (env.OPENCLAW_CONFIG_PATH) return env.OPENCLAW_CONFIG_PATH;
  const profileIdx = argv.indexOf("--profile");
  if (profileIdx !== -1 && argv[profileIdx + 1]) {
    return join(home, `.openclaw-${argv[profileIdx + 1]}`, "openclaw.json");
  }
  if (argv.includes("--dev")) return join(home, ".openclaw-dev", "openclaw.json");
  return join(home, ".openclaw", "openclaw.json");
}

/**
 * Merge the oc-onemem opt-in into an existing config object WITHOUT clobbering
 * other plugins' entries or the allowlist. Idempotent. Returns the same object.
 */
export function applyInit(cfg) {
  const plugins = (cfg.plugins ??= {});
  const entry = ((plugins.entries ??= {})[PLUGIN_ID] ??= {});
  entry.enabled = true;
  (entry.hooks ??= {}).allowConversationAccess = true;
  const allow = (plugins.allow ??= []);
  if (!allow.includes(PLUGIN_ID)) allow.push(PLUGIN_ID);
  return cfg;
}

function readConfig(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    // Distinguish "file absent" (fine — start fresh) from "present but corrupt"
    // (refuse to clobber the user's real config).
    if (err && err.code === "ENOENT") return {};
    throw new Error(
      `refusing to overwrite unreadable config at ${path}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

function main(argv) {
  const path = resolveConfigPath(argv);
  const cfg = applyInit(readConfig(path));
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(cfg, null, 2)}\n`);
  renameSync(tmp, path);
  console.log(`[oc-onemem] configured ${path}`);
  console.log(`  plugins.entries.${PLUGIN_ID}.enabled = true`);
  console.log(`  plugins.entries.${PLUGIN_ID}.hooks.allowConversationAccess = true`);
  console.log(`  plugins.allow += "${PLUGIN_ID}"`);
  console.log("Restart the gateway. Each agent run is captured to the local OneMem worker (127.0.0.1:4041).");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main(process.argv.slice(2));
}
