import { localCredentialSummary } from "@/lib/local-credentials";
import { NETWORK } from "@/lib/network";
import { SettingsView } from "./SettingsView";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const credentials = localCredentialSummary();
  return (
    <SettingsView
      address={credentials.suiAddress}
      credentials={credentials}
      network={NETWORK}
      namespaceId={process.env.ONEMEM_NAMESPACE_ID ?? null}
    />
  );
}
