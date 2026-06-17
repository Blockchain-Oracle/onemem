import { type CapabilityRow, fetchCapabilities, fetchNamespace } from "@/lib/namespaces";
import { NETWORK } from "@/lib/trace";
import { ShareView } from "./ShareView";

export const dynamic = "force-dynamic";

export default async function SharePage() {
  const namespaceId = process.env.ONEMEM_NAMESPACE_ID ?? null;
  let namespace: {
    id: string;
    owner: string;
    name: string;
    kind: number;
    active: boolean;
  } | null = null;
  let capabilities: CapabilityRow[] = [];
  let loadError: string | null = null;

  if (namespaceId) {
    try {
      [namespace, capabilities] = await Promise.all([
        fetchNamespace(namespaceId),
        fetchCapabilities(namespaceId),
      ]);
    } catch (error) {
      loadError = error instanceof Error ? error.message : String(error);
    }
  }

  return (
    <ShareView
      adminCapId={process.env.ONEMEM_ADMIN_CAP_ID ?? null}
      capabilities={capabilities}
      loadError={loadError}
      namespace={namespace}
      namespaceId={namespaceId}
      network={NETWORK}
    />
  );
}
