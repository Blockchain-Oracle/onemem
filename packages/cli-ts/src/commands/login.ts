// `onemem login` — pair this terminal with the hosted dashboard.
//
// Flow (mirrors apps/hosted-dashboard/app/cli-login):
//   1. mint a one-time nonce + start a localhost callback server on a free port
//   2. open the browser to <dashboard>/cli-login?nonce&port
//   3. the page (after the user approves) mints a delegate key and POSTs the
//      credentials back to http://127.0.0.1:<port>/callback with the nonce
//   4. we validate the nonce, persist creds to ~/.onemem/credentials.json, done
//
// The browser side's key minting is gated on a signed-in account (Enoki/zkLogin)
// configured in the hosted deployment; this CLI owns the pairing loop + the
// local credential write, which work against any dashboard that implements the
// callback contract.

import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { chmodSync, mkdirSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { homedir } from "node:os";
import { join } from "node:path";
import { type GlobalOpts, printJson, printLine, runCommand } from "../util/output.js";
import {
  LoginCredentialValidationError,
  validateLoginCredentialPayload,
} from "./login-validation.js";

export {
  LoginCredentialValidationError,
  validateLoginCredentialPayload,
} from "./login-validation.js";

const DEFAULT_DASHBOARD_URL = "https://app.onemem.ai";
const ONEMEM_DIR = join(homedir(), ".onemem");
const CREDENTIALS_FILE = join(ONEMEM_DIR, "credentials.json");
const SECRET_FILE_MODE = 0o600;
const SECRET_DIR_MODE = 0o700;
const DEFAULT_TIMEOUT_MS = 180_000;

interface LoginOpts {
  url?: string;
  timeout?: string;
  noOpen?: boolean;
}

/** Best-effort: open a URL in the user's default browser (platform-specific). */
function openBrowser(url: string): void {
  const cmd =
    process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  try {
    const child = spawn(cmd, [url], {
      stdio: "ignore",
      detached: true,
      shell: process.platform === "win32",
    });
    child.on("error", () => {});
    child.unref();
  } catch {
    // non-fatal — the URL is printed for manual open
  }
}

export function loginCommand(opts: LoginOpts, command: { optsWithGlobals(): GlobalOpts }) {
  const g = command.optsWithGlobals();
  return runCommand(g, async () => {
    const dashboardUrl = (
      opts.url ??
      process.env.ONEMEM_DASHBOARD_URL ??
      DEFAULT_DASHBOARD_URL
    ).replace(/\/$/, "");
    const timeoutMs = opts.timeout ? Number(opts.timeout) * 1000 : DEFAULT_TIMEOUT_MS;
    const nonce = randomBytes(16).toString("hex");

    const dashboardOrigin = new URL(dashboardUrl).origin;
    let boundPort = 0;
    const creds = await new Promise<Record<string, unknown>>((resolve, reject) => {
      const server = createServer((req, res) => {
        // Defeat DNS-rebinding: only accept requests whose Host is our literal
        // loopback bind, not an attacker-controlled name resolving to 127.0.0.1.
        const host = req.headers.host ?? "";
        if (host !== `127.0.0.1:${boundPort}` && host !== `localhost:${boundPort}`) {
          res.writeHead(403).end("bad host");
          return;
        }
        // Scope CORS to the dashboard origin (not "*") — only the page that
        // started this pairing should read the callback response.
        res.setHeader("Access-Control-Allow-Origin", dashboardOrigin);
        res.setHeader("Vary", "Origin");
        res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        if (req.method === "OPTIONS") {
          res.writeHead(204).end();
          return;
        }
        if (req.method !== "POST" || !req.url?.startsWith("/callback")) {
          res.writeHead(404).end();
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
          if (body.length > 1_000_000) req.destroy(); // guard against oversized payloads
        });
        req.on("end", async () => {
          try {
            const payload = JSON.parse(body) as Record<string, unknown>;
            await validateLoginCredentialPayload(payload, nonce);
            res.writeHead(200, { "Content-Type": "application/json" }).end('{"ok":true}');
            cleanup();
            resolve(payload);
          } catch (error) {
            if (error instanceof LoginCredentialValidationError) {
              res.writeHead(403).end(error.message);
              return;
            }
            res.writeHead(400).end("bad payload");
          }
        });
        req.on("error", () => {
          try {
            res.writeHead(400).end("bad payload");
          } catch {
            // response may already be closed
          }
        });
      });

      const timer = setTimeout(() => {
        cleanup();
        reject(new Error(`login timed out after ${timeoutMs / 1000}s — no callback received`));
      }, timeoutMs);

      function cleanup() {
        clearTimeout(timer);
        server.close();
      }

      server.on("error", (err) => {
        cleanup();
        reject(err);
      });

      server.listen(0, "127.0.0.1", () => {
        const addr = server.address();
        boundPort = typeof addr === "object" && addr ? addr.port : 0;
        const pairingUrl = `${dashboardUrl}/cli-login?nonce=${nonce}&port=${boundPort}`;
        if (!g.json) {
          printLine("Opening your browser to approve this terminal…");
          printLine(`  ${pairingUrl}`);
          printLine("Waiting for approval…");
        }
        if (!opts.noOpen) openBrowser(pairingUrl);
      });
    });

    mkdirSync(ONEMEM_DIR, { recursive: true, mode: SECRET_DIR_MODE });
    // Drop the nonce before persisting — it's a one-time pairing token, not a credential.
    const { nonce: _drop, ...toStore } = creds;
    writeFileSync(CREDENTIALS_FILE, JSON.stringify(toStore, null, 2), { mode: SECRET_FILE_MODE });
    // Enforce owner-only perms even if the file pre-existed with looser ones
    // (writeFileSync's mode is ignored for an existing file).
    chmodSync(CREDENTIALS_FILE, SECRET_FILE_MODE);

    if (g.json) {
      printJson({ ok: true, credentialsFile: CREDENTIALS_FILE });
      return;
    }
    printLine("✓ paired — credentials saved");
    printLine(`  ${CREDENTIALS_FILE}`);
  });
}
