import { HostedShareView } from "./HostedShareView";

export const dynamic = "force-dynamic";

function hostedNetwork(): string {
  const network = process.env.NEXT_PUBLIC_SUI_NETWORK ?? process.env.SUI_NETWORK ?? "testnet";
  return network === "mainnet" || network === "devnet" || network === "testnet"
    ? network
    : "testnet";
}

export default function HostedSharePage() {
  return <HostedShareView network={hostedNetwork()} />;
}
