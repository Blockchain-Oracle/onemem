// Real observer backends. The headline one is CodexBackend: it spawns the
// user's OWN `codex exec` in non-interactive mode, which compresses on their
// existing ChatGPT/Codex login with ZERO API key (proven live 2026-06-20).
// `--output-schema` forces the exact observation JSON, so no XML parsing is
// needed on this path. KeyBackend is an honest BYO-key fallback. (ClaudeBackend
// — riding the Claude subscription via @anthropic-ai/claude-agent-sdk — is the
// next backend; tracked in the Phase 3 spec.)

import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ObserverBackend } from "./observer.js";

const DEFAULT_TIMEOUT_MS = 120_000;

interface ProcessResult {
  readonly code: number | null;
  readonly stderr: string;
}

function runProcess(
  cmd: string,
  args: string[],
  stdin: string,
  opts: { cwd?: string; timeoutMs?: number } = {},
): Promise<ProcessResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: opts.cwd, stdio: ["pipe", "ignore", "pipe"] });
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`${cmd} timed out after ${opts.timeoutMs ?? DEFAULT_TIMEOUT_MS}ms`));
    }, opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    child.stderr?.on("data", (d) => {
      stderr += String(d);
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code, stderr });
    });
    child.stdin?.write(stdin);
    child.stdin?.end();
  });
}

/** True if `cmd` resolves on PATH. */
function commandExists(cmd: string): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn("sh", ["-c", `command -v ${cmd}`], { stdio: "ignore" });
    child.on("error", () => resolve(false));
    child.on("close", (code) => resolve(code === 0));
  });
}

/**
 * Observer that rides the user's own Codex CLI (`codex exec`) — zero API key,
 * uses their existing ChatGPT/Codex subscription, sanctioned (it's their CLI).
 */
export class CodexBackend implements ObserverBackend {
  readonly name = "codex";
  constructor(private readonly model?: string) {}

  available(): Promise<boolean> {
    return commandExists("codex");
  }

  async compress(prompt: string, schema?: Record<string, unknown>): Promise<string> {
    const dir = await mkdtemp(join(tmpdir(), "onemem-observer-"));
    try {
      const outPath = join(dir, "out.json");
      const args = [
        "exec",
        "--skip-git-repo-check",
        "--sandbox",
        "read-only",
        "--ephemeral",
        "--ignore-user-config",
        "-o",
        outPath,
      ];
      if (schema) {
        const schemaPath = join(dir, "schema.json");
        await writeFile(schemaPath, JSON.stringify(schema), "utf8");
        args.push("--output-schema", schemaPath); // forces exact structured JSON
      }
      if (this.model) args.push("-m", this.model);
      args.push("-"); // read the prompt from stdin

      const { code, stderr } = await runProcess("codex", args, prompt, { cwd: dir });
      if (code !== 0) {
        throw new Error(`codex exec exited ${code}: ${stderr.slice(-400)}`);
      }
      return await readFile(outPath, "utf8").catch(() => "");
    } finally {
      await rm(dir, { recursive: true, force: true }).catch(() => {});
    }
  }
}

/**
 * Honest BYO-key fallback for environments without a usable coding-agent CLI.
 * Any OpenAI-compatible chat endpoint (OpenAI / OpenRouter / etc.).
 */
export class KeyBackend implements ObserverBackend {
  readonly name = "openai-key";
  constructor(
    private readonly apiKey: string,
    private readonly model = "gpt-4o-mini",
    private readonly baseUrl = "https://api.openai.com/v1",
  ) {}

  async available(): Promise<boolean> {
    return Boolean(this.apiKey);
  }

  // schema is advisory here — JSON mode + the prompt's schema text guide the model.
  async compress(prompt: string, _schema?: Record<string, unknown>): Promise<string> {
    const res = await fetch(`${this.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      throw new Error(`observer key backend ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content ?? "";
  }
}

/**
 * Pick the best zero-config observer backend available: the user's Codex CLI
 * first (zero key), then a BYO key. Returns null if none — the worker then
 * captures + stores RAW memory without compression (honest degradation).
 */
export async function selectObserverBackend(
  env: NodeJS.ProcessEnv = process.env,
): Promise<ObserverBackend | null> {
  const model = env.ONEMEM_OBSERVER_MODEL;

  const codex = new CodexBackend(model);
  if (await codex.available()) return codex;

  const key = env.ONEMEM_OBSERVER_API_KEY;
  if (key) {
    return new KeyBackend(
      key,
      model ?? "gpt-4o-mini",
      env.ONEMEM_OBSERVER_BASE_URL ?? "https://api.openai.com/v1",
    );
  }

  return null;
}
