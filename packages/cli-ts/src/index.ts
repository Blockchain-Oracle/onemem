import { Command } from "commander";
import { healthCommand } from "./commands/health.js";
import { initCommand } from "./commands/init.js";
import { loginCommand } from "./commands/login.js";
import { addCommand, searchCommand } from "./commands/memory.js";
import { namespaceCapabilities, namespaceRevoke, namespaceShare } from "./commands/namespace.js";
import { traceEvents, traceGet, traceList } from "./commands/trace.js";
import { verifyCommand } from "./commands/verify.js";

export const VERSION = "0.1.0";

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
    .command("login")
    .description("Pair this terminal with the hosted dashboard (browser approval)")
    .option("--url <url>", "Dashboard URL (default $ONEMEM_DASHBOARD_URL or app.onemem.ai)")
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

buildProgram().parseAsync(process.argv);
