import { type ChildProcess, type SpawnOptions, spawn } from "node:child_process";

export interface DashboardOptions {
  port?: string;
}

type SpawnDashboard = (
  command: string,
  args: readonly string[],
  options: SpawnOptions,
) => ChildProcess;

interface LaunchDashboardDeps {
  binary?: string;
  env?: NodeJS.ProcessEnv;
  spawn?: SpawnDashboard;
  write?: (line: string) => void;
  writeError?: (line: string) => void;
}

const DEFAULT_PORT = "4040";
const DEFAULT_BINARY = "onemem-dashboard";

function errorCode(err: unknown): string | undefined {
  return typeof err === "object" && err !== null && "code" in err
    ? String((err as { code?: unknown }).code)
    : undefined;
}

export function launchDashboard(
  opts: DashboardOptions = {},
  deps: LaunchDashboardDeps = {},
): Promise<number> {
  const binary = deps.binary ?? process.env.ONEMEM_DASHBOARD_BIN ?? DEFAULT_BINARY;
  const port = opts.port ?? DEFAULT_PORT;
  const env = { ...(deps.env ?? process.env), PORT: port, ONEMEM_MODE: "local" };
  const run = deps.spawn ?? spawn;
  const write = deps.write ?? ((line: string) => process.stdout.write(`${line}\n`));
  const writeError = deps.writeError ?? ((line: string) => process.stderr.write(`${line}\n`));

  write(`Launching OneMem dashboard at http://localhost:${port}`);

  return new Promise((resolve) => {
    let settled = false;
    const finish = (code: number) => {
      if (settled) return;
      settled = true;
      resolve(code);
    };

    const child = run(binary, [], {
      env,
      stdio: "inherit",
    });

    child.once("error", (err) => {
      if (errorCode(err) === "ENOENT") {
        writeError(
          "error: could not find `onemem-dashboard`; install `@onemem/dashboard` or put the binary on PATH",
        );
      } else {
        const message = err instanceof Error ? err.message : String(err);
        writeError(`error: failed to launch OneMem dashboard: ${message}`);
      }
      finish(1);
    });
    child.once("exit", (code, signal) => {
      finish(code ?? (signal ? 1 : 0));
    });
  });
}

export async function dashboardCommand(opts: DashboardOptions): Promise<void> {
  const code = await launchDashboard(opts);
  if (code !== 0) {
    process.exitCode = code;
  }
}
