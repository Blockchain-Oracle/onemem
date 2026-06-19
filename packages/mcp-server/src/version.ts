import { createRequire } from "node:module";

const requirePackageJson = createRequire(import.meta.url);
const packageJson = requirePackageJson("../package.json") as { version?: string };

export const VERSION = packageJson.version ?? "0.0.0";
