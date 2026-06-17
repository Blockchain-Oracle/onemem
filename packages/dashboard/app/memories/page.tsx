import { fetchMemories } from "@/lib/memory";
import { NETWORK } from "@/lib/trace";
import { MemoriesView } from "./MemoriesView";

export const dynamic = "force-dynamic";

export default async function MemoriesPage() {
  let memories: Awaited<ReturnType<typeof fetchMemories>> = [];
  let error: string | null = null;
  try {
    memories = await fetchMemories(undefined, 200);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }
  return (
    <MemoriesView
      memories={memories}
      error={error}
      network={NETWORK}
      activeNamespaceId={process.env.ONEMEM_NAMESPACE_ID ?? null}
    />
  );
}
