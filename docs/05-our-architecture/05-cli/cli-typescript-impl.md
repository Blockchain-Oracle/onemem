# CLI TypeScript Implementation — `@onemem/cli`

Node implementation of the OneMem CLI. Same command surface as the Python version (per `command-surface.md`); idiomatic Node.

---

## Package layout

```
onemem-cli/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── bin/
│   └── onemem                         # shebang executable
├── src/
│   ├── index.ts                       # CLI entry; commander setup
│   ├── commands/
│   │   ├── login.ts
│   │   ├── logout.ts
│   │   ├── init.ts
│   │   ├── dashboard.ts
│   │   ├── search.ts
│   │   ├── add.ts
│   │   ├── get.ts
│   │   ├── update.ts
│   │   ├── delete.ts
│   │   ├── list.ts
│   │   ├── history.ts
│   │   ├── export.ts
│   │   ├── namespace/
│   │   │   ├── create.ts
│   │   │   ├── list.ts
│   │   │   ├── get.ts
│   │   │   ├── share.ts
│   │   │   ├── revoke.ts
│   │   │   ├── deactivate.ts
│   │   │   ├── reactivate.ts
│   │   │   └── caps.ts
│   │   ├── trace/
│   │   │   ├── list.ts
│   │   │   ├── get.ts
│   │   │   ├── tree.ts
│   │   │   ├── events.ts
│   │   │   └── end.ts
│   │   ├── verify.ts
│   │   ├── replay.ts
│   │   ├── stats.ts
│   │   ├── health.ts
│   │   ├── set-namespace.ts
│   │   ├── set-agent.ts
│   │   ├── install.ts
│   │   └── uninstall.ts
│   ├── installers/
│   │   ├── claude-code.ts             # writes Claude Code plugin marketplace entry
│   │   ├── openclaw.ts                # writes openclaw.json slot
│   │   ├── hermes.ts                  # writes Hermes config
│   │   ├── cursor.ts                  # writes .cursor/mcp.json
│   │   ├── windsurf.ts                # writes .windsurf/mcp.json
│   │   ├── codex.ts                   # writes ~/.codex/config.toml
│   │   ├── claude-desktop.ts          # writes Claude Desktop config
│   │   ├── cline.ts                   # writes Cline MCP config
│   │   ├── vscode.ts                  # writes VS Code MCP config
│   │   ├── antigravity.ts             # writes mcp_config.json
│   │   └── all.ts                     # detects + installs all
│   ├── ui/
│   │   ├── colors.ts                  # chalk wrappers per brand token
│   │   ├── tables.ts                  # cli-table3 helpers
│   │   ├── tree.ts                    # trace tree renderer
│   │   ├── spinner.ts                 # ora wrapper
│   │   ├── progress.ts                # cli-progress wrapper
│   │   └── errors.ts                  # formatted error output
│   ├── login-server.ts                # ephemeral HTTP server for browser callback
│   └── util/
│       ├── credentials.ts
│       └── json-output.ts             # --json flag handling
├── tests/
│   ├── commands/
│   ├── installers/
│   └── ui/
└── README.md
```

---

## `package.json`

```json
{
  "name": "@onemem/cli",
  "version": "0.1.0",
  "description": "OneMem CLI — verifiable agent memory + trace, controlled from your terminal",
  "license": "Apache-2.0",
  "bin": {
    "onemem": "./bin/onemem"
  },
  "main": "./dist/index.js",
  "type": "module",
  "engines": { "node": ">=18.0.0" },
  "files": ["dist", "bin", "README.md"],
  "scripts": {
    "build": "tsup",
    "test": "vitest run"
  },
  "dependencies": {
    "@onemem/sdk-ts": "^0.1.0",
    "commander": "^12.x",
    "chalk": "^5.x",
    "ora": "^8.x",
    "cli-progress": "^3.x",
    "cli-table3": "^0.6.x",
    "open": "^10.x",
    "@iarna/toml": "^2.x",
    "execa": "^9.x"
  }
}
```

---

## Entry point (`src/index.ts`)

```ts
#!/usr/bin/env node
import { Command } from "commander";
import * as commands from "./commands/index.js";

const program = new Command();
program
  .name("onemem")
  .description("OneMem — verifiable agent memory + trace on Walrus + Sui")
  .version("0.1.0")
  .option("--json", "Output JSON")
  .option("--verbose, -v", "Verbose logging")
  .option("--quiet, -q", "Suppress non-essential output")
  .option("--config <path>", "Override credentials file")
  .option("--namespace <id>", "Override default namespace")
  .option("--server <url>", "Override relayer URL")
  .option("--network <name>", "Sui network", "mainnet");

// Register each command
program.command("login").description("Browser-based wallet login").action(commands.login);
program.command("logout").description("Clear credentials").action(commands.logout);
program.command("init").description("Mint MemWalAccount + initial namespace")
  .option("--name <name>")
  .option("--kind <kind>")
  .action(commands.init);
program.command("dashboard").description("Launch local OneMem dashboard")
  .option("--port <port>", "Port", "4040")
  .option("--no-open", "Don't auto-open browser")
  .action(commands.dashboard);

program.command("search <query>")
  .option("--top-k <n>", "", "5")
  .option("--threshold <n>", "", "0.3")
  .action(commands.search);

program.command("add <text>")
  .option("--class <class>", "", "semantic")
  .option("--tier <tier>", "", "L0")
  .option("--metadata <json>")
  .action(commands.add);

// ... rest of commands

// Sub-command groups
const ns = program.command("namespace").description("Namespace operations");
ns.command("create <name>").option("--kind <kind>", "", "USER").action(commands.namespace.create);
ns.command("list").action(commands.namespace.list);
ns.command("get <id>").action(commands.namespace.get);
ns.command("share <ns-id> <recipient>")
  .option("--cap <kind>", "", "ReadWrite")
  .action(commands.namespace.share);
ns.command("revoke <ns-id> <cap-id>").action(commands.namespace.revoke);
ns.command("deactivate <id>").action(commands.namespace.deactivate);
ns.command("reactivate <id>").action(commands.namespace.reactivate);
ns.command("caps <id>").action(commands.namespace.caps);

const trace = program.command("trace").description("Trace session operations");
trace.command("list").action(commands.trace.list);
trace.command("get <id>").action(commands.trace.get);
trace.command("tree <id>").action(commands.trace.tree);
trace.command("events <id>").action(commands.trace.events);
trace.command("end <id>").option("--status <s>", "", "COMPLETED").action(commands.trace.end);

program.command("verify <session-id>").action(commands.verify);
program.command("replay <session-id>")
  .option("--out <path>")
  .option("--format <fmt>", "", "json")
  .action(commands.replay);

program.command("stats").action(commands.stats);
program.command("health").action(commands.health);
program.command("set-namespace <id>").action(commands.setNamespace);
program.command("set-agent <id>").action(commands.setAgent);

program.command("install").description("Install OneMem plugin for a runtime")
  .requiredOption("--runtime <id>", "Runtime ID (claude-code, openclaw, hermes, etc)")
  .action(commands.install);
program.command("uninstall").requiredOption("--runtime <id>").action(commands.uninstall);

program.parse();
```

---

## Command implementation pattern

Every command file follows the same shape:

```ts
// src/commands/search.ts
import { OneMem } from "@onemem/sdk-ts";
import { getClient, applyGlobalOpts } from "../util/sdk-helpers.js";
import { renderTable, renderJson } from "../ui/index.js";

export async function search(query: string, opts: any, command: any) {
  const globalOpts = command.optsWithGlobals();
  const client = await getClient(globalOpts);

  try {
    const { results } = await client.search(query, {
      topK: parseInt(opts.topK, 10),
      threshold: parseFloat(opts.threshold),
      namespaceId: globalOpts.namespace,
    });

    if (globalOpts.json) {
      console.log(JSON.stringify({ results }));
    } else {
      renderTable(results, {
        columns: ["id", "memoryClass", "contextTier", "text", "verified"],
        headers: ["ID", "Class", "Tier", "Text", "Verified"],
      });
    }
    process.exit(0);
  } catch (err) {
    renderError(err, globalOpts.json);
    process.exit(getExitCodeForError(err));
  }
}
```

---

## Login server (`src/login-server.ts`)

Browser-based login flow:

```ts
import http from "node:http";
import open from "open";
import { writeCredentials } from "./util/credentials.js";

export async function startLoginFlow(serverUrl: string): Promise<Credentials> {
  return new Promise((resolve, reject) => {
    const nonce = crypto.randomBytes(16).toString("hex");
    const port = 12340;
    
    const server = http.createServer(async (req, res) => {
      if (req.url?.startsWith("/callback")) {
        const body = await readJsonBody(req);
        // Validate signature against nonce
        // Write credentials
        await writeCredentials(body);
        res.writeHead(200, { "content-type": "text/html" });
        res.end("<html><body>OneMem login complete. You can close this tab.</body></html>");
        server.close();
        resolve(body);
      }
    });
    
    server.listen(port, () => {
      const url = `${serverUrl.replace("relayer.", "app.")}/cli-login?nonce=${nonce}&port=${port}`;
      open(url);
      console.log(`Opening browser: ${url}`);
      console.log("Waiting for wallet authentication...");
    });
    
    setTimeout(() => {
      server.close();
      reject(new Error("Login timed out (5 min)"));
    }, 5 * 60 * 1000);
  });
}
```

---

## Installer pattern (`src/installers/<runtime>.ts`)

```ts
// src/installers/claude-code.ts
import fs from "node:fs/promises";
import path from "node:path";
import { execa } from "execa";

export async function install() {
  // 1. Detect Claude Code plugin directory
  const homedir = process.env.HOME || process.env.USERPROFILE;
  const pluginsDir = path.join(homedir, ".claude", "plugins");
  
  // 2. Use Claude Code CLI to add plugin marketplace + install
  await execa("claude", ["plugin", "marketplace", "add", "onemem/claude-code-plugin"]);
  await execa("claude", ["plugin", "install", "onemem"]);
  
  // 3. Write any additional config
  // 4. Report success
  console.log("✓ Installed OneMem Claude Code plugin");
  console.log("  Restart Claude Code to activate.");
}
```

Each installer is ~50-100 lines, runtime-specific.

---

## Build + distribution

```bash
# Build with tsup (ESM + CJS dual)
npm run build

# Publish
npm publish --access public

# Users install:
npm install -g @onemem/cli
# or
npx @onemem/cli <command>
```

---

## Cross-references

- `command-surface.md` — what each command does
- `output-design.md` — how output is rendered
- `login-flow.md` — browser auth detail
- `cli-python-impl.md` — sibling Python implementation (same surface)
- `../02-sdks/sdk-typescript.md` — SDK the CLI wraps
