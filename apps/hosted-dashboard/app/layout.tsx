import type { Metadata } from "next";
import type { ReactNode } from "react";
import { HostedProviders } from "@/components/HostedProviders";
import { ThemeScript } from "@/components/ThemeScript";
import "@mysten/dapp-kit/dist/index.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "OneMem",
  description:
    "Decentralized AI agent memory — encrypted on Walrus with Seal via MemWal, owned by you.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <HostedProviders>{children}</HostedProviders>
      </body>
    </html>
  );
}
