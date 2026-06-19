import { Command } from "commander";
import { dashboardCommand } from "./commands/dashboard.js";
import { healthCommand } from "./commands/health.js";
import { initCommand } from "./commands/init.js";
import { loginCommand } from "./commands/login.js";
import { addCommand, searchCommand } from "./commands/memory.js";
import {
  namespaceAdminRevoke,
  namespaceCapabilities,
  namespaceRevoke,
  namespaceShare,
} from "./commands/namespace.js";
import { traceEvents, traceGet, traceList } from "./commands/trace.js";
import { verifyCommand } from "./commands/verify.js";
import { VERSION } from "./version.js";

export function buildProgram(): Command {
  const program = new Command();
  program
    .name("onemem")
    .description("OneMem — verifiable agent memory + trace on Sui + Walrus + Seal")
    .version(VERSION)
    .option("--json", "Output JSON")
    .option("--network <name>", "Sui network (testnet, mainnet, devnet, local)");

  program
    .command("init")
    .description("Provision (or reuse) a namespace + ReadWrite cap — zero config")
    .option("--label <label>", "Namespace label", "onemem")
    .action(initCommand);

  program.command("health").description("Check RPC + package reachability").action(healthCommand);

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
    .command("verify <session-id>")
    .description("Independently verify a TraceSession's Merkle chain")
    .action(verifyCommand);

  const trace = program.command("trace").description("Inspect on-chain TraceSessions");
  trace.command("list").description("List recent sessions").action(traceList);
  trace.command("get <session-id>").description("Show session metadata").action(traceGet);
  trace
    .command("events <session-id>")
    .description("Show the decoded ActionCall chain")
    .action(traceEvents);

  const namespace = program.command("namespace").description("Manage OneMem namespaces");
  namespace
    .command("share <namespace-id> <recipient>")
    .description("Mint + transfer a namespace capability (requires signer + Admin cap)")
    .option("--cap <kind>", "Capability kind: ReadOnly or ReadWrite", "ReadOnly")
    .option("--admin-cap <id>", "Admin capability id (or set ONEMEM_ADMIN_CAP_ID)")
    .action(namespaceShare);
  namespace
    .command("revoke <cap-id>")
    .description("Self-revoke a capability you hold (consumes the cap object)")
    .option("--allow-admin", "Allow revoking an Admin capability")
    .action(namespaceRevoke);
  namespace
    .command("admin-revoke <namespace-id> <cap-id>")
    .description("Admin-revoke a capability by ID (marks it unusable; object remains)")
    .option("--admin-cap <id>", "Admin capability id (or set ONEMEM_ADMIN_CAP_ID)")
    .option("--allow-admin", "Allow admin-revoking an Admin capability")
    .action(namespaceAdminRevoke);
  namespace
    .command("capabilities <namespace-id>")
    .description("List active capabilities for a namespace")
    .action((namespaceId: string, _opts: unknown, command: Command) =>
      namespaceCapabilities(namespaceId, command),
    );

  program
    .command("add <text>")
    .description("Store a memory + emit a verifiable ActionCall (needs signer + MemWal config)")
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
