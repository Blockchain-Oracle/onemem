import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const gitCheck = spawnSync("git", ["rev-parse", "--is-inside-work-tree"], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "ignore"],
});

if (gitCheck.status !== 0 || gitCheck.stdout.trim() !== "true") {
  console.log("Skipping lefthook install: not inside a git worktree.");
  process.exit(0);
}

const localLefthook = join(process.cwd(), "node_modules", ".bin", "lefthook");
const lefthookBin = existsSync(localLefthook) ? localLefthook : "lefthook";

const install = spawnSync(lefthookBin, ["install"], {
  stdio: "inherit",
});

process.exit(install.status ?? 1);
