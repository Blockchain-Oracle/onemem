import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node20",
  clean: true,
  sourcemap: true,
  // oc-memwal + openclaw are big runtime deps — keep them external (loaded from
  // node_modules), not bundled into the plugin.
  external: ["openclaw", "@mysten-incubation/oc-memwal", "@onemem/sdk-ts"],
});
