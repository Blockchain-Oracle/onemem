import { fetchUnifiedSessionGroups } from "@/lib/sessions";
import { SessionsView } from "./SessionsView";

export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  let groups: Awaited<ReturnType<typeof fetchUnifiedSessionGroups>> = [];
  let error: string | null = null;
  try {
    groups = await fetchUnifiedSessionGroups(100);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return <SessionsView groups={groups} error={error} />;
}
