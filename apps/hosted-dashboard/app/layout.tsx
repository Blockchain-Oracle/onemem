import type { Metadata } from "next";
import type { ReactNode } from "react";
import { HostedProviders } from "@/components/HostedProviders";
import { ThemeScript } from "@/components/ThemeScript";
import "@mysten/dapp-kit/dist/index.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "OneMem",
  description: "Verifiable AI agent memory + action traces — verify any session on-chain.",
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
