"use client";

import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { Icon } from "@/components/Icon";

function shortId(value: string | null | undefined): string {
  if (!value) return "none";
  return value.length > 22 ? `${value.slice(0, 12)}...${value.slice(-8)}` : value;
}

export function ShareCapabilityAccountHint({
  ownerAddress,
}: {
  readonly ownerAddress: string | null;
}) {
  const account = useCurrentAccount();
  const connected = account?.address ?? null;
  const matches =
    !!connected && !!ownerAddress && connected.toLowerCase() === ownerAddress.toLowerCase();

  return (
    <div className={`verify-mini ${matches ? "ok" : ""}`} style={{ marginTop: 14 }}>
      <span className="vm-ic">
        <Icon name={matches ? "check" : "wallet"} size={16} />
      </span>
      <span>
        {connected ? (
          <>
            Connected as <span className="mono">{shortId(connected)}</span>
            {ownerAddress ? (
              matches ? (
                <>. This wallet owns the capability object.</>
              ) : (
                <>
                  . The capability owner is <span className="mono">{shortId(ownerAddress)}</span>.
                </>
              )
            ) : (
              <>. This object is not address-owned.</>
            )}
          </>
        ) : (
          <>
            Connect the recipient wallet to compare it with the on-chain capability owner. No claim
            transaction is required by the current contract.
          </>
        )}
      </span>
      <span style={{ marginLeft: "auto" }}>
        <ConnectButton className="btn btn-ghost btn-sm" connectText="Connect" />
      </span>
    </div>
  );
}
