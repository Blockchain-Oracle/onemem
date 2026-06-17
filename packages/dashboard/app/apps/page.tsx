import { fetchRuntimeInventory } from "@/lib/runtimes";
import { AppsView } from "./AppsView";

export const dynamic = "force-dynamic";

export default async function AppsPage() {
  let inventory: Awaited<ReturnType<typeof fetchRuntimeInventory>>;
  try {
    inventory = await fetchRuntimeInventory();
  } catch (e) {
    inventory = {
      controlsFile: "unavailable",
      traceError: e instanceof Error ? e.message : String(e),
      runtimes: [],
    };
  }
  return (
    <AppsView
      controlsFile={inventory.controlsFile}
      initialRows={inventory.runtimes}
      traceError={inventory.traceError}
    />
  );
}
