import { Command } from "commander";
import { dashboardCommand } from "./commands/dashboard.js";
import { healthCommand } from "./commands/health.js";
import { initCommand } from "./commands/init.js";
import { loginCommand } from "./commands/login.js";
import { addCommand, searchCommand } from "./commands/memory.js";
import { VERSION } from "./version.js";

export function buildProgram(): Command {
  const program = new Command();
  program
    .name("onemem")
    .description("OneMem — decentralized memory for AI agents, stored on MemWal")
    .version(VERSION)
    .option("--json", "Output JSON")
    .option("--network <name>", "Sui network (testnet, mainnet, devnet, local)");

  program
    .command("init")
    .description("Set up OneMem on this machine — zero config")
    .option("--label <label>", "Runtime label", "onemem")
    .action(initCommand);

  program.command("health").description("Check Sui RPC reachability").action(healthCommand);

  program
    .command("dashboard")
    .description("Launch the local OneMem dashboard")
    .option("--port <port>", "Local dashboard port", "4040")
    .action(dashboardCommand);

  program
    .command("login")
    .description("Pair this terminal with the hosted dashboard (browser approval)")
    .option("--url <url>", "Dashboard URL (default $ONEMEM_DASHBOARD_URL or app.onemem.xyz)")
    .option("--timeout <seconds>", "How long to wait for browser approval")
    .option("--no-open", "Print the URL instead of opening a browser")
    .action(loginCommand);

  program
    .command("add <text>")
    .description("Store a memory (needs signer + MemWal config)")
    .option("--namespace <ns>", "MemWal namespace")
    .action(addCommand);

  program
    .command("search <query>")
    .description("Vector-recall memories (needs signer + MemWal config)")
    .option("--top-k <n>", "Max results")
    .option("--namespace <ns>", "MemWal namespace")
    .action(searchCommand);

  return program;
}

function isCommanderExit(err: unknown): err is { exitCode: number; message: string } {
  return (
    err !== null &&
    typeof err === "object" &&
    "exitCode" in err &&
    typeof (err as { exitCode?: unknown }).exitCode === "number"
  );
}

const program = buildProgram();
program.exitOverride();
program.parseAsync(process.argv).catch((err: unknown) => {
  if (isCommanderExit(err)) {
    if (err.exitCode !== 0 && err.message) process.stderr.write(`${err.message}\n`);
    process.exitCode = err.exitCode;
    return;
  }
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`error: ${message}\n`);
  process.exitCode = 1;
});
